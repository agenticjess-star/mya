import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const radarData = [
  { subject: 'Systems Synthesis', value: 95 },
  { subject: 'Abstraction', value: 90 },
  { subject: 'Process Formalization', value: 92 },
  { subject: 'Risk Anticipation', value: 85 },
  { subject: 'Cross-Domain', value: 93 },
  { subject: 'Long-Horizon', value: 88 },
];

const decisions = [
  {
    year: '2024',
    event: 'Recognized AI as cognitive infrastructure, not tooling',
    detail: 'Shifted from using AI for individual tasks to designing persistent systems where AI operates as infrastructure — with state, memory, and accountability.',
  },
  {
    year: '2025',
    event: 'Designed the Chief of Staff pattern',
    detail: 'Created an orchestration model where AI maintains alignment between daily execution and long-term strategy. Not a chatbot — a persistent executive function.',
  },
  {
    year: '2025',
    event: 'Built the Architecture of Intent',
    detail: 'Formalized the framework: Orchestration → Execution → Persistence → Verification. A four-layer stack where intent survives entropy.',
  },
  {
    year: '2026',
    event: 'Deployed multi-model agent swarms',
    detail: 'Operationalized specialist routing with Council Review validation. Each model does what it\'s best at. The system is the generalist.',
  },
  {
    year: '2026',
    event: 'The fork: chose exposure over silent capability',
    detail: 'The gap between what was built and what was visible became untenable. The fork isn\'t technical — it\'s psychological. This site is the crossing.',
  },
];

export default function ProfileSection() {
  const { ref, isVisible } = useScrollReveal(0.1);
  const { ref: radarRef, isVisible: radarVisible } = useScrollReveal(0.2);
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollReveal(0.2);

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
          The Profile
        </span>

        <h2
          className="text-3xl md:text-5xl font-normal mb-3 tracking-[-0.02em]"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          The Architect
        </h2>
        <p
          className="text-sm tracking-[0.15em] uppercase mb-6"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(25 30% 45%)' }}
        >
          Autonomous Executive-Architect
        </p>
        <p className="text-sm text-muted-foreground max-w-lg leading-[1.7] mb-20">
          Not a developer who uses AI. An architect who designs cognitive systems.
          The distinction: developers optimize tasks. Architects design the infrastructure
          that makes optimization automatic and persistent.
        </p>

        <div className="grid md:grid-cols-2 gap-20 items-start">
          {/* Radar */}
          <div
            ref={radarRef}
            className="transition-all duration-[1200ms]"
            style={{ opacity: radarVisible ? 1 : 0, transform: radarVisible ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <p
              className="text-[10px] tracking-[0.3em] uppercase mb-8"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(0 0% 22%)' }}
            >
              Capability Distribution
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(0, 0%, 12%)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'hsl(40, 4%, 35%)', fontSize: 10, fontFamily: "'Instrument Sans', sans-serif" }}
                />
                <Radar
                  name="Capabilities"
                  dataKey="value"
                  stroke="hsl(25, 30%, 45%)"
                  fill="hsl(25, 30%, 45%)"
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div
            ref={timelineRef}
            className="transition-all duration-[1200ms]"
            style={{ opacity: timelineVisible ? 1 : 0, transform: timelineVisible ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <p
              className="text-[10px] tracking-[0.3em] uppercase mb-8"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(0 0% 22%)' }}
            >
              Decision Log
            </p>
            <div className="space-y-6">
              {decisions.map((d, i) => (
                <div key={i} className="group">
                  <div className="flex gap-6 items-baseline">
                    <span
                      className="text-[10px] tracking-[0.1em] shrink-0"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: i === decisions.length - 1 ? 'hsl(25 30% 50%)' : 'hsl(0 0% 22%)',
                      }}
                    >
                      {d.year}
                    </span>
                    <div>
                      <p className="text-sm leading-[1.6] text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {d.event}
                      </p>
                      <p className="text-xs leading-[1.7] text-muted-foreground/60 mt-1 max-w-sm">
                        {d.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
