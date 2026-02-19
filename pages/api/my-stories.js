/**
 * API: Get stories for current user (validates Telegram initData)
 */

const { supabase } = require('../../lib/supabase');
const { validateInitData } = require('../../lib/telegram-auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const initData = req.query.initData || '';
  const user = validateInitData(initData, process.env.BOT_TOKEN);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please open the app from Telegram.' });
  }

  try {
    const { data, error } = await supabase
      .from('stories')
      .select('id, submission_number, content, category, status, youtube_link, created_at')
      .eq('telegram_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ stories: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
