/**
 * API: Fetch stories with optional filters (status, category, search)
 * Adds story_number (#1, #2...) by submission order
 */

const { supabase } = require('../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('stories')
      .select('id, telegram_user_id, telegram_username, content, category, status, rejection_reason, youtube_link, created_at')
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const stories = (data || []).map((s, i) => ({ ...s, story_number: i + 1 }));
    return res.status(200).json({ stories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
