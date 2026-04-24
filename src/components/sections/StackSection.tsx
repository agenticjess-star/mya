import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const layers = [
  {
    id: 'orchestration',
    num: '01',
    name: 'Orchestration',
    subtitle: 'The Chief of Staff',
    color: 'hsl(25 35% 50%)',
    description:
      'Zoe operates as a Chief of Staff — not a chatbot. She routes tasks, maintains alignment between daily actions and long-term objectives, and ensures no intent is lost across sessions. Every interaction begins with intent capture: what are you trying to achieve, what constraints exist, what does success look like.',
    details: [
      'Intent capture & decomposition',
      'Session continuity management',
      'Priority arbitration across workstreams',
      'Strategic alignment verification',
    ],
  },
  {
    id: 'execution',
    num: '02',
    name: 'Execution',
    subtitle: 'Agent Swarms & Specialist Routing',
    color: 'hsl(200 25% 45%)',
    description:
      'Multi-model task routing based on architectural strengths. Complex reasoning routes to o3/Codex. Schema adherence and structured output to GPT-4o. Visual synthesis and multimodal tasks to Gemini. Each model is a specialist — the system is the generalist.',
    details: [
      'Model-strength-based routing',
      'Parallel agent execution',
      'Tool-augmented reasoning chains',
      'Fallback & retry orchestration',
    ],
  },
  {
    id: 'persistence',
    num: '03',
    name: 'Persistence',
    subtitle: 'The Ralph Loop',
    color: 'hsl(160 20% 42%)',
    description:
      'The Ralph Loop is a recursive persistence cycle. At session end, state is captured, compressed, and stored. At session start, it\'s restored. This creates a deterministic chain of decisions that compounds over time — the system literally remembers what it decided and why.',
    details: [
      'Session state capture & restore',
      'Decision log with rationale',
      'Context compression for token efficiency',
      'Cross-session knowledge accumulation',
    ],
  },
  {
    id: 'verification',
    num: '04',
    name: 'Verification',
    subtitle: 'Council Review & Completion Promises',
    color: 'hsl(280 18% 48%)',
    description:
      'Before critical output ships, it passes through multi-model validation. Each model catches blind spots the others miss. Completion Promises are contracts — every spawned task carries a token that the system verifies for closure. No task floats. No intent dissolves.',
    details: [
      'Multi-model cross-validation',
      'Completion token tracking',
      'Hallucination risk reduction',
      'Output confidence scoring',
    ],
  },
];

