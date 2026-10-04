import React from 'react';

interface MediSaarthiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

export const MediSaarthiLogo: React.FC<MediSaarthiLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  animate = true,
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-sm', badge: 'text-[9px]' },
    sm: { icon: 'w-8 h-8', text: 'text-base', badge: 'text-[10px]' },
    md: { icon: 'w-11 h-11', text: 'text-xl sm:text-2xl', badge: 'text-[10px]' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl', badge: 'text-xs' },
    xl: { icon: 'w-24 h-24', text: 'text-4xl', badge: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Brand Icon Mark */}
      <div className={`relative shrink-0 ${currentSize.icon} group`}>
        {/* Soft Ambient Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 rounded-2xl blur-sm opacity-50 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Master Vector Emblem */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 w-full h-full rounded-2xl shadow-md transition-all duration-300 ${
            animate ? 'group-hover:scale-105 group-hover:shadow-emerald-500/30' : ''
          }`}
        >
          <defs>
            {/* Base Vibrant Gradient */}
            <linearGradient id="msEmblemBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="45%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Guiding Star Gradient */}
            <radialGradient id="msStarLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="60%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>

            {/* Subtle Drop Shadow */}
            <filter id="msCrossShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#042f2e" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Squircle Tile Base */}
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="26"
            fill="url(#msEmblemBg)"
          />

          {/* Inner Precision Border */}
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            rx="24"
            fill="none"
            stroke="rgba(255, 255, 255, 0.28)"
            strokeWidth="1.5"
          />

          {/* AYUSH Herbal Wings / Lotus Base (Cradling the cross) */}
          <path
            d="M 50 82 C 34 82 22 70 24 55 C 33 55 43 66 50 82 Z"
            fill="rgba(255, 255, 255, 0.4)"
          />
          <path
            d="M 50 82 C 66 82 78 70 76 55 C 67 55 57 66 50 82 Z"
            fill="rgba(255, 255, 255, 0.4)"
          />

          {/* Clinical Cross Core (Pure Luminous White) */}
          <g filter="url(#msCrossShadow)">
            {/* Vertical Beam */}
            <rect
              x="43"
              y="22"
              width="14"
              height="56"
              rx="7"
              fill="#ffffff"
            />
            {/* Horizontal Beam */}
            <rect
              x="22"
              y="43"
              width="56"
              height="14"
              rx="7"
              fill="#ffffff"
            />
          </g>

          {/* Dynamic Vital Pulse (Cardiogram Rhythm cutting through the cross) */}
          <path
            d="M 23 50 H 36 L 42 35 L 50 65 L 58 39 L 64 50 H 77"
            stroke="#0f766e"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Pulse Core Center Accent */}
          <circle cx="50" cy="50" r="2.8" fill="#10b981" />
          <circle cx="50" cy="50" r="1.4" fill="#ffffff" />

          {/* Saarthi Golden Beacon (Top Guiding Star) */}
          <g transform="translate(50, 16)">
            {/* 4-point Diamond Star */}
            <path
              d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z"
              fill="url(#msStarLight)"
            />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
        </svg>

        {/* Live Active Triage Pulse Dot */}
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-obsidian-950 animate-pulse z-20" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${currentSize.text} leading-none`}>
              Medi
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
                Saarthi
              </span>
            </span>
            <span className={`font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 ${currentSize.badge}`}>
              CLINICAL AI
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:flex mt-1">
            <span>AI AYUSH Intake & Triage</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SIH 2026
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediSaarthiLogo;
