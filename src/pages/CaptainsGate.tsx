import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CaptainsGate() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [phase, setPhase] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setError(false);
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check code when all digits entered
    if (value && index === 3) {
      const code = newDigits.join('');
      if (code === '7787') {
        setUnlocking(true);
        setTimeout(() => navigate('/command'), 1500);
      } else {
        setError(true);
        setTimeout(() => {
          setDigits(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }, 800);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{
          background: unlocking
            ? 'radial-gradient(circle at 50% 50%, hsl(25 30% 15% / 0.6) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, hsl(25 30% 8% / 0.3) 0%, transparent 50%)',
          opacity: phase >= 1 ? 1 : 0,
        }}
      />

      <div
        className="relative z-10 flex flex-col items-center transition-all duration-[1500ms]"
        style={{
          opacity: unlocking ? 0 : phase >= 1 ? 1 : 0,
          transform: unlocking ? 'scale(1.1)' : phase >= 1 ? 'scale(1)' : 'scale(0.95)',
          filter: unlocking ? 'blur(8px)' : 'none',
        }}
      >
        {/* Title */}
        <div
          className="w-8 h-px mb-10 transition-all duration-1000"
          style={{
            background: 'hsl(25 30% 45%)',
            opacity: phase >= 1 ? 0.5 : 0,
          }}
        />

        <h1
          className="text-2xl md:text-3xl font-normal tracking-[-0.02em] mb-3 transition-all duration-1000"
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            opacity: phase >= 1 ? 1 : 0,
          }}
        >
          Command Center
        </h1>

        <p
          className="text-[10px] tracking-[0.4em] uppercase mb-16 transition-all duration-1000"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'hsl(40 4% 35%)',
            opacity: phase >= 2 ? 0.7 : 0,
          }}
        >
          Enter Captain's Key
        </p>

        {/* Code input */}
        <div className="flex gap-4">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-14 h-16 text-center text-2xl bg-transparent border rounded transition-all duration-500 outline-none focus:ring-1"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: error
                  ? 'hsl(0 60% 45%)'
                  : digit
                    ? 'hsl(25 30% 45%)'
                    : 'hsl(0 0% 15%)',
                color: 'hsl(40 10% 82%)',
                boxShadow: digit ? '0 0 20px hsl(25 30% 45% / 0.1)' : 'none',
                animation: error ? 'shake 0.4s ease-out' : 'none',
              }}
              style-focus={{ ringColor: 'hsl(25 30% 45% / 0.3)' } as any}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <p
            className="mt-6 text-[10px] tracking-[0.3em] uppercase"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: 'hsl(0 60% 45%)',
            }}
          >
            Access Denied
          </p>
        )}
      </div>

      {/* Unlocking flash */}
      {unlocking && (
        <div
          className="absolute inset-0 z-20 animate-fade-in"
          style={{
            background: 'radial-gradient(circle at 50% 50%, hsl(25 30% 20% / 0.4) 0%, hsl(0 0% 3%) 70%)',
          }}
        />
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  );
}
