import { useScrollReveal } from '@/hooks/useScrollReveal';

const phrases = [
  'Sovereignty over execution.',
  'Intent preserved across entropy.',
  'Systems that remember.',
];

function RevealPhrase({ text, index }: { text: string; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <div ref={ref} className="overflow-hidden">
      <p
        className="text-2xl md:text-4xl lg:text-[2.75rem] font-normal leading-[1.25] tracking-[-0.02em] transition-all duration-[1400ms] ease-out"
        style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transitionDelay: `${index * 250}ms`,
          color: index === 1 ? 'hsl(25 30% 50%)' : 'hsl(40 10% 75%)',
        }}
      >
        {text}
      </p>
    </div>
  );
}

export default function ThesisSection() {
  const { ref: introRef, isVisible: introVisible } = useScrollReveal(0.2);
  const { ref: bodyRef, isVisible: bodyVisible } = useScrollReveal(0.2);
  const { ref: principlesRef, isVisible: principlesVisible } = useScrollReveal(0.2);

  const principles = [
    {
      label: 'Context Windows Are Zero-Sum',
      text: 'Every token that enters an AI\'s attention displaces another. The elite practitioner manages this budget with the precision of a portfolio manager — curating signal, eliminating noise, maximizing inference quality per token spent.',
    },
    {
      label: 'Persistence Creates Compound Returns',
      text: 'Most AI usage is stateless — each session starts from zero. The Architecture of Intent creates deterministic persistence: every decision logged, every context preserved, every state transition recoverable. Knowledge compounds instead of evaporating.',
    },
    {
      label: 'Multi-Model Validation Eliminates Blind Spots',
      text: 'No single model is omniscient. By routing tasks to specialists and cross-validating critical output across models, hallucination risk drops and output confidence rises. The system is smarter than any individual model.',
    },
  ];

  return (
    <section className="relative z-10 px-8 md:px-16 py-40 md:py-56">
      <div className="max-w-4xl">
        <span
          ref={introRef}
          className="block text-[10px] tracking-[0.4em] uppercase mb-16 transition-all duration-1000"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'hsl(40 4% 30%)',
            opacity: introVisible ? 1 : 0,
          }}
        >
          The Thesis
        </span>

        <div className="space-y-8">
          {phrases.map((p, i) => (
            <RevealPhrase key={i} text={p} index={i} />
          ))}
        </div>

        <div
          ref={bodyRef}
          className="mt-20 max-w-lg transition-all duration-[1500ms]"
          style={{
            opacity: bodyVisible ? 1 : 0,
            transform: bodyVisible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <div className="w-8 h-px mb-8" style={{ background: 'hsl(0 0% 18%)' }} />
          <p className="text-sm leading-[1.8] text-muted-foreground">
            The Architecture of Intent is a cognitive operating system for
            professionals who use AI not as a tool, but as <span className="text-foreground">infrastructure</span>.
            It recognizes that the gap between AI enthusiasts and AI architects
            isn't knowledge — it's <span className="text-foreground">systematic methodology</span>.
          </p>
          <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">
            This isn't about prompting better. It's about building systems where
            intent survives context switches, model rotations, and the entropy
            of complex multi-session workflows.
          </p>
        </div>

        {/* Core Principles */}
        <div
          ref={principlesRef}
          className="mt-24 grid md:grid-cols-3 gap-12 transition-all duration-[1500ms]"
          style={{
            opacity: principlesVisible ? 1 : 0,
            transform: principlesVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {principles.map((p, i) => (
            <div key={i}>
              <div className="w-4 h-px mb-4" style={{ background: 'hsl(25 30% 45%)' }} />
              <h3
                className="text-xs font-medium mb-3 tracking-wide"
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  color: 'hsl(40 10% 70%)',
                }}
              >
                {p.label}
              </h3>
              <p className="text-xs leading-[1.8] text-muted-foreground">
                {p.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
