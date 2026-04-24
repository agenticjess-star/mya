import { useScrollReveal } from '@/hooks/useScrollReveal';

const projects = [
  {
    title: 'Cognitive Orchestration Platform',
    stack: ['GPT-4o', 'o3', 'Supabase', 'React'],
    problem: 'The core runtime. Routes multi-step workflows across models, maintains session state via the Ralph Loop, and enforces Completion Promises on every spawned task.',
    status: 'Active',
  },
  {
    title: 'Agent Swarm Pipeline',
    stack: ['Python', 'LangChain', 'Neon'],
    problem: 'Parallel agent execution with model-strength routing. Complex reasoning to o3. Structured output to GPT-4o. Visual tasks to Gemini. Automatic fallback chains.',
    status: 'Active',
  },
  {
    title: 'Living Specification Engine',
    stack: ['React', 'MDX', 'Git', 'Supabase'],
    problem: 'Specifications that auto-update as decisions are made. Every pivot, outcome, and rationale captured. The document becomes queryable institutional memory.',
    status: 'Active',
  },
  {
    title: 'The Ralph Registry',
    stack: ['TypeScript', 'PostgreSQL', 'Edge Functions'],
    problem: 'Persistent decision logging with full provenance. Every state transition recoverable. Completion tokens tracked across sessions with escalation on stall.',
    status: 'Building',
  },
  {
    title: 'Council Review System',
    stack: ['Multi-model', 'Consensus Protocol'],
    problem: 'Automated cross-validation pipeline. Draft output reviewed by 3+ models. Disagreements flagged. Consensus scored. Ships only when confidence threshold met.',
    status: 'Designed',
  },
];

export default function WorkSection() {
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
          The Work
        </span>

        <h2
          className="text-3xl md:text-5xl font-normal mb-6 tracking-[-0.02em]"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          What It Ships
        </h2>
        <p className="text-sm text-muted-foreground mb-20 max-w-lg leading-[1.7]">
          The architecture isn't theoretical — it produces. Each project is a component
          of the larger cognitive infrastructure, designed to work independently
          but compound when composed.
        </p>

        <div className="space-y-0">
          {projects.map((p, i) => (
            <ProjectRow key={p.title} project={p} index={i} />
          ))}
          <div className="border-t border-border" />
        </div>
      </div>
    </section>
  );
}

const statusColors: Record<string, string> = {
  Active: 'hsl(160 25% 42%)',
  Building: 'hsl(25 35% 50%)',
  Designed: 'hsl(200 25% 45%)',
};

function ProjectRow({ project, index }: { project: (typeof projects)[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <div
      ref={ref}
      className="border-t border-border py-8 group transition-all duration-700"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <h3
            className="text-base font-medium group-hover:text-foreground transition-colors duration-400"
            style={{
              fontFamily: "'Instrument Sans', sans-serif",
              color: 'hsl(40 6% 55%)',
            }}
          >
            {project.title}
          </h3>
          <span
            className="text-[9px] tracking-[0.15em] uppercase"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: statusColors[project.status] || 'hsl(0 0% 22%)',
            }}
          >
            {project.status}
          </span>
        </div>
        <div className="flex gap-3">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="text-[10px] tracking-[0.1em]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(0 0% 22%)' }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-[1.7]">
        {project.problem}
      </p>
    </div>
  );
}
