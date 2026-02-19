/**
 * One-time setup: set the bot's default Menu Button so "Open" appears in the chat list (like BotFather).
 * Call after deploy: GET /api/set-menu-button?secret=YOUR_ADMIN_API_SECRET
 */

const { setMenuButtonDefault } = require('../../lib/bot');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = req.query.secret || '';
  const expected = process.env.ADMIN_API_SECRET || '';
  if (!expected || secret !== expected) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const result = await setMenuButtonDefault();
  if (!result.ok) {
    return res.status(500).json({ error: result.error || 'Failed' });
  }
  return res.status(200).json({ success: true, message: 'Menu button set. Restart Telegram or re-open the chat list to see "Open".' });
}
