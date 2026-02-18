/**
 * API: Mark a story as read (removes from "New")
 */

const { supabase } = require('../../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storyId } = req.body || {};
  if (!storyId) return res.status(400).json({ error: 'storyId required' });

  try {
    const { data: story, error: fetchErr } = await supabase
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .eq('status', 'pending')
      .single();

    if (fetchErr || !story) {
      return res.status(400).json({ error: 'Story not found or already processed' });
    }

    const { error: updateErr } = await supabase
      .from('stories')
      .update({
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', storyId);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
