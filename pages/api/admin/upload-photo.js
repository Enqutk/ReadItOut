/**
 * API: Upload profile photo (from gallery) – admin only
 * Body: JSON { image: "data:image/jpeg;base64,...", name: "leyu" | "mahi" | "together" }
 */

const { supabase } = require('../../../lib/supabase');
const { validateInitData } = require('../../../lib/telegram-auth');

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map(Number);

const BUCKET = 'profile';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function isAdmin(userId) {
  return ADMIN_IDS.length > 0 && ADMIN_IDS.includes(userId);
}

export const config = {
  api: { bodyParser: { sizeLimit: '6mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const initData = req.headers['x-telegram-init-data'] || req.body?.initData || '';
  const apiSecret = req.headers['x-admin-secret'] || req.body?.adminSecret || '';
  const secretValid = process.env.ADMIN_API_SECRET && apiSecret === process.env.ADMIN_API_SECRET;
  const user = validateInitData(initData, process.env.BOT_TOKEN);
  const isAuth = secretValid || (user && isAdmin(user.id));
  if (!isAuth) {
    return res.status(403).json({ error: 'Admin only.' });
  }

  const { image, name } = req.body || {};
  const validName = ['leyu', 'mahi', 'together'].includes(name) ? name : 'photo';
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'image (data URL) required' });
  }

  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid image: use data URL (data:image/...;base64,...)' });
  }
  const mimeType = match[1];
  const base64Data = match[2];
  if (!ALLOWED_TYPES.some((t) => mimeType.includes(t))) {
    return res.status(400).json({ error: 'Allowed types: JPEG, PNG, WebP, GIF' });
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (_) {
    return res.status(400).json({ error: 'Invalid base64' });
  }
  if (buffer.length > MAX_SIZE) {
    return res.status(400).json({ error: 'Image too large (max 5MB)' });
  }

  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : mimeType.includes('gif') ? 'gif' : 'jpg';
  const path = `${validName}-${Date.now()}.${ext}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return res.status(500).json({
          error: 'Storage bucket "profile" not set up. In Supabase Dashboard go to Storage → New bucket → name "profile" → Public.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
