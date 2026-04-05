import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 rounded-full h-16 w-16 bg-indigo-500/10 border border-indigo-500/20 animate-ping opacity-75"></div>
        {/* Inner static background */}
        <div className="h-16 w-16 bg-indigo-500/[0.05] rounded-full flex items-center justify-center border border-indigo-500/10 z-10 backdrop-blur-sm">
          <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
        </div>
      </div>
      <h3 className="mt-6 text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Loading Workspace...</h3>
      <p className="mt-1.5 text-[13px] text-gray-500">Securely fetching your intelligence profile.</p>
    </div>
  );
}
