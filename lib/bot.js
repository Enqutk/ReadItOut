const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.warn('BOT_TOKEN not set – bot commands will not work');
}

const bot = new Telegraf(BOT_TOKEN || 'placeholder');

bot.start((ctx) => {
  return ctx.reply(
    '👋 Welcome to Leyu & Mahi Bot!\n\n' +
      'Submit your fan stories here. We\'ll read the best ones on our videos!\n\n' +
      'Use /submit to share your story.',
    { parse_mode: 'HTML' }
  );
});

module.exports = { bot };
