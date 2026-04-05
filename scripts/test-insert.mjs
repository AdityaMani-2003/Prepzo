// Test Insert
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, adminKey);

async function test() {
  const { data: { users } } = await admin.auth.admin.listUsers();
  const userId = users[0].id;
  
  console.log("Testing insert for user:", userId);
  
  // 1. Try with Admin
  const { data: adminSess, error: adminErr } = await admin.from("interview_sessions").insert({ user_id: userId, role: "Admin Test" }).select();
  if (adminErr) {
    console.log("ADMIN INSERT ERROR:", adminErr);
  } else {
    console.log("ADMIN INSERT SUCCESS");
  }

  // 2. Try with Anon
  const anon = createClient(supabaseUrl, anonKey);
  const { data: anonSess, error: anonErr } = await anon.from("interview_sessions").insert({ user_id: userId, role: "Anon Test" }).select();
  if (anonErr) {
    console.log("ANON INSERT ERROR:", anonErr);
  } else {
    console.log("ANON INSERT SUCCESS");
  }
}

test();
