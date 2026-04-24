import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const frameworks = [
  {
    id: 'ralph-loop',
    name: 'The Ralph Loop',
    tagline: 'Deterministic Persistence',
    description:
      'A recursive cycle ensuring no context is lost between sessions. At session end: capture state, compress context, log decisions. At session start: restore state, verify integrity, resume execution. The result is a deterministic chain where every decision references its predecessor.',
    flow: ['Capture State', 'Compress Context', 'Store Decision Log', 'Restore on Resume', 'Verify Integrity'],
  },
  {
    id: 'completion-promise',
    name: 'The Completion Promise',
    tagline: 'Verified Execution',
    description:
      'Every task spawned carries a completion token — a contract. The system tracks open promises, escalates stalled ones, and verifies closure. This eliminates the "I thought I did that" failure mode. Nothing floats. Nothing dissolves.',
    flow: ['Task Spawned', 'Token Issued', 'Execution Tracked', 'Completion Verified', 'Promise Resolved'],
  },
  {
    id: 'council-review',
    name: 'The Council Review',
    tagline: 'Multi-Model Validation',
    description:
      'Critical outputs are cross-validated by multiple models before shipping. GPT-4o checks structure. o3 checks reasoning. Gemini checks coherence. Each catches blind spots the others miss. Consensus reduces hallucination risk to near-zero for important decisions.',
    flow: ['Draft Output', 'Model A Review', 'Model B Review', 'Model C Review', 'Consensus Ship'],
  },
  {
    id: 'context-engineering',
    name: 'Context Engineering',
    tagline: 'Attention Budget Management',
    description:
      'Context windows are zero-sum. Every token that enters displaces another. The discipline: curate exactly the right information for each inference call. Strip noise. Maximize signal density. Use registries and vaults to store what the model doesn\'t need right now but will need later.',
    flow: ['Assess Token Budget', 'Curate Signal', 'Strip Noise', 'Inject Context', 'Measure Relevance'],
  },
  {
    id: 'living-spec',
    name: 'The Living Spec',
    tagline: 'Documents That Evolve',
    description:
      'Specifications are not write-once artifacts. They update as the system learns. Every decision, outcome, and pivot is captured in the spec. The document becomes institutional memory — a queryable record of why things are the way they are.',
    flow: ['Initial Spec', 'Decision Made', 'Spec Updated', 'Outcome Logged', 'Knowledge Compounds'],
  },
];

function FlowDiagram({ flow, isOpen, color }: { flow: string[]; isOpen: boolean; color: string }) {
  return (
    <div
      className="flex items-center gap-1 flex-wrap mt-3 transition-all duration-500"
      style={{ opacity: isOpen ? 0.8 : 0 }}
    >
      {flow.map((step, i) => (
        <span key={step} className="flex items-center gap-1">
          <span
            className="text-[9px] tracking-[0.05em] px-2 py-1 rounded-sm border"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              borderColor: color,
              color: color,
              opacity: 0.8,
            }}
          >
            {step}
          </span>
          {i < flow.length - 1 && (
            <span className="text-[9px]" style={{ color: 'hsl(0 0% 20%)' }}>→</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function FrameworksSection() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section className="relative z-10 px-8 md:px-16 py-40 md:py-56">
      <div
        ref={ref}
        className="max-w-5xl transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}
      >
        <span
          className="block text-[10px] tracking-[0.4em] uppercase mb-16"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(40 4% 30%)' }}
        >
          The Frameworks
        </span>

        <h2
          className="text-3xl md:text-5xl font-normal mb-6 tracking-[-0.02em]"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          How It Thinks
        </h2>
        <p className="text-sm text-muted-foreground mb-20 max-w-lg leading-[1.7]">
          Five operational patterns that govern how intent moves from thought to verified execution.
          Each is a constraint that creates leverage — not process for process's sake, but structure that compounds.
        </p>

        <div className="space-y-0">
          {frameworks.map((f, i) => (
            <FrameworkItem
              key={f.id}
              framework={f}
              index={i}
              isOpen={expanded === f.id}
              onToggle={() => setExpanded(expanded === f.id ? null : f.id)}
            />
          ))}
          <div className="border-t border-border" />
        </div>
      </div>
    </section>
  );
}

const frameworkColors = [
  'hsl(25 35% 50%)',
  'hsl(200 25% 45%)',
  'hsl(280 18% 48%)',
  'hsl(160 20% 42%)',
  'hsl(40 30% 48%)',
];

function FrameworkItem({
  framework,
  index,
  isOpen,
  onToggle,
}: {
  framework: (typeof frameworks)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { ref, isVisible } = useScrollReveal(0.2);
  const color = frameworkColors[index];

  return (
    <div
      ref={ref}
      className="border-t border-border py-8 cursor-pointer transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transitionDelay: `${index * 80}ms`,
      }}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-4">
            <span
              className="text-[10px] tracking-[0.2em]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isOpen ? color : 'hsl(0 0% 20%)',
              }}
            >
              0{index + 1}
            </span>
            <h3
              className="text-base md:text-lg font-medium transition-colors duration-400"
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                color: isOpen ? 'hsl(40 10% 82%)' : 'hsl(40 6% 55%)',
              }}
            >
              {framework.name}
            </h3>
            <span
              className="text-[10px] tracking-[0.15em] uppercase hidden md:inline"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isOpen ? color : 'hsl(0 0% 22%)',
              }}
            >
              {framework.tagline}
            </span>
          </div>
        </div>
        <span
          className="text-xs text-muted-foreground/40 mt-1 transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}
        >
          +
        </span>
      </div>

      <div
        className="overflow-hidden transition-all duration-600 ease-out"
        style={{
          maxHeight: isOpen ? '200px' : '0',
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? '12px' : '0',
        }}
      >
        <p className="text-sm leading-[1.7] text-muted-foreground max-w-xl pl-10">
          {framework.description}
        </p>
        <div className="pl-10">
          <FlowDiagram flow={framework.flow} isOpen={isOpen} color={color} />
        </div>
      </div>
    </div>
  );
}
