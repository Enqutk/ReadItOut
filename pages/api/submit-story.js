/**
 * API: Submit story from Mini App (validates Telegram initData)
 */

const { supabase } = require('../../lib/supabase');
const { validateInitData } = require('../../lib/telegram-auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, category, anonymous, initData } = req.body || {};

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Story content is required' });
  }

  const trimmed = content.trim();
  if (trimmed.length < 20) {
    return res.status(400).json({ error: 'Story must be at least 20 characters' });
  }
  if (trimmed.length > 4096) {
    return res.status(400).json({ error: 'Story must be 4096 characters or less' });
  }

  const user = validateInitData(initData, process.env.BOT_TOKEN);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please open the app from Telegram.' });
  }

  try {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        telegram_user_id: user.id,
        telegram_username: anonymous ? null : (user.username || null),
        content: trimmed,
        category: category || null,
        status: 'pending',
      })
      .select('id, submission_number')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ id: data.id, submission_number: data.submission_number });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
