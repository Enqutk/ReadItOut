const { Telegraf } = require('telegraf');
const { supabase } = require('./supabase');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.warn('BOT_TOKEN not set – bot commands will not work');
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

module.exports = { bot };
