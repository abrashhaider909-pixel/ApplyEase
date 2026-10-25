/**
 * SplashScreen
 * Displayed for ~1.6 s while React hydrates.
 * The logo icon pulses, the wordmark cycles through brand colours, and three
 * dots bounce to signal activity. The whole overlay fades out smoothly.
 */
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  /** Called once the outro animation finishes so the parent can unmount us. */
  onDone: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Start the fade-out after 1.7 s, then tell the parent to unmount after 500 ms more
    const fadeTimer = setTimeout(() => setLeaving(true), 1700);
    const doneTimer = setTimeout(() => onDone(), 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      aria-label="Loading ApplyEase"
      role="status"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0c172c 0%, #172b50 55%, #1f3763 100%)',
        transition: 'opacity 0.5s ease',
        opacity: leaving ? 0 : 1,
        pointerEvents: leaving ? 'none' : 'all',
      }}
    >
      {/* Outer pulsing ring */}
      <div
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: '50%',
          border: '2px solid rgba(244,119,46,0.35)',
          animation: 'ring-pulse 1.4s ease-in-out infinite',
        }}
      />
      {/* Inner pulsing ring */}
      <div
        style={{
          position: 'absolute',
          width: 110,
          height: 110,
          borderRadius: '50%',
          border: '2px solid rgba(244,119,46,0.2)',
          animation: 'ring-pulse 1.4s ease-in-out infinite 0.35s',
        }}
      />

      {/* Logo icon */}
      <div
        style={{
          animation: 'splash-logo-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
          marginBottom: 20,
        }}
      >
        <img
          src="/assets/aistudio/image_133404a9.png"
          alt="ApplyEase"
          style={{
            width: 72,
            height: 72,
            objectFit: 'contain',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.08)',
            padding: 10,
            display: 'block',
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* Wordmark with cycling colours */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          letterSpacing: '-0.03em',
          display: 'flex',
          gap: 0,
          userSelect: 'none',
        }}
      >
        <span
          style={{
            animation: 'logo-color-cycle 2s linear infinite',
            color: '#ffffff',
          }}
        >
          Apply
        </span>
        <span
          style={{
            animation: 'logo-color-cycle 2s linear infinite 0.4s',
            color: '#f4772e',
          }}
        >
          Ease
        </span>
      </div>

      {/* Subtitle */}
      <p
        style={{
          marginTop: 8,
          fontSize: 11,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        University Workflow Platform
      </p>

      {/* Bouncing dots */}
      <div style={{ display: 'flex', gap: 7, marginTop: 28 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#f4772e',
              display: 'inline-block',
              animation: `dot-bounce 1.1s ease-in-out infinite ${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
