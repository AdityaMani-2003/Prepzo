"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, ArrowRight, Loader2, Sparkles, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      if (res?.data?.user?.email) {
        setCurrentUser({ email: res.data.user.email });
      }
    });
  }, []);

  const handleSignOutCurrent = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setMessage("Signed out successfully. You can now sign in with a different account.");
    } catch (err: any) {
      setError(err?.message || "Sign out failed");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setOauthLoading(true);
      setError(null);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate Google sign-in.");
      setOauthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

          if (signUpError) throw signUpError;

          if (data.session) {
            router.push("/dashboard");
          } else {
            setMessage("Account created! Please check your email inbox to confirm your account.");
          }
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) throw signInError;

          router.push("/dashboard");
        }
      } catch (err: any) {
        setError(err?.message || "Authentication failed. Please verify credentials.");
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto my-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <Link href="/" className="flex items-center gap-2.5 mb-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] transition-transform group-hover:scale-105">
            <Target className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Prepzo
          </span>
        </Link>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {mode === "signin"
            ? "Sign in to continue your interview preparation"
            : "Get started with personalized AI mock interviews"}
        </p>
      </div>

      {/* Card Container */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-7 shadow-[var(--shadow-elevated)] backdrop-blur-md space-y-5">
        {/* If user is already authenticated */}
        {currentUser && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-[var(--text-secondary)]">
                Currently signed in as <strong className="text-[var(--text-primary)]">{currentUser.email}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Link href="/dashboard" className="flex-1">
                <Button variant="primary" className="w-full h-8 text-xs font-semibold">
                  Go to Dashboard
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                type="button"
                onClick={handleSignOutCurrent}
                className="h-8 text-xs font-medium text-red-400 hover:text-red-300 hover:border-red-500/30"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={oauthLoading || isPending}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-subtle)]" />
          </div>
          <span className="relative bg-[var(--bg-card)] px-3 text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Or with email
          </span>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[var(--red-subtle)] bg-[var(--red-subtle)] p-3 text-xs text-[var(--red)]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[var(--green-subtle)] bg-[var(--green-subtle)] p-3 text-xs text-[var(--green)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            className="w-full justify-center mt-2 py-3"
          >
            {mode === "signin" ? "Sign In" : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                }}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setMessage(null);
                }}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        By continuing, you agree to Prepzo&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
