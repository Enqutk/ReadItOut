/**
 * API: App config (social links, popup for ads/events)
 * Reads from DB first, falls back to env – no auth (public config)
 */

const { supabase } = require('../../lib/supabase');

async function fromDb() {
  try {
    const { data: socialRow } = await supabase.from('app_config').select('value').eq('key', 'social_links').single();
    const { data: popupRow } = await supabase.from('app_config').select('value').eq('key', 'popup').single();
    const socialLinks = (socialRow?.value && typeof socialRow.value === 'object') ? socialRow.value : null;
    const popupRaw = popupRow?.value && typeof popupRow.value === 'object' ? popupRow.value : null;
    const popup = popupRaw?.enabled
      ? {
          id: popupRaw.id || '1',
          title: popupRaw.title || 'Announcement',
          message: popupRaw.message || '',
          link: popupRaw.link || '',
          linkLabel: popupRaw.linkLabel || 'Learn more',
        }
      : null;
    return { socialLinks, popup };
  } catch (_) {
    return null;
  }
}

function fromEnv() {
  const socialLinks = {};
  const socialEnv = {
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE,
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK,
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
    discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD,
  };
  for (const [k, v] of Object.entries(socialEnv)) {
    if (v && typeof v === 'string' && v.trim()) socialLinks[k] = v.trim();
  }
  const popupEnabled = process.env.NEXT_PUBLIC_POPUP_ENABLED === 'true' || process.env.NEXT_PUBLIC_POPUP_ENABLED === '1';
  const popup = popupEnabled
    ? {
        id: process.env.NEXT_PUBLIC_POPUP_ID || '1',
        title: process.env.NEXT_PUBLIC_POPUP_TITLE || 'Announcement',
        message: process.env.NEXT_PUBLIC_POPUP_MESSAGE || '',
        link: process.env.NEXT_PUBLIC_POPUP_LINK || '',
        linkLabel: process.env.NEXT_PUBLIC_POPUP_LINK_LABEL || 'Learn more',
      }
    : null;
  return { socialLinks, popup };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fromDatabase = await fromDb();
  if (fromDatabase !== null) {
    return res.status(200).json({
      socialLinks: fromDatabase.socialLinks || {},
      popup: fromDatabase.popup || null,
    });
  }
  const env = fromEnv();
  return res.status(200).json({ socialLinks: env.socialLinks, popup: env.popup });
}
