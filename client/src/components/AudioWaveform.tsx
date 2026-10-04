import React from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  variant?: 'compact' | 'expanded';
  volume?: number; // 0 to 100
  frequencies?: number[]; // Array of normalized frequency values (0 to 100)
  isSpeakingAi?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  variant = 'compact',
  volume = 0,
  frequencies = [],
  isSpeakingAi = false,
}) => {
  const barsCount = variant === 'expanded' ? 16 : 8;

  // Generate bar heights based on frequencies or volume or idle animation
  const bars = Array.from({ length: barsCount }, (_, index) => {
    if (!isActive) {
      return 15; // Idle minimum height %
    }

    if (frequencies.length > 0) {
      // Map frequency bin or mirror around center
      const mappedIdx = index < frequencies.length ? index : (barsCount - 1 - index) % frequencies.length;
      const freqVal = frequencies[mappedIdx] || 0;
      // Combine frequency with volume for organic fluid movement
      const computedHeight = Math.max(15, Math.min(100, Math.round((freqVal * 0.7) + (volume * 0.5))));
      return computedHeight;
    }

    // Fallback if no raw frequency data but volume exists
    const seed = Math.sin((index + 1) * 1.5) * 20;
    return Math.max(20, Math.min(100, Math.round(volume + seed)));
  });

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-0.5 h-5 px-1">
        {bars.map((height, i) => (
          <span
            key={i}
            style={{
              height: `${isActive ? height : 20}%`,
              transition: 'height 80ms ease-out',
            }}
            className={`w-1 rounded-full ${
              isSpeakingAi
                ? 'bg-gradient-to-t from-teal-400 to-cyan-300'
                : isActive
                ? 'bg-gradient-to-t from-rose-500 via-amber-400 to-emerald-400 shadow-2xs'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
    );
  }

  // Expanded variant for Live Voice Modal / HUD
  return (
    <div className="relative flex flex-col items-center justify-center p-6 w-full">
      {/* Subtle background glow effect */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-300 pointer-events-none ${
          isSpeakingAi
            ? 'bg-cyan-500/30'
            : isActive
            ? 'bg-emerald-500/40 shadow-neon-emerald'
            : 'bg-slate-500/10'
        }`}
      />

      {/* Multi-bar Frequency Spectrum Wave */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 h-24 w-full max-w-md px-4">
        {bars.map((height, i) => {
          // Staggered delay for idle wave animation
          const animationDelay = `${(i * 0.08).toFixed(2)}s`;

          return (
            <div
              key={i}
              className="relative flex items-center justify-center flex-1 max-w-[14px] h-full"
            >
              <div
                style={{
                  height: `${height}%`,
                  transition: isActive ? 'height 75ms ease-out' : 'height 400ms ease-in-out',
                  animationDelay,
                }}
                className={`w-full rounded-full transition-all ${
                  isSpeakingAi
                    ? 'bg-gradient-to-t from-cyan-600 via-teal-400 to-emerald-300 shadow-neon-cyan'
                    : isActive
                    ? 'bg-gradient-to-t from-emerald-600 via-teal-400 to-cyan-300 shadow-neon-emerald'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Dynamic Audio Level Meter Pill */}
      {isActive && (
        <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 dark:bg-obsidian-900/90 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {isSpeakingAi ? 'Dr. Saarthi Speaking...' : `Mic Volume: ${volume}%`}
          </span>
        </div>
      )}
    </div>
  );
};
