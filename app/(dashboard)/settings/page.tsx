import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { User, Mail, Shield, CheckCircle, Smartphone } from "lucide-react";
import { ProfileAvatarClient } from "@/components/ProfileAvatarClient";

export const metadata = {
  title: "Settings — Prepzo",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-7 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Profile Settings</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage your account preferences and personal information.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-2">
           <h3 className="text-[14px] font-[600] text-[var(--text-primary)]">Account Definition</h3>
           <p className="text-[12px] leading-relaxed text-[var(--text-secondary)] text-balance">
             This information is generated from your connected authentication provider. 
           </p>
        </div>
        
        <div className="md:col-span-2 space-y-5">
           <div className="rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-sm">
             <div className="flex items-center gap-5">
               <ProfileAvatarClient initialLetter={initial} />
               <div>
                  <h4 className="text-[16px] font-[600] text-[var(--text-primary)] tracking-tight">Active User</h4>
                  <p className="text-[13px] text-[var(--text-muted)] mt-0.5 font-mono">{user.id}</p>
               </div>
             </div>
             
             <div className="mt-8 grid gap-6 sm:grid-cols-2">
               <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Email Address
                  </label>
                  <div className="flex flex-wrap items-center gap-3 w-full">
                    <p className="text-[14px] font-[500] text-[var(--text-primary)] truncate max-w-full">{user.email}</p>
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--green-subtle)] px-2 py-0.5 text-[10px] font-bold text-[var(--green)] shrink-0">
                       <CheckCircle className="h-2.5 w-2.5" /> Verified
                    </span>
                  </div>
               </div>
               
               <div className="space-y-1.5 min-w-0">
                  <label className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Auth Provider
                  </label>
                  <p className="text-[14px] font-[500] text-[var(--text-primary)] capitalize truncate">
                    {user.app_metadata?.provider || "Google"}
                  </p>
               </div>
               
               <div className="space-y-1.5 min-w-0">
                  <label className="text-[11px] font-[600] uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Smartphone className="h-3 w-3" /> Last Sign In
                  </label>
                  <p className="text-[14px] font-[500] text-[var(--text-primary)] truncate">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown"}
                  </p>
               </div>
             </div>
           </div>
           
           <div className="rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-sm">
              <h3 className="text-[14px] font-[600] text-[var(--text-primary)] mb-4">Account Security</h3>
              <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                 <div>
                    <h4 className="text-[13px] font-[600] text-[var(--text-primary)]">Connected Application</h4>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">Your robust settings are orchestrated securely via Supabase Auth protocols.</p>
                 </div>
                 <span className="px-3 py-1 bg-[var(--border-subtle)] text-[var(--text-muted)] text-[11px] font-[600] rounded-full shrink-0">
                   Managed Externally
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
