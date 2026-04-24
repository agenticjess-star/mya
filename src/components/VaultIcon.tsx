import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface VaultIconProps {
  onExpand?: () => void;
}

export default function VaultIcon({ onExpand }: VaultIconProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isExpanding, setIsExpanding] = useState(false);
  const [phase, setPhase] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollTop / docHeight, 1);
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Expansion threshold — when user is at the very bottom
  const isAtBottom = scrollProgress > 0.92;
  const expandScale = isAtBottom
    ? 1 + (scrollProgress - 0.92) / 0.08 * 2
    : 1;

  const handleClick = () => {
    if (isAtBottom) {
      // Cinematic expansion
      setIsExpanding(true);
      onExpand?.();
      setTimeout(() => {
        sessionStorage.setItem('captains-key', 'true');
        navigate('/command');
      }, 1200);
    } else {
      // Scroll to bottom
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  const baseSize = 36;
  const glowIntensity = isAtBottom ? 0.4 : 0.08;
  const borderOpacity = isAtBottom ? 0.5 : 0.15;

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed z-50 flex items-center justify-center transition-all duration-700 cursor-pointer group"
        style={{
          bottom: '24px',
          right: '24px',
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          opacity: phase >= 1 ? (isExpanding ? 0 : 1) : 0,
          transform: `scale(${isExpanding ? 60 : expandScale})`,
          transition: isExpanding
            ? 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-out'
            : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease',
        }}
        aria-label="Enter Command Center"
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            background: `radial-gradient(circle, hsl(25 30% 45% / ${glowIntensity}) 0%, transparent 70%)`,
            transform: 'scale(2.5)',
          }}
        />

        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            border: `1px solid hsl(25 30% 45% / ${borderOpacity})`,
          }}
        />

        {/* Inner vault symbol */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="relative z-10 transition-all duration-500 group-hover:scale-110"
        >
          {/* Diamond/vault shape */}
          <path
            d="M8 1L15 8L8 15L1 8Z"
            stroke="hsl(25 30% 50%)"
            strokeWidth="1"
            fill="none"
            className="transition-all duration-500"
            style={{
              fill: isAtBottom ? 'hsl(25 30% 45% / 0.15)' : 'none',
            }}
          />
          {/* Inner dot */}
          <circle
            cx="8"
            cy="8"
            r="1.5"
            fill="hsl(25 30% 55%)"
            className="transition-all duration-500"
            style={{
              opacity: isAtBottom ? 1 : 0.5,
            }}
          />
        </svg>
      </button>

      {/* Full-screen expansion overlay */}
      {isExpanding && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            background: 'hsl(0 0% 3%)',
            animation: 'vaultFadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        />
      )}

      <style>{`
        @keyframes vaultFadeIn {
          0% { opacity: 0; }
          40% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
