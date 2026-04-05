import Link from "next/link";
import { ArrowRight, Target, Users, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden page transition-colors duration-300">
      {/* No theme toggle requested */}

      {/* Background glow specific to landing radial-gradient */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: "radial-gradient(ellipse 800px 400px at 50% -50px, rgba(124,58,237,0.08) 0%, transparent 70%)"
        }} 
      />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-3xl">
        {/* Badge */}
        <div 
          className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--accent-subtle)] px-4 py-1.5 text-[13px] text-[var(--accent)] font-[500]"
          style={{ animation: "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
        >
          <Target className="h-3.5 w-3.5" />
          AI-Powered Interview Coach
        </div>

        {/* Headline */}
        <h1 
          className="font-[800] leading-[1.1] tracking-[-0.03em] flex flex-col items-center" 
          style={{ fontSize: "clamp(40px, 6vw, 72px)", animation: "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
        >
          <span className="text-[var(--text-primary)]">Crack Your Interviews with</span>
          <span 
            className="pb-2"
            style={{ 
              background: "linear-gradient(135deg, #a78bfa, #7c3aed, #6366f1)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent"
            }}
          >
            AI-Powered Practice
          </span>
        </h1>

        {/* Subtext */}
        <p 
          className="max-w-[560px] text-[18px] leading-[1.6] text-[var(--text-secondary)]"
          style={{ animation: "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
        >
          Practice real interview questions, get instant feedback, and track your growth — all in one place.
        </p>

        {/* CTAs */}
        <div 
          className="flex flex-col sm:flex-row items-center gap-4 mt-2"
          style={{ animation: "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
        >
          <Link href="/login">
            <Button variant="primary" className="h-[48px] px-7 text-[15px] group w-full sm:w-auto">
              Start Practicing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div 
          className="flex flex-wrap justify-center items-center gap-6 mt-6 text-[13px] text-[var(--text-secondary)] font-medium"
          style={{ animation: "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
            <span>1,200+ users</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
            <span>5,000+ sessions</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
            <span>94% improvement</span>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heroIn {
          from { opacity:0; transform: translateY(20px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
