"use client";

import { StreakCard } from "@/components/StreakCard";
import { OnboardingModal } from "@/components/OnboardingModal";

export function DashboardClientExtras({ hasResume }: { hasResume: boolean }) {
  return (
    <>
      <OnboardingModal hasResume={hasResume} />
    </>
  );
}
