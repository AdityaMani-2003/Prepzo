// Diagnose why /progress shows no data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=== NEXHIRE PROGRESS DIAGNOSTIC ===\n");

// 1. Service role client (bypasses RLS)
const admin = createClient(supabaseUrl, serviceKey);

// 2. Check interview_sessions table
console.log("--- CHECK 1: interview_sessions table ---");
const { data: sessions, error: sessErr } = await admin.from("interview_sessions").select("*").limit(5);
if (sessErr) {
  console.log("ERROR:", sessErr.message, sessErr.hint);
} else {
  console.log(`Found ${sessions.length} sessions:`, JSON.stringify(sessions, null, 2));
}

// 3. Check interview_messages table
console.log("\n--- CHECK 2: interview_messages table ---");
const { data: messages, error: msgErr } = await admin.from("interview_messages").select("*").limit(5);
if (msgErr) {
  console.log("ERROR:", msgErr.message, msgErr.hint);
} else {
  console.log(`Found ${messages.length} messages:`, JSON.stringify(messages, null, 2));
}

// 4. Check evaluation messages specifically
console.log("\n--- CHECK 3: evaluation type messages ---");
const { data: evals, error: evalErr } = await admin.from("interview_messages").select("*").eq("type", "evaluation").limit(5);
if (evalErr) {
  console.log("ERROR:", evalErr.message, evalErr.hint);
} else {
  console.log(`Found ${evals.length} evaluations`);
}

// 5. Check feedback table (legacy data source)
console.log("\n--- CHECK 4: legacy feedback table ---");
const { data: feedback, error: fbErr } = await admin.from("feedback").select("*").limit(5);
if (fbErr) {
  console.log("ERROR:", fbErr.message, fbErr.hint);
} else {
  console.log(`Found ${feedback.length} feedback rows:`, JSON.stringify(feedback?.map(f => ({id: f.id, user: f.user_id, clarity: f.clarity_score, tech: f.technical_score})), null, 2));
}

// 6. Get current auth users
console.log("\n--- CHECK 5: auth users ---");
const { data: { users }, error: usrErr } = await admin.auth.admin.listUsers();
if (usrErr) {
  console.log("ERROR listing users:", usrErr.message);
} else {
  console.log(`Found ${users.length} users:`);
  users.forEach(u => console.log(`  - ${u.id} (${u.email})`));
}

// 7. Now test with ANON key (simulates what the frontend sees with RLS)
console.log("\n--- CHECK 6: RLS test with anon key ---");
const anon = createClient(supabaseUrl, anonKey);
const { data: anonSessions, error: anonSessErr } = await anon.from("interview_sessions").select("*").limit(5);
if (anonSessErr) {
  console.log("ANON interview_sessions ERROR:", anonSessErr.message);
} else {
  console.log(`ANON can see ${anonSessions.length} sessions`);
}

const { data: anonMsgs, error: anonMsgErr } = await anon.from("interview_messages").select("*").limit(5);
if (anonMsgErr) {
  console.log("ANON interview_messages ERROR:", anonMsgErr.message);
} else {
  console.log(`ANON can see ${anonMsgs.length} messages`);
}

console.log("\n=== DIAGNOSTIC COMPLETE ===");
