import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const db = createClient(url, anonKey);

async function checkAnon() {
  console.log("Checking ANON session INSERT...");
  const user_id = '4623a35e-c288-4e1b-8772-23c3167df3c9'; 

  // Try inserting into interview_messages using anonymous key
  const msg = await db.from("interview_messages").insert({ 
    session_id: "72195f00-3333-4444-5555-555f8841fa5a", 
    user_id: user_id, 
    type: "answer", 
    content: "test anon" 
  }).select();
  
  console.log("ANON MSG INSERT:", JSON.stringify(msg));
}
checkAnon();
