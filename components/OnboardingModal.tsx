"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, ArrowLeft, Upload, Target, UserCircle } from "lucide-react";
import Link from "next/link";

interface OnboardingModalProps {
  hasResume: boolean;
}

export function OnboardingModal({ hasResume }: OnboardingModalProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");

  useEffect(() => {
    if (hasResume) return;
    const onboarded = localStorage.getItem("prepzo_onboarded");
    if (!onboarded) {
      setShow(true);
    }
  }, [hasResume]);

  const handleComplete = useCallback(() => {
    localStorage.setItem("prepzo_onboarded", "true");
    setShow(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    if (show) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [show, handleDismiss]);

  if (!show) return null;

  const progress = Math.round((step / 3) * 100);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeInUp"
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
    >
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111827]/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-white/[0.06] mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl bg-indigo-500/10 p-4">
                <UserCircle className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Prepzo 👋</h2>
            <p className="text-[13px] text-gray-500 mb-6">Let&apos;s set up your profile for personalized coaching.</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-[#0B0F19] px-4 py-2.5 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all focus:border-indigo-500/40 mb-3"
            />
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target role (e.g. Frontend Developer)"
              className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-[#0B0F19] px-4 py-2.5 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all focus:border-indigo-500/40"
            />
          </div>
        )}

        {/* Step 2: Resume Upload */}
        {step === 2 && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl bg-emerald-500/10 p-4">
                <Upload className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Resume</h2>
            <p className="text-[13px] text-gray-500 mb-6">Get questions tailored to your experience and skills.</p>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-400 transition-all"
              onClick={handleDismiss}
            >
              <Upload className="h-4 w-4" />
              Go to Resume Upload
            </Link>
          </div>
        )}

        {/* Step 3: Set Goal */}
        {step === 3 && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl bg-purple-500/10 p-4">
                <Target className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Set Your Goal</h2>
            <p className="text-[13px] text-gray-500 mb-6">What company are you targeting?</p>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="Target company (e.g. Google)"
              className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-[#0B0F19] px-4 py-2.5 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all focus:border-indigo-500/40"
            />
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[13px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-400 transition-all"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-400 transition-all"
              >
                Get Started 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
