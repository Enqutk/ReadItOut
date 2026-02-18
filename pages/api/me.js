/**
 * API: Get current user info (validates Telegram initData, returns isAdmin)
 */

const { validateInitData } = require('../../lib/telegram-auth');

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map(Number);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const initData = req.query.initData || '';
  const user = validateInitData(initData, process.env.BOT_TOKEN);

  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const isAdmin = ADMIN_IDS.includes(user.id);

  return res.status(200).json({
    userId: user.id,
    username: user.username,
    isAdmin,
  });
}
