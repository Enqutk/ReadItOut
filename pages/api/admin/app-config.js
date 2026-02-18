/**
 * API: Update app config (social links, popup) – admin only
 */

const { supabase } = require('../../../lib/supabase');
const { validateInitData } = require('../../../lib/telegram-auth');

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map(Number);

function isAdmin(userId) {
  return ADMIN_IDS.length > 0 && ADMIN_IDS.includes(userId);
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const initData = req.headers['x-telegram-init-data'] || req.body?.initData || '';
  const apiSecret = req.headers['x-admin-secret'] || req.body?.adminSecret || '';
  const secretValid = process.env.ADMIN_API_SECRET && apiSecret === process.env.ADMIN_API_SECRET;
  const user = validateInitData(initData, process.env.BOT_TOKEN);
  const isAuth = secretValid || (user && isAdmin(user.id));
  if (!isAuth) {
    return res.status(403).json({
      error: !initData ? 'Open dashboard from Telegram app, or set ADMIN_API_SECRET to save from browser.' : 'Admin only.',
    });
  }

  if (req.method === 'GET') {
    try {
      const { data: socialRow } = await supabase.from('app_config').select('value').eq('key', 'social_links').single();
      const { data: popupRow } = await supabase.from('app_config').select('value').eq('key', 'popup').single();
      const socialLinks = (socialRow?.value && typeof socialRow.value === 'object') ? socialRow.value : {};
      const popupRaw = popupRow?.value && typeof popupRow.value === 'object' ? popupRow.value : {};
      const popup = {
        enabled: !!popupRaw.enabled,
        id: popupRaw.id || '1',
        title: popupRaw.title || '',
        message: popupRaw.message || '',
        link: popupRaw.link || '',
        linkLabel: popupRaw.linkLabel || 'Learn more',
      };
      return res.status(200).json({ socialLinks, popup });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const { socialLinks: bodySocial, popup: bodyPopup } = req.body || {};

  try {
    if (bodySocial !== undefined) {
      const sanitized = {};
      const keys = ['youtube', 'instagram', 'tiktok', 'twitter', 'discord'];
      for (const k of keys) {
        const v = bodySocial[k];
        if (typeof v === 'string' && v.trim()) sanitized[k] = v.trim();
      }
      await supabase.from('app_config').upsert(
        { key: 'social_links', value: sanitized, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    }
    if (bodyPopup !== undefined) {
      const p = {
        enabled: !!bodyPopup.enabled,
        id: (bodyPopup.id && String(bodyPopup.id).trim()) || '1',
        title: (bodyPopup.title && String(bodyPopup.title).trim()) || '',
        message: (bodyPopup.message && String(bodyPopup.message).trim()) || '',
        link: (bodyPopup.link && String(bodyPopup.link).trim()) || '',
        linkLabel: (bodyPopup.linkLabel && String(bodyPopup.linkLabel).trim()) || 'Learn more',
      };
      await supabase.from('app_config').upsert(
        { key: 'popup', value: p, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
