"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  LogOut,
  CheckCircle2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatarClient } from "@/components/ProfileAvatarClient";
import { createClient } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [targetCompany, setTargetCompany] = useState("");
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user;
      if (user) {
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
      }
    });

    const savedRole = localStorage.getItem("prepzo_target_role");
    const savedCompany = localStorage.getItem("prepzo_target_company");
    const savedAudio = localStorage.getItem("prepzo_autoplay_audio");

    if (savedRole) setTargetRole(savedRole);
    if (savedCompany) setTargetCompany(savedCompany);
    if (savedAudio) setAutoPlayAudio(savedAudio === "true");
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      localStorage.setItem("prepzo_target_role", targetRole);
      localStorage.setItem("prepzo_target_company", targetCompany);
      localStorage.setItem("prepzo_autoplay_audio", String(autoPlayAudio));

      if (fullName) {
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
      }

      setMessage("Settings saved successfully.");
    } catch (err: any) {
      console.error("Save settings failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const initialLetter = fullName ? fullName[0].toUpperCase() : email ? email[0].toUpperCase() : "U";

  return (
    <div className="max-w-4xl mx-auto pb-16 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
          <SettingsIcon className="h-4 w-4" />
          Account & Configuration
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Profile & Preferences
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your candidate profile, interview calibration presets, and voice preferences.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-[var(--green-subtle)] border border-green-500/20 text-xs text-[var(--green)] flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Profile Section */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm space-y-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Personal Information
          </h2>

          <div className="flex items-center gap-5">
            <ProfileAvatarClient initialLetter={initialLetter} />
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Profile Photo</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Click the avatar to preview a custom photo for your session headers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Account Email
              </label>
              <input type="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Interview Calibration */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Interview Calibration Presets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Default Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Target Company / Tier
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Stripe, High-growth Series A"
              />
            </div>
          </div>
        </div>

        {/* Audio & Accessibility */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Voice & Interaction Preferences
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Auto-play Question Speech (TTS)
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Automatically dictate incoming AI questions upon generation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => setAutoPlayAudio(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" loading={saving} className="h-10 px-6 text-xs font-semibold">
            <Save className="h-4 w-4 mr-1.5" />
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Account Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--red)]">Account Session</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Sign out of your Prepzo account on this device.
          </p>
        </div>

        <Button variant="danger" onClick={handleSignOut} className="h-9 px-4 text-xs font-semibold">
          <LogOut className="h-4 w-4 mr-1.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
