const { bot } = require('../../lib/bot');

// Telegraf webhookCallback expects Node.js (req, res) - compatible with Next.js API routes
const webhookCallback = bot.webhookCallback('/api/telegram');

export default function handler(req, res) {
  return webhookCallback(req, res);
}
