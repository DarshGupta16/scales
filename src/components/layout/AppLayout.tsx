import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className = "" }: AppLayoutProps) {
  return (
    <div
      className={`min-h-screen bg-[#050505] relative selection:bg-brand selection:text-white ${className}`}
    >
      {/* Subtle Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-100"
        style={{
          backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>
      {children}
    </div>
  );
}
