import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to generate random emails to avoid collision during testing
const randId = () => Math.random().toString(36).substring(7);

async function runRLSVerification() {
  console.log("========================================");
  console.log("PHASE 1: RLS Verification Matrix Loop");
  console.log("========================================\n");

  try {
    // ---------------------------------------------------------
    // TEST 1: UNAUTHORIZED ACCESS
    // ---------------------------------------------------------
    console.log("[TEST 1] Testing Unauthenticated Access...");
    // Clear any potential active local session 
    await supabase.auth.signOut();
    
    const unauthFetch = await supabase.from('interview_sessions').select('*').limit(1);
    const unauthPassed = unauthFetch.error !== null || (unauthFetch.data && unauthFetch.data.length === 0);
    
    if (unauthPassed) {
       console.log("✅ SUCCESS: Unauthenticated access blocked natively.");
       if (unauthFetch.data) console.log("   (Returned 0 rows as expected under RLS)");
    } else {
       console.log("❌ FAILED: Unauthenticated user retrieved data! RLS IS NOT ACTIVE.");
    }

    // ---------------------------------------------------------
    // TEST 2: AUTHENTICATED ACCESS
    // ---------------------------------------------------------
    console.log("\n[TEST 2] Testing Authenticated Access (User A)...");
    const emailA = `test_user_A_${randId()}@nexhire-debug.com`;
    const pwdA = "TestStr0ngPwd123!";
    
    console.log(`   Attempting to provision User A: ${emailA}`);
    const { data: userAData, error: userAError } = await supabase.auth.signUp({ 
      email: emailA, password: pwdA 
    });

    if (userAError) {
      console.log("   ⚠️ Skipping Test 2 & 3: Failed to mock User A (Auth Signups may be globally disabled or rate-limited).", userAError.message);
      return;
    }

    // Insert dummy session for User A
    console.log("   Creating mock interview_session owned by User A...");
    const { data: sessionData, error: sessionErr } = await supabase
      .from('interview_sessions')
      .insert({ user_id: userAData.user?.id, role: 'Software Engineer' })
      .select('id')
      .single();

    if (sessionErr) {
       console.log("   ❌ FAILED: User A cannot insert their own data. Check RLS INSERT policy.", sessionErr);
    } else {
       // Validate fetching your own data works correctly
       const { data: fetchA } = await supabase.from('interview_sessions').select('*').eq('id', sessionData.id);
       if (fetchA && fetchA.length > 0) {
         console.log("✅ SUCCESS: User A successfully accessed their own strictly isolated row.");
       } else {
         console.log("❌ FAILED: User A could not verify fetch of own data. Check RLS SELECT policy.");
       }
    }

    // ---------------------------------------------------------
    // TEST 3: CROSS-USER ISOLATION
    // ---------------------------------------------------------
    if (sessionData) {
      console.log("\n[TEST 3] Testing Cross-User Isolation (User B accessing User A)...");
      await supabase.auth.signOut(); // Ensure User A logs out
      
      const emailB = `test_user_B_${randId()}@nexhire-debug.com`;
      console.log(`   Attempting to provision User B: ${emailB}`);
      
      const { error: userBError } = await supabase.auth.signUp({ 
         email: emailB, password: pwdA 
      });

      if (!userBError) {
        // User B is now logged in. Try to brutally select User A's session explicitly.
        const { data: hostileFetch, error: hostileError } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', sessionData.id);

        const hostilePassed = hostileError !== null || (hostileFetch && hostileFetch.length === 0);
        
        if (hostilePassed) {
           console.log("✅ SUCCESS: User B actively prevented from reading User A data!");
        } else {
           console.log("❌ CRITICAL FAILURE: User B read User A data! RLS IS LEAKING.");
        }
      } else {
        console.log("   ⚠️ Skipping Test 3: Failed to mock User B.", userBError.message);
      }
    }
    
    // Cleanup generated mock users
    await supabase.auth.signOut();

  } catch (err) {
    console.error("FATAL SCRIPT ERROR:", err);
  }
}

runRLSVerification();
