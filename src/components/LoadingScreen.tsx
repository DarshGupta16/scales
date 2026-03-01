import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isVisible: boolean;
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 30 + 20;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center font-mono selection:bg-brand selection:text-white"
        >
          {/* Matrix Rain Effect Placeholder (Subtle) */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
            <div className="flex justify-around w-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -100 }}
                  animate={{ y: 1000 }}
                  transition={{ 
                    duration: Math.random() * 3 + 2, 
                    repeat: Infinity, 
                    ease: "linear",
                    delay: Math.random() * 2 
                  }}
                  className="text-brand text-[8px] leading-none whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {Array.from({ length: 50 }).map(() => 
                    String.fromCharCode(0x30A0 + Math.random() * 96)
                  ).join('')}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 w-full max-w-md px-12">
            {/* Status Header */}
            <div className="flex justify-between items-end mb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
                  System Initialization
                </p>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                  Booting Matrix<span className="animate-pulse text-brand">_</span>
                </h2>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-brand italic">
                  {Math.floor(progress)}%
                </span>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
              {/* The actual progress bar */}
              <motion.div
                className="absolute inset-y-0 left-0 bg-brand shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>

            {/* Sub-status lines */}
            <div className="mt-8 space-y-2">
              {[
                "Calibrating Neural Pathways",
                "Synchronizing Data Streams",
                "Initializing Visual Renderers",
                "Establishing secure handshake"
              ].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: progress > (i + 1) * 20 ? 1 : 0.2, 
                    x: progress > (i + 1) * 20 ? 0 : -10 
                  }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-1 h-1 rounded-full ${progress > (i + 1) * 20 ? 'bg-brand' : 'bg-zinc-800'}`} />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Branding Footer */}
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.5em]">
              Scales v1.0 // System Kernel
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
