const crypto = require('crypto');

/**
 * Validate Telegram WebApp initData and extract user
 * @param {string} initData - Raw init data string from Telegram.WebApp.initData
 * @param {string} botToken - Bot token
 * @returns {{ id: number, username?: string } | null} - User object or null if invalid
 */
function validateInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) return null;

    const authDate = parseInt(params.get('auth_date'), 10);
    const maxAge = 86400; // 24 hours
    if (Date.now() / 1000 - authDate > maxAge) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    let user;
    try {
      user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
    } catch {
      return null;
    }
    if (!user?.id) return null;
    return { id: user.id, username: user.username };
  } catch (e) {
    return null;
  }
}

module.exports = { validateInitData };
