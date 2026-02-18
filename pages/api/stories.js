/**
 * API: Fetch stories with optional filters (status, category)
 * Used by the admin dashboard
 */

const { supabase } = require('../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status, category } = req.query;

  try {
    let query = supabase
      .from('stories')
      .select('id, telegram_user_id, telegram_username, content, category, status, rejection_reason, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ stories: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
