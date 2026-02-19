/**
 * API route to insert a test story (for Sprint 1 verification)
 * GET /api/test-story - inserts a test story and returns the result
 * Remove or protect this in production
 */

const { supabase } = require('../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('stories')
    .insert({
      telegram_user_id: 999888777, // test API user
      telegram_username: 'api_test',
      content: 'Test story inserted via /api/test-story for Sprint 1 verification',
      category: 'funny',
      status: 'pending',
    })
    .select('id, created_at')
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Run supabase/migrations/001_schema.sql in Supabase SQL Editor first',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Test story inserted',
    story: { id: data.id, created_at: data.created_at },
  });
}
