const { Telegraf } = require('telegraf');
const { supabase } = require('./supabase');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.warn('BOT_TOKEN not set – bot commands will not work');
}

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map(Number);

function isAdmin(userId) {
  return ADMIN_IDS.length > 0 && ADMIN_IDS.includes(userId);
}

function requireAdmin(ctx, next) {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('⛔ Admin only.');
  }
  return next();
}

const bot = new Telegraf(BOT_TOKEN || 'placeholder');

const MIN_STORY_LENGTH = 20;
const MAX_STORY_LENGTH = 4096;

bot.start((ctx) => {
  return ctx.reply(
    '👋 Welcome to Leyu & Mahi Bot!\n\n' +
      'Submit your fan stories here. We\'ll read the best ones on our videos!\n\n' +
      'Use /submit_story followed by your story to share!',
    { parse_mode: 'HTML' }
  );
});

bot.command('submit', (ctx) => {
  return ctx.reply(
    '📝 Use /submit_story instead!\n\n' +
      'Example:\n/submit_story This is my funny story about...\n\n' +
      'Include your full story in the same message (20+ characters).',
    { parse_mode: 'HTML' }
  );
});

bot.command('submit_story', async (ctx) => {
  const text = ctx.message.text || '';
  const storyContent = text.replace(/^\/submit_story\s*/i, '').trim();

  if (!storyContent) {
    return ctx.reply(
      '📝 Please include your story!\n\n' +
        `Example:\n/submit_story ${'This is my funny story about the time I...'}\n\n` +
        `Story must be ${MIN_STORY_LENGTH}–${MAX_STORY_LENGTH} characters.`,
      { parse_mode: 'HTML' }
    );
  }

  if (storyContent.length < MIN_STORY_LENGTH) {
    return ctx.reply(
      `❌ Story too short. Please write at least ${MIN_STORY_LENGTH} characters.`
    );
  }

  if (storyContent.length > MAX_STORY_LENGTH) {
    return ctx.reply(
      `❌ Story too long. Maximum ${MAX_STORY_LENGTH} characters.`
    );
  }

  try {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        telegram_user_id: ctx.from.id,
        telegram_username: ctx.from.username || null,
        content: storyContent,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Story insert error:', error);
      return ctx.reply('❌ Something went wrong. Please try again later.');
    }

    const shortId = data.id.slice(0, 8);
    return ctx.reply(
      `✅ Story submitted successfully!\n\nYour story ID: \`${shortId}\`\n\n` +
        "We'll review it and may feature it in a video. Thanks for sharing!",
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('submit_story error:', err);
    return ctx.reply('❌ Something went wrong. Please try again later.');
  }
});

bot.command('list_pending', requireAdmin, async (ctx) => {
  try {
    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, content, category, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('list_pending error:', error);
      return ctx.reply('❌ Failed to fetch stories.');
    }

    if (!stories || stories.length === 0) {
      return ctx.reply('📭 No pending stories.');
    }

    const lines = stories.map((s, i) => {
      const shortId = s.id.slice(0, 8);
      const preview = s.content.length > 80 ? s.content.slice(0, 80) + '...' : s.content;
      return `${i + 1}. \`${shortId}\` (${s.category || '—'})\n   ${preview.replace(/\n/g, ' ')}`;
    });

    const msg =
      '📋 <b>Pending stories</b>\n\n' +
      lines.join('\n\n') +
      '\n\n<code>/approve &lt;id&gt;</code> or <code>/reject &lt;id&gt; [reason]</code>';

    return ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('list_pending error:', err);
    return ctx.reply('❌ Something went wrong.');
  }
});

bot.command('approve', requireAdmin, async (ctx) => {
  const text = ctx.message.text || '';
  const id = text.replace(/^\/approve\s*/i, '').trim();

  if (!id) {
    return ctx.reply('Usage: /approve &lt;story_id&gt;', { parse_mode: 'HTML' });
  }

  try {
    const { data: stories } = await supabase
      .from('stories')
      .select('id')
      .eq('status', 'pending')
      .limit(50);

    const match = stories?.find((s) => s.id === id || s.id.startsWith(id));
    if (!match) {
      return ctx.reply('❌ Story not found or already processed.');
    }

    const { error } = await supabase
      .from('stories')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', match.id);

    if (error) {
      console.error('approve error:', error);
      return ctx.reply('❌ Failed to approve.');
    }

    return ctx.reply(`✅ Story \`${match.id.slice(0, 8)}\` approved.`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('approve error:', err);
    return ctx.reply('❌ Something went wrong.');
  }
});

bot.command('reject', requireAdmin, async (ctx) => {
  const text = ctx.message.text || '';
  const rest = text.replace(/^\/reject\s*/i, '').trim();
  const [id, ...reasonParts] = rest.split(/\s+/);
  const reason = reasonParts.join(' ').trim() || 'Does not meet our guidelines.';

  if (!id) {
    return ctx.reply('Usage: /reject &lt;story_id&gt; [reason]', { parse_mode: 'HTML' });
  }

  try {
    const { data: stories } = await supabase
      .from('stories')
      .select('id')
      .eq('status', 'pending')
      .limit(50);

    const match = stories?.find((s) => s.id === id || s.id.startsWith(id));
    if (!match) {
      return ctx.reply('❌ Story not found or already processed.');
    }

    const { error } = await supabase
      .from('stories')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    if (error) {
      console.error('reject error:', error);
      return ctx.reply('❌ Failed to reject.');
    }

    return ctx.reply(
      `🚫 Story \`${match.id.slice(0, 8)}\` rejected.\nReason: ${reason}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('reject error:', err);
    return ctx.reply('❌ Something went wrong.');
  }
});

module.exports = { bot };
