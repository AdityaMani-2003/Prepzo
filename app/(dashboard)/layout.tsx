"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, FileText, MessageSquare, Timer, TrendingUp,
  LogOut, ChevronDown, Target, Settings, Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Interview", href: "/interview", icon: MessageSquare },
  { label: "Live Interview", href: "/interview/live", icon: Timer },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "History", href: "/history", icon: Clock },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: any) => {
      if (res?.data?.user) setUserEmail(res.data.user.email || null);
    });
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex min-h-screen overflow-hidden w-full page">
      {/* Sidebar */}
      <aside className="flex w-[240px] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 transition-colors duration-300">
        {/* Logo */}
        <div className="pt-[20px] px-[16px] pb-[8px]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group w-fit">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[var(--accent-subtle)] transition-all duration-300">
              <Target className="h-[16px] w-[16px] text-[var(--accent)]" />
            </div>
            <span className="text-[16px] font-[700] text-[var(--text-primary)] tracking-tight">Prepzo</span>
          </Link>
        </div>

        {/* Nav label */}
        <p className="px-[16px] mt-[8px] mb-[4px] text-[10px] font-[600] text-[var(--text-muted)] uppercase tracking-[0.1em]">Menu</p>

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
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-[16px] border-t border-[var(--border-subtle)]" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-[8px] py-[6px] transition-all duration-150 hover:bg-[var(--bg-card)] group -mx-[8px]"
            >
              <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[12px] font-bold text-white shrink-0">
                {initial}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] font-[500] text-[var(--text-muted)] max-w-[160px] truncate">{userEmail || "Loading..."}</p>
              </div>
              <ChevronDown className={`h-[12px] w-[12px] text-[var(--text-muted)] transition-transform duration-250 ${showMenu ? "rotate-180" : ""}`} />
            </button>

            {showMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-[var(--shadow-elevated)] animate-fadeInUp z-50">
                <Link
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-[500] text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-[500] text-[var(--red)] hover:bg-[var(--red-subtle)] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto transition-colors duration-300">
        <div className="flex-1 px-8 py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
