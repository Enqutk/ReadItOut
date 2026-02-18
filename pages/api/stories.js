/**
 * API: Fetch stories with optional filters (status, category, search)
 * Adds story_number (#1, #2...) by submission order
 */

const { supabase } = require('../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status, category, search } = req.query;

  try {
    let query = supabase
      .from('stories')
      .select('id, telegram_user_id, telegram_username, content, category, status, rejection_reason, youtube_link, created_at')
      .order('created_at', { ascending: true })
      .limit(200);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`content.ilike.${term},telegram_username.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const stories = (data || []).map((s, i) => ({ ...s, story_number: i + 1 }));
    return res.status(200).json({ stories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
