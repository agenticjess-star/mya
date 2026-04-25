import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AgentDetailModal from './AgentDetailModal';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  model: string | null;
  current_task: string | null;
  uptime_hours: number;
  tasks_completed: number;
  success_rate: number;
  system_instructions: string | null;
  connections: string[] | null;
}

const typeConfig: Record<string, { icon: string; color: string; ring: string; gradient: string }> = {
  orchestrator: {
    icon: '◈',
    color: 'hsl(25 35% 55%)',
    ring: 'hsl(25 35% 55% / 0.3)',
    gradient: 'linear-gradient(135deg, hsl(25 35% 20%) 0%, hsl(25 25% 12%) 100%)',
  },
  persistence: {
    icon: '◉',
    color: 'hsl(200 35% 55%)',
    ring: 'hsl(200 35% 55% / 0.3)',
    gradient: 'linear-gradient(135deg, hsl(200 30% 18%) 0%, hsl(200 20% 10%) 100%)',
  },
  analyst: {
    icon: '◎',
    color: 'hsl(280 30% 55%)',
    ring: 'hsl(280 30% 55% / 0.3)',
    gradient: 'linear-gradient(135deg, hsl(280 25% 18%) 0%, hsl(280 15% 10%) 100%)',
  },
  executor: {
    icon: '▣',
    color: 'hsl(160 35% 50%)',
    ring: 'hsl(160 35% 50% / 0.3)',
    gradient: 'linear-gradient(135deg, hsl(160 30% 16%) 0%, hsl(160 20% 8%) 100%)',
  },
  validator: {
    icon: '◆',
    color: 'hsl(40 40% 55%)',
    ring: 'hsl(40 40% 55% / 0.3)',
    gradient: 'linear-gradient(135deg, hsl(40 35% 18%) 0%, hsl(40 25% 10%) 100%)',
  },
  planner: {
    icon: '△',
    color: 'hsl(340 30% 55%)',
    ring: 'hsl(340 30% 55% / 0.3)',
    gradient: 'linear-gradient(135deg, hsl(340 25% 18%) 0%, hsl(340 15% 10%) 100%)',
  },
};

const statusDot: Record<string, string> = {
  active: 'hsl(160 50% 50%)',
  idle: 'hsl(40 40% 50%)',
  standby: 'hsl(200 35% 50%)',
  error: 'hsl(0 60% 55%)',
};

// Predefined positions for org chart layout
function getPositions(count: number, width: number, height: number) {
  // Orchestrator at top center, others arranged below
  const positions: { x: number; y: number }[] = [];
  if (count === 0) return positions;

  const centerX = width / 2;
  const isNarrow = width < 600;
  const topY = isNarrow ? 70 : 80;
  const midY = height * (isNarrow ? 0.38 : 0.45);
  const bottomY = height * (isNarrow ? 0.7 : 0.75);
  const maxSpacing = isNarrow ? 110 : 220;
  const sidePadding = isNarrow ? 60 : 120;

  // First agent (orchestrator) at top
  positions.push({ x: centerX, y: topY });

  // Remaining agents in tiers
  const remaining = count - 1;
  if (remaining <= 3) {
    // Single row below
    const spacing = Math.min(maxSpacing, (width - sidePadding) / Math.max(remaining, 1));
    const startX = centerX - (spacing * (remaining - 1)) / 2;
    for (let i = 0; i < remaining; i++) {
      positions.push({ x: startX + i * spacing, y: midY });
    }
  } else {
    // Two rows
    const topRow = Math.ceil(remaining / 2);
    const bottomRow = remaining - topRow;

    const spacing1 = Math.min(maxSpacing, (width - sidePadding) / Math.max(topRow, 1));
    const startX1 = centerX - (spacing1 * (topRow - 1)) / 2;
    for (let i = 0; i < topRow; i++) {
      positions.push({ x: startX1 + i * spacing1, y: midY });
    }

    const spacing2 = Math.min(maxSpacing, (width - sidePadding) / Math.max(bottomRow, 1));
    const startX2 = centerX - (spacing2 * (bottomRow - 1)) / 2;
    for (let i = 0; i < bottomRow; i++) {
      positions.push({ x: startX2 + i * spacing2, y: bottomY });
    }
  }

  return positions;
}

