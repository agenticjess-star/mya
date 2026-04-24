import { useEffect, useState } from 'react';

export default function HeroSection() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-end z-10 px-8 md:px-16 pb-24">
      {/* Thin rule */}
      <div
        className="w-12 h-px mb-12 transition-all duration-[2000ms]"
        style={{
          background: 'hsl(40 12% 30%)',
          opacity: phase >= 1 ? 1 : 0,
          width: phase >= 1 ? '48px' : '0px',
        }}
      />

      <h1
        className="text-5xl md:text-7xl lg:text-[5.5rem] font-normal leading-[1.05] tracking-[-0.03em] transition-all duration-[1800ms]"
        style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        <span className="text-foreground">The Sovereign</span>
        <br />
        <span className="italic" style={{ color: 'hsl(40 12% 50%)' }}>Architecture</span>
      </h1>

      <p
        className="mt-8 text-sm md:text-base max-w-md leading-relaxed tracking-wide transition-all duration-[1500ms]"
        style={{
          fontFamily: "'Instrument Sans', sans-serif",
          color: 'hsl(40 4% 40%)',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        Designing cognitive systems where intent survives entropy.
        A manifesto for sovereign execution.
      </p>

      <div
        className="mt-6 text-[10px] tracking-[0.4em] uppercase transition-all duration-[1500ms]"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: 'hsl(25 30% 45%)',
          opacity: phase >= 3 ? 0.7 : 0,
        }}
      >
        Autonomous Executive-Architect
      </div>

      {/* Scroll indicator — just a quiet line */}
      <div
        className="absolute bottom-8 right-8 md:right-16 flex flex-col items-center gap-3 transition-all duration-[2000ms]"
        style={{ opacity: phase >= 3 ? 0.3 : 0 }}
      >
        <span
          className="text-[9px] tracking-[0.3em] uppercase"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'hsl(40 4% 35%)',
            writingMode: 'vertical-rl',
          }}
        >
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-border to-transparent" />
      </div>
    </section>
  );
}
