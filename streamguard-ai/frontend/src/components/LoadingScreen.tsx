import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Cpu } from 'lucide-react';

interface LoadingScreenProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  submessage?: string;
  showBadges?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  fullScreen = true,
  size = 'md',
  message = 'Initializing sovereign fraud pipeline...',
  submessage = 'Calibrating real-time defense telemetry & threat models',
  showBadges = true,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const shieldSize = isSm ? 44 : isLg ? 88 : 64;
  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05080F]/95 backdrop-blur-xl'
    : 'relative w-full flex flex-col items-center justify-center py-12 px-4';

  return (
    <div className={containerClass} role="status" aria-label="Loading Flowshield AI">
      {/* Background Ambient Radial Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none -z-10" />

      {/* Center Radar / Shield Animation Hub */}
      <div className="relative flex items-center justify-center">
        {/* Sonar Pulse Ring 1 */}
        <motion.div
          animate={{
            scale: [1, 2.2, 2.8],
            opacity: [0.6, 0.2, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute rounded-full border border-cyan-400/40 pointer-events-none"
          style={{
            width: shieldSize + 32,
            height: shieldSize + 32,
          }}
        />

        {/* Sonar Pulse Ring 2 (Staggered) */}
        <motion.div
          animate={{
            scale: [1, 2.2, 2.8],
            opacity: [0.5, 0.15, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: 0.8,
            ease: 'easeOut',
          }}
          className="absolute rounded-full border border-cyan-500/30 pointer-events-none"
          style={{
            width: shieldSize + 32,
            height: shieldSize + 32,
          }}
        />

        {/* Outer Rotating Dashed Tech Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute rounded-full border border-dashed border-cyan-500/25 pointer-events-none"
          style={{
            width: shieldSize + 56,
            height: shieldSize + 56,
          }}
        />

        {/* Rotating High-Speed Radar Sweep Beam */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: shieldSize + 28,
            height: shieldSize + 28,
            background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0) 0deg, rgba(6, 182, 212, 0.05) 260deg, rgba(34, 211, 238, 0.45) 360deg)',
          }}
        />

        {/* Shield Outer Container with Neon Border & Inner Glow */}
        <div
          className="relative z-10 flex items-center justify-center rounded-2xl bg-[#080D15] border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
          style={{
            width: shieldSize + 16,
            height: shieldSize + 16,
          }}
        >
          {/* Breathing Shield SVG */}
          <motion.svg
            animate={{
              scale: [0.95, 1.05, 0.95],
              filter: [
                'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))',
                'drop-shadow(0 0 16px rgba(34, 211, 238, 0.8))',
                'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            width={shieldSize}
            height={shieldSize}
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Shield Plate */}
            <path
              d="M185 38 L60 85 V195 C60 285 185 355 185 355 V38 Z"
              fill="#22D3EE"
            />
            {/* Right Shield Plate */}
            <path
              d="M215 38 L340 85 V195 C340 285 215 355 215 355 V38 Z"
              fill="#06B6D4"
              opacity="0.8"
            />
            {/* Interlocking Secure Center Ring */}
            <circle
              cx="200"
              cy="190"
              r="65"
              className="fill-[#080D15]"
              stroke="#A5F3FC"
              strokeWidth="22"
            />
            {/* Inner Lock Core Emblem */}
            <path
              d="M200 162 L228 178 V207 C228 223 200 234 200 234 C200 234 172 223 172 207 V178 L200 162 Z"
              fill="#22D3EE"
            />
          </motion.svg>

          {/* Vertical Scan Beam Line */}
          <motion.div
            animate={{
              top: ['5%', '90%', '5%'],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_8px_#22d3ee] pointer-events-none"
          />
        </div>
      </div>

      {/* Telemetry Labels & Shimmer Progress Bar */}
      <div className="mt-8 flex flex-col items-center text-center max-w-sm px-4">
        {/* Pulsing Status Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-medium tracking-wider mb-2.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span className="uppercase text-[11px] font-semibold tracking-widest">Sovereign Radar</span>
        </div>

        {/* Primary Message */}
        <h3 className="text-white text-base font-semibold tracking-tight">
          {message}
        </h3>

        {/* Submessage */}
        {submessage && (
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            {submessage}
          </p>
        )}

        {/* High-Tech Cyan Shimmer Progress Bar */}
        <div className="w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-4 border border-cyan-500/20 relative">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee]"
          />
        </div>

        {/* Optional Sovereign Defense Badges */}
        {showBadges && !isSm && (
          <div className="mt-5 flex items-center justify-center gap-3 text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>TLS 1.3 / AES-256</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Latency &lt; 15ms</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>Autonomous ML</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
