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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL || 'read-it-out-ten.vercel.app'}`;

bot.start((ctx) => {
  return ctx.reply('👋 Welcome to Leyu & Mahi Bot!\n\nSubmit your fan stories – we\'ll read the best ones on our videos!', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: 'Open', web_app: { url: APP_URL } }]],
    },
  });
});

bot.action('submit_via_chat', (ctx) => {
  return ctx.answerCbQuery().then(() =>
    ctx.reply(
      'Use /submit_story followed by your story.\n\nExample:\n/submit_story This is my funny story about...',
      { parse_mode: 'HTML' }
    )
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
      .select('id, submission_number')
      .single();

    if (error) {
      console.error('Story insert error:', error);
      return ctx.reply('❌ Something went wrong. Please try again later.');
    }

    const trackId = data.submission_number != null ? `#${data.submission_number}` : `\`${data.id.slice(0, 8)}\``;
    return ctx.reply(
      `✅ Story submitted successfully!\n\nYour submission ${trackId} — save this to track it.\n\n` +
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

async function saveNotification(storyId, telegramUserId, type, message, youtubeLink = null) {
  try {
    await supabase.from('notifications').insert({
      story_id: storyId,
      telegram_user_id: telegramUserId,
      type,
      youtube_link: youtubeLink,
      message,
      success: true,
    });
  } catch (e) {
    console.error('saveNotification error:', e);
  }
}

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
      .select('id, telegram_user_id')
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

    const fanMessage = `Your story was not selected for this video.\n\nReason: ${reason}\n\nThanks for submitting – we hope to feature you next time! 🙏`;
    try {
      await ctx.telegram.sendMessage(match.telegram_user_id, fanMessage);
      await saveNotification(match.id, match.telegram_user_id, 'rejected', fanMessage);
    } catch (sendErr) {
      console.error('Failed to notify fan:', sendErr);
    }

    return ctx.reply(
      `🚫 Story \`${match.id.slice(0, 8)}\` rejected. Fan notified.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('reject error:', err);
    return ctx.reply('❌ Something went wrong.');
  }
});

bot.command('select_for_video', requireAdmin, async (ctx) => {
  const text = ctx.message.text || '';
  const rest = text.replace(/^\/select_for_video\s*/i, '').trim();

  const urlMatch = rest.match(/^(https?:\/\/[^\s]+)\s+(.+)$/s);
  if (!urlMatch) {
    return ctx.reply(
      'Usage: /select_for_video &lt;youtube_url&gt; &lt;id1&gt; [id2] [id3] ...\n\n' +
        'Example: /select_for_video https://youtu.be/abc123 1 2 3\n\n' +
        'Stories by submission # or UUID. Fans get notified with the link.',
      { parse_mode: 'HTML' }
    );
  }

  const [, youtubeUrl, idsStr] = urlMatch;
  const ids = idsStr.trim().split(/\s+/).filter(Boolean);

  if (ids.length === 0) {
    return ctx.reply('❌ Provide at least one story ID.');
  }

  try {
    const { data: allStories } = await supabase
      .from('stories')
      .select('id, submission_number, telegram_user_id')
      .in('status', ['pending', 'approved'])
      .limit(100);

    const selected = [];
    for (const id of ids) {
      const match = allStories?.find(
        (s) =>
          s.id === id ||
          (typeof s.id === 'string' && s.id.startsWith(id)) ||
          String(s.submission_number) === id
      );
      if (match) selected.push(match);
    }

    if (selected.length !== ids.length) {
      return ctx.reply(`❌ Could not find all stories. Found ${selected.length}/${ids.length}. Use submission # from the dashboard.`);
    }

    const fanMessage =
      `🎉 Your story was read by Leyu & Mahi!\n\n` +
      `Watch it here: ${youtubeUrl}\n\n` +
      `Thanks for being part of our community! ❤️`;

    let sent = 0;
    for (const story of selected) {
      try {
        await supabase
          .from('stories')
          .update({
            youtube_link: youtubeUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', story.id);

        await ctx.telegram.sendMessage(story.telegram_user_id, fanMessage);
        await saveNotification(story.id, story.telegram_user_id, 'featured', fanMessage, youtubeUrl);
        sent++;
      } catch (e) {
        console.error('select_for_video notify error:', e);
      }
    }

    return ctx.reply(
      `✅ ${sent}/${selected.length} fans notified. Video link saved to stories.`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error('select_for_video error:', err);
    return ctx.reply('❌ Something went wrong.');
  }
});

module.exports = { bot };
