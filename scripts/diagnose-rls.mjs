import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log("=== DIAGNOSING ANALYTICS TABLES ===");

  // 1. Check if tables exist and listing their columns
  const tables = ['interview_sessions', 'interview_messages'];
  
  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    const { data: policies, error: pErr } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', table);
      
    if (pErr) {
       console.log(`Could not fetch policies via pg_policies (likely not exposed): ${pErr.message}`);
    } else {
       console.log("Policies:", policies.length > 0 ? policies.map(p => p.policyname) : "NONE - Deny All by default!");
    }

    const { data: sample, error: sErr } = await supabase.from(table).select('*').limit(1);
    if (sErr) {
      console.error(`Error accessing table ${table}: ${sErr.message}`);
    } else {
      console.log(`Table ${table} is accessible via Service Role.`);
    }
  }

  // 2. Check if there are ANY records at all
  const { data: sessions } = await supabase.from('interview_sessions').select('id');
  const { data: messages } = await supabase.from('interview_messages').select('id');
  
  console.log(`\nTotal sessions in DB: ${sessions?.length || 0}`);
  console.log(`Total messages in DB: ${messages?.length || 0}`);

  // 3. Check for specific user data
  const targetUser = '46518132-16d4-4fbe-a630-2be85285bde1';
  const { data: userSessions } = await supabase.from('interview_sessions').select('id').eq('user_id', targetUser);
  console.log(`Total sessions for target user: ${userSessions?.length || 0}`);
}

diagnose();
