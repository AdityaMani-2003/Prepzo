import { createClient } from "@/lib/supabaseServer";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("[Auth Callback] Exchange error:", error.message);
    } catch (err) {
      console.error("[Auth Callback] Unexpected error:", err);
    }
  }

  // Return user to login with error parameter if exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
