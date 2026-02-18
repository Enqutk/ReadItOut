/**
 * API: App config (social links, popup for ads/events)
 * Reads from env vars – no auth required (public config)
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  return res.status(200).json({ socialLinks, popup });
}
