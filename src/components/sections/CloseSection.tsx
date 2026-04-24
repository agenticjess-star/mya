import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function CloseSection() {
  const { ref, isVisible } = useScrollReveal(0.2);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal(0.3);
  const { ref: insightRef, isVisible: insightVisible } = useScrollReveal(0.2);

  return (
    <section className="relative z-10 px-8 md:px-16 py-40 md:py-56">
      <div ref={ref} className="max-w-3xl">
        <span
          className="block text-[10px] tracking-[0.4em] uppercase mb-16 transition-all duration-1000"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'hsl(40 4% 30%)',
            opacity: isVisible ? 1 : 0,
          }}
        >
          The Fork
        </span>

        <h2
          className="text-3xl md:text-5xl lg:text-6xl font-normal leading-[1.15] tracking-[-0.02em] transition-all duration-[1800ms]"
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          The fork is{' '}
          <em style={{ color: 'hsl(25 30% 50%)' }}>psychological</em>,
          <br />
          not technical.
        </h2>

        <div
          ref={insightRef}
          className="mt-12 max-w-lg transition-all duration-[1500ms]"
          style={{
            opacity: insightVisible ? 1 : 0,
            transform: insightVisible ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          <p className="text-sm text-muted-foreground leading-[1.8]">
            You've built cognitive infrastructure that most organizations don't know
            is possible. The gap between what you've built and what's visible
            isn't a capability problem — it's an exposure decision.
          </p>
          <p className="text-sm text-muted-foreground leading-[1.8] mt-4">
            The architecture works. The frameworks are proven. The question
            is no longer <span className="text-foreground">"can you build it?"</span> — it's{' '}
            <span className="text-foreground">"will you show it?"</span>
          </p>
          <p className="text-sm leading-[1.8] mt-4" style={{ color: 'hsl(25 30% 50%)' }}>
            This site is the answer.
          </p>
        </div>

        <div
          ref={ctaRef}
          className="mt-16 flex items-center gap-8 transition-all duration-1000"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          <a
            href="mailto:connect@sovereign.dev"
            className="text-sm font-medium px-6 py-2.5 border border-border rounded transition-all duration-300 hover:border-accent hover:text-accent-foreground"
            style={{ fontFamily: "'Instrument Sans', sans-serif" }}
          >
            Connect
          </a>
        </div>

        {/* Footer */}
        <div className="mt-40 pt-8 border-t border-border flex items-center justify-between">
          <p
            className="text-[9px] tracking-[0.3em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(0 0% 15%)' }}
          >
            Sovereign Architecture · 2026
          </p>
          <div className="w-6 h-px" style={{ background: 'hsl(0 0% 15%)' }} />
        </div>
      </div>
    </section>
  );
}