export default function AgentOrgChart() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase.from('agents').select('*').order('name');
      if (data) {
        // Sort: orchestrator first, then by type
        const sorted = (data as unknown as Agent[]).sort((a, b) => {
          if (a.type === 'orchestrator') return -1;
          if (b.type === 'orchestrator') return 1;
          return a.type.localeCompare(b.type);
        });
        setAgents(sorted);
      }
      setLoading(false);
    };
    fetchAgents();
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(500, containerRef.current.clientHeight),
        });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const positions = getPositions(agents.length, dimensions.width, dimensions.height);

  // Draw connection lines from orchestrator to all others
  const connections: { from: number; to: number }[] = [];
  if (agents.length > 1) {
    for (let i = 1; i < agents.length; i++) {
      connections.push({ from: 0, to: i });
    }
    // Some peer connections for visual interest
    if (agents.length > 3) {
      connections.push({ from: 1, to: 2 });
    }
    if (agents.length > 5) {
      connections.push({ from: 3, to: 4 });
    }
  }

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'hsl(25 30% 45% / 0.3)', borderTopColor: 'hsl(25 30% 45%)' }}
          />
          <span
            className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Mapping Fleet
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2
            className="text-xl font-normal tracking-[-0.01em]"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Fleet Topology
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Click any agent to view details & edit instructions
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
          {Object.entries(typeConfig).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: cfg.color }}>{cfg.icon}</span>
              <span
                className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded border border-border overflow-hidden"
        style={{
          height: dimensions.width < 600 ? '640px' : '560px',
          background: 'linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(0 0% 3%) 100%)',
        }}
      >
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(40 10% 82%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {connections.map((conn, i) => {
            const from = positions[conn.from];
            const to = positions[conn.to];
            if (!from || !to) return null;

            const isHovered = hoveredAgent === agents[conn.from]?.id || hoveredAgent === agents[conn.to]?.id;

            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHovered ? 'hsl(25 30% 45% / 0.4)' : 'hsl(0 0% 20% / 0.4)'}
                strokeWidth={isHovered ? 1.5 : 0.75}
                strokeDasharray={conn.from === 0 ? 'none' : '4 4'}
                className="transition-all duration-500"
                style={{
                  opacity: phase >= 2 ? 1 : 0,
                  transition: `opacity 0.8s ease ${i * 100}ms, stroke 0.3s ease, stroke-width 0.3s ease`,
                }}
              />
            );
          })}
        </svg>

        {/* Agent nodes */}
        {agents.map((agent, i) => {
          const pos = positions[i];
          if (!pos) return null;

          const cfg = typeConfig[agent.type] || typeConfig.executor;
          const isHovered = hoveredAgent === agent.id;
          const isOrchestrator = agent.type === 'orchestrator';
          const nodeSize = isOrchestrator ? 72 : 56;

          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
              className="absolute flex flex-col items-center cursor-pointer group"
              style={{
                left: pos.x - nodeSize / 2,
                top: pos.y - nodeSize / 2,
                zIndex: isHovered ? 10 : 2,
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
                transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
              }}
            >
              {/* Pulse ring for active agents */}
              {agent.status === 'active' && (
                <div
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: nodeSize + 16,
                    height: nodeSize + 16,
                    left: -8,
                    top: -8,
                    border: `1px solid ${cfg.color}`,
                    opacity: 0.15,
                    animationDuration: '3s',
                  }}
                />
              )}

              {/* Avatar circle */}
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  width: nodeSize,
                  height: nodeSize,
                  background: cfg.gradient,
                  border: `1.5px solid ${isHovered ? cfg.color : 'hsl(0 0% 15%)'}`,
                  boxShadow: isHovered
                    ? `0 0 24px ${cfg.ring}, 0 4px 16px hsl(0 0% 0% / 0.5)`
                    : '0 2px 8px hsl(0 0% 0% / 0.3)',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <span
                  className="transition-all duration-300"
                  style={{
                    fontSize: isOrchestrator ? '24px' : '18px',
                    color: cfg.color,
                    filter: isHovered ? `drop-shadow(0 0 6px ${cfg.color})` : 'none',
                  }}
                >
                  {cfg.icon}
                </span>
              </div>

              {/* Status dot */}
              <div
                className="absolute rounded-full border-2"
                style={{
                  width: 10,
                  height: 10,
                  bottom: isOrchestrator ? 22 : 16,
                  right: isOrchestrator ? 2 : -2,
                  background: statusDot[agent.status] || statusDot.idle,
                  borderColor: 'hsl(0 0% 4%)',
                  boxShadow: agent.status === 'active'
                    ? `0 0 6px ${statusDot[agent.status]}`
                    : 'none',
                }}
              />

              {/* Name label */}
              <span
                className="mt-2 text-center whitespace-nowrap transition-all duration-300"
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: isOrchestrator ? '11px' : '10px',
                  fontWeight: isOrchestrator ? 600 : 500,
                  color: isHovered ? 'hsl(40 10% 82%)' : 'hsl(40 4% 50%)',
                }}
              >
                {agent.name}
              </span>

              {/* Type label */}
              <span
                className="text-center whitespace-nowrap"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '7px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  color: cfg.color,
                  opacity: 0.6,
                }}
              >
                {agent.type}
              </span>

              {/* Current task tooltip on hover */}
              {isHovered && agent.current_task && (
                <div
                  className="absolute top-full mt-6 px-3 py-2 rounded border border-border max-w-[200px] text-left"
                  style={{
                    background: 'hsl(0 0% 6%)',
                    zIndex: 20,
                  }}
                >
                  <span
                    className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground block mb-1"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Current Task
                  </span>
                  <span className="text-[10px] text-foreground leading-relaxed">
                    {agent.current_task}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Agent detail modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onUpdate={(updated) => {
            setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
            setSelectedAgent(updated);
          }}
        />
      )}
    </div>
  );
}
