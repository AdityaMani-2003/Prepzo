"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Timer,
  TrendingUp,
  LogOut,
  Target,
  Settings,
  Clock,
  User,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Interview Arena", href: "/interview", icon: MessageSquare },
  { label: "Live Voice Mode", href: "/interview/live", icon: Timer },
  { label: "Resume Analysis", href: "/resume", icon: FileText },
  { label: "Analytics & Plan", href: "/progress", icon: TrendingUp },
  { label: "Session History", href: "/history", icon: Clock },
  { label: "Profile & Settings", href: "/settings", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: any) => {
      const u = res?.data?.user;
      if (u) {
        setUserEmail(u.email || null);
        setFullName(u.user_metadata?.full_name || null);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      window.location.href = "/login";
    }
  };

  const initial = fullName
    ? fullName.charAt(0).toUpperCase()
    : userEmail
    ? userEmail.charAt(0).toUpperCase()
    : "U";

  // Derive human-readable page name for top bar
  const currentNav = navItems.find((n) => n.href === pathname);
  const pageTitle = currentNav?.label || "Workspace";

  return (
    <div className="flex min-h-screen overflow-hidden w-full page">
      {/* Sidebar */}
      <aside className="flex w-[240px] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 transition-colors duration-300">
        {/* Logo */}
        <div className="pt-[20px] px-[16px] pb-[8px]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group w-fit">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[var(--accent-subtle)] transition-all duration-300 group-hover:scale-105">
              <Target className="h-[16px] w-[16px] text-[var(--accent)]" />
            </div>
            <span className="text-[16px] font-[700] text-[var(--text-primary)] tracking-tight">Prepzo</span>
          </Link>
        </div>

        {/* Nav label */}
        <p className="px-[16px] mt-[8px] mb-[4px] text-[10px] font-[600] text-[var(--text-muted)] uppercase tracking-[0.1em]">Navigation</p>

        <nav className="flex flex-1 flex-col gap-0.5 mt-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-[10px] rounded-[var(--radius-md)] px-[12px] py-[8px] mx-[8px] text-[14px] transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-[600]"
                    : "text-[var(--text-secondary)] font-[500] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
                }`}
              >
                <item.icon className={`h-[16px] w-[16px] transition-colors duration-150 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"}`} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom Profile Card */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 rounded-xl p-2 transition-all duration-150 ${
              pathname === "/settings"
                ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                : "hover:bg-[var(--bg-card)] text-[var(--text-primary)]"
            }`}
            title="Manage candidate profile & settings"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
                {fullName || "Candidate"}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                {userEmail || "View Profile"}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Sign out of Prepzo"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto transition-colors duration-300">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 backdrop-blur-md">
          {/* Breadcrumb / Section Name */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Prepzo
            </span>
            <span className="text-xs text-[var(--text-muted)]">/</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {pageTitle}
            </span>
          </div>

          {/* Quick Header Actions: Profile and Sign Out */}
          <div className="flex items-center gap-3">
            {/* Direct Profile Button */}
            <Link
              href="/settings"
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                pathname === "/settings"
                  ? "bg-[var(--accent-subtle)] border-indigo-500/40 text-[var(--accent)] font-semibold"
                  : "bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              }`}
              title="Open Profile & Settings"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white shrink-0">
                {initial}
              </div>
              <span className="hidden sm:inline font-semibold">Profile</span>
            </Link>

            {/* Direct Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Sign out of Prepzo"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <div className="flex-1 px-6 sm:px-8 py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
