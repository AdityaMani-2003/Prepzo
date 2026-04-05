import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(url, key);

async function check() {
  console.log("Checking session INSERT...");
  const user_id = '4623a35e-c288-4e1b-8772-23c3167df3c9'; // hardcoded from earlier
  
  // Try inserting into interview_sessions
  const sess = await db.from("interview_sessions").insert({ user_id: user_id, role: "test" }).select();
  console.log("SESS INSERT:", JSON.stringify(sess));

  // Try inserting into interview_messages
  const msg = await db.from("interview_messages").insert({ 
    session_id: "72195f00-3333-4444-5555-555f8841fa5a", // random uuid
    user_id: user_id, 
    type: "answer", 
    content: "t" 
  }).select();
  console.log("MSG INSERT:", JSON.stringify(msg));
}
check();
