/**
 * Test script: Insert a sample story into Supabase
 * Run: node scripts/insert-test-story.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Create .env.local with these variables. See .env.example');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestStory() {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      telegram_user_id: 123456789, // test user ID
      telegram_username: 'test_fan',
      content: 'This is a test story for Sprint 1. Leyu and Mahi are awesome!',
      category: 'love',
      status: 'pending',
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('Insert failed:', error.message);
    console.error('Make sure you ran the migration: supabase/migrations/001_create_stories.sql');
    process.exit(1);
  }

  console.log('✅ Test story inserted successfully!');
  console.log('  ID:', data.id);
  console.log('  Created:', data.created_at);
}

insertTestStory();
