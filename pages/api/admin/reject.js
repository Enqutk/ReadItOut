/**
 * API: Reject a story and notify the fan
 */

const { supabase } = require('../../../lib/supabase');

async function sendTelegram(userId, text) {
  const token = process.env.BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: userId, text }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storyId, reason } = req.body || {};
  if (!storyId) return res.status(400).json({ error: 'storyId required' });

  const rejectionReason = (reason && typeof reason === 'string' ? reason.trim() : '') || 'Does not meet our guidelines.';

  try {
    const { data: story, error: fetchErr } = await supabase
      .from('stories')
      .select('id, telegram_user_id')
      .eq('id', storyId)
      .eq('status', 'pending')
      .single();

    if (fetchErr || !story) {
      return res.status(400).json({ error: 'Story not found or already processed' });
    }

    const { error: updateErr } = await supabase
      .from('stories')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storyId);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    const fanMessage =
      `Your story was not selected for this video.\n\n` +
      `Reason: ${rejectionReason}\n\n` +
      `Thanks for submitting – we hope to feature you next time! 🙏`;
    await sendTelegram(story.telegram_user_id, fanMessage);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