// SVG Node Diagram
function ArchitectureDiagram({ activeLayer }: { activeLayer: string | null }) {
  const nodePositions = [
    { x: 200, y: 60, layer: layers[0] },
    { x: 380, y: 160, layer: layers[1] },
    { x: 200, y: 260, layer: layers[2] },
    { x: 380, y: 360, layer: layers[3] },
  ];

  const connections = [
    { from: 0, to: 1, label: 'routes tasks' },
    { from: 1, to: 2, label: 'persists state' },
    { from: 2, to: 3, label: 'validates output' },
    { from: 3, to: 0, label: 'feedback loop' },
    { from: 0, to: 2, label: 'context sync' },
    { from: 1, to: 3, label: 'pre-validation' },
  ];

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox="0 0 560 420" className="w-full h-auto" style={{ maxHeight: '420px' }}>
        {/* Connections */}
        {connections.map((conn, i) => {
          const from = nodePositions[conn.from];
          const to = nodePositions[conn.to];
          const isHighlighted =
            activeLayer === from.layer.id || activeLayer === to.layer.id;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          // Curve offset for non-adjacent connections
          const isDiagonal = Math.abs(conn.from - conn.to) > 1;
          const cx = isDiagonal ? midX - 60 : midX;
          const cy = isDiagonal ? midY : midY;

          return (
            <g key={i}>
              <path
                d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                fill="none"
                stroke={isHighlighted ? 'hsl(25 30% 45%)' : 'hsl(0 0% 14%)'}
                strokeWidth={isHighlighted ? 1.5 : 0.8}
                strokeDasharray={isDiagonal ? '4 4' : 'none'}
                className="transition-all duration-500"
                opacity={isHighlighted ? 0.8 : 0.4}
              />
              {isHighlighted && (
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fill="hsl(40 4% 35%)"
                  fontSize="8"
                  fontFamily="'JetBrains Mono', monospace"
                  className="transition-opacity duration-500"
                  opacity={0.7}
                >
                  {conn.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodePositions.map(({ x, y, layer }, i) => {
          const isActive = activeLayer === layer.id;
          return (
            <g key={layer.id} className="transition-all duration-500" style={{ cursor: 'pointer' }}>
              {/* Glow ring */}
              <circle
                cx={x}
                cy={y}
                r={isActive ? 38 : 32}
                fill="none"
                stroke={isActive ? layer.color : 'hsl(0 0% 12%)'}
                strokeWidth={isActive ? 1.5 : 0.8}
                className="transition-all duration-500"
                opacity={isActive ? 0.6 : 0.3}
              />
              {/* Core */}
              <circle
                cx={x}
                cy={y}
                r={6}
                fill={isActive ? layer.color : 'hsl(0 0% 18%)'}
                className="transition-all duration-500"
              />
              {/* Label */}
              <text
                x={x}
                y={y + (i % 2 === 0 ? -44 : 50)}
                textAnchor="middle"
                fill={isActive ? 'hsl(40 10% 82%)' : 'hsl(40 4% 35%)'}
                fontSize="11"
                fontFamily="'Instrument Sans', sans-serif"
                fontWeight="500"
                className="transition-all duration-500"
              >
                {layer.name}
              </text>
              <text
                x={x}
                y={y + (i % 2 === 0 ? -32 : 62)}
                textAnchor="middle"
                fill={isActive ? layer.color : 'hsl(0 0% 22%)'}
                fontSize="8"
                fontFamily="'JetBrains Mono', monospace"
                className="transition-all duration-500"
              >
                {layer.num}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function StackSection() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section className="relative z-10 px-8 md:px-16 py-40 md:py-56">
      <div
        ref={ref}
        className="max-w-6xl transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}
      >
        <span
          className="block text-[10px] tracking-[0.4em] uppercase mb-16"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(40 4% 30%)' }}
        >
          The Architecture
        </span>

        <h2
          className="text-3xl md:text-5xl font-normal mb-6 tracking-[-0.02em]"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          The Stack
        </h2>
        <p className="text-sm text-muted-foreground mb-20 max-w-lg leading-[1.7]">
          Four layers that transform raw intent into verified execution.
          Each layer has a defined role, clear boundaries, and deterministic
          interfaces with adjacent layers.
        </p>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Node Diagram */}
          <ArchitectureDiagram activeLayer={activeLayer} />

          {/* Layer Details */}
          <div className="space-y-0">
            {layers.map((layer) => {
              const isActive = activeLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  className="border-t border-border py-6 cursor-pointer transition-all duration-500"
                  onMouseEnter={() => setActiveLayer(layer.id)}
                  onMouseLeave={() => setActiveLayer(null)}
                >
                  <div className="flex items-baseline gap-6">
                    <span
                      className="text-[10px] tracking-[0.2em] transition-colors duration-500"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isActive ? layer.color : 'hsl(0 0% 20%)',
                      }}
                    >
                      {layer.num}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-baseline md:gap-4">
                        <h3
                          className="text-base md:text-lg font-medium transition-colors duration-500"
                          style={{
                            fontFamily: "'Instrument Sans', sans-serif",
                            color: isActive ? 'hsl(40 10% 82%)' : 'hsl(40 6% 50%)',
                          }}
                        >
                          {layer.name}
                        </h3>
                        <span className="text-xs text-muted-foreground mt-1 md:mt-0">
                          {layer.subtitle}
                        </span>
                      </div>

                      <div
                        className="overflow-hidden transition-all duration-700 ease-out"
                        style={{
                          maxHeight: isActive ? '220px' : '0',
                          opacity: isActive ? 1 : 0,
                          marginTop: isActive ? '12px' : '0',
                        }}
                      >
                        <p className="text-sm leading-[1.7] text-muted-foreground max-w-md mb-3">
                          {layer.description}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {layer.details.map((d) => (
                            <span
                              key={d}
                              className="text-[10px] tracking-[0.05em]"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                color: layer.color,
                                opacity: 0.7,
                              }}
                            >
                              → {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-border" />
          </div>
        </div>
      </div>
    </section>
  );
}
