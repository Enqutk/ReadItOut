/**
 * API: Add video link to selected stories and notify fans
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

  const { storyIds, youtubeLink } = req.body || {};
  if (!Array.isArray(storyIds) || storyIds.length === 0 || !youtubeLink || typeof youtubeLink !== 'string') {
    return res.status(400).json({ error: 'storyIds (array) and youtubeLink (string) required' });
  }

  const url = youtubeLink.trim();
  if (!url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid YouTube link' });
  }

  try {
    const { data: stories, error: fetchErr } = await supabase
      .from('stories')
      .select('id, telegram_user_id')
      .in('id', storyIds);

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!stories || stories.length === 0) return res.status(400).json({ error: 'No stories found' });

    const fanMessage =
      `🎉 Your story was read by Leyu & Mahi!\n\n` +
      `Watch it here: ${url}\n\n` +
      `Thanks for being part of our community! ❤️`;

    let notified = 0;
    for (const s of stories) {
      await supabase
        .from('stories')
        .update({ youtube_link: url, updated_at: new Date().toISOString() })
        .eq('id', s.id);
      if (await sendTelegram(s.telegram_user_id, fanMessage)) notified++;
    }

    return res.status(200).json({
      success: true,
      updated: stories.length,
      notified,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
