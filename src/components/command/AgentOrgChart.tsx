import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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

interface Packet {
  id: string;
  fromIdx: number;
  toIdx: number;
  startedAt: number;
  duration: number;
  hue: string;
  label?: string;
}

interface BusEvent {
  agent: string;
  subtask?: string;
  content?: string;
  message?: string;
  type: string;
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

// Radial layout: orchestrator at center, specialists on a ring around it.
// Ralph (persistence / memory bus) is placed on an inner orbit so its many connections
// look like a true memory backbone rather than a tangle.
function getPositions(agents: Agent[], width: number, height: number) {
  const positions: { x: number; y: number }[] = [];
  if (agents.length === 0) return positions;
  const cx = width / 2;
  const cy = height / 2;
  const isNarrow = width < 600;
  // Tighter ring on mobile so node labels don't clip off the right/left edges
  const outerR = Math.min(width, height) * (isNarrow ? 0.28 : 0.34);
  const innerR = Math.min(width, height) * (isNarrow ? 0.14 : 0.16);

  // Orchestrator at center, Ralph on inner orbit, rest on outer ring
  const outerAgents: number[] = [];
  let ralphIdx = -1;
  agents.forEach((a, i) => {
    if (a.type === 'orchestrator') return;
    if (a.name === 'Ralph') ralphIdx = i;
    else outerAgents.push(i);
  });

  agents.forEach((a, i) => {
    if (a.type === 'orchestrator') {
      positions[i] = { x: cx, y: cy };
    }
  });

  if (ralphIdx >= 0) {
    positions[ralphIdx] = { x: cx, y: cy - innerR - 10 };
  }

  // Distribute outer agents on a ring, starting from top-right
  const startAngle = -Math.PI / 2 + Math.PI / outerAgents.length;
  outerAgents.forEach((idx, k) => {
    const angle = startAngle + (k / outerAgents.length) * Math.PI * 2;
    positions[idx] = {
      x: cx + Math.cos(angle) * outerR,
      y: cy + Math.sin(angle) * outerR,
    };
  });

  return positions;
}

// Curved bezier path between two points, bowed outward from canvas center
function bezierPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  cx: number,
  cy: number,
  bow = 0.18,
) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  // push midpoint slightly away from center
  const dx = mx - cx;
  const dy = my - cy;
  const len = Math.hypot(dx, dy) || 1;
  const cxp = mx + (dx / len) * 30 + (to.y - from.y) * bow * 0.3;
  const cyp = my + (dy / len) * 30 - (to.x - from.x) * bow * 0.3;
  return `M ${from.x} ${from.y} Q ${cxp} ${cyp} ${to.x} ${to.y}`;
}

// Point along a quadratic bezier at parameter t in [0,1]
function bezierPoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  cx: number,
  cy: number,
  t: number,
) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = mx - cx;
  const dy = my - cy;
  const len = Math.hypot(dx, dy) || 1;
  const cxp = mx + (dx / len) * 30;
  const cyp = my + (dy / len) * 30;
  const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cxp + t * t * to.x;
  const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cyp + t * t * to.y;
  return { x, y };
}

export default function AgentOrgChart() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Mode + telemetry
  const [mode, setMode] = useState<'simulation' | 'live'>('simulation');
  const [packets, setPackets] = useState<Packet[]>([]);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const [directive, setDirective] = useState('');
  const [running, setRunning] = useState(false);
  const [transcript, setTranscript] = useState<BusEvent[]>([]);
  const [finalOutput, setFinalOutput] = useState<string>('');
  const rafRef = useRef<number>();

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

  const positions = useMemo(
    () => getPositions(agents, dimensions.width, dimensions.height),
    [agents, dimensions.width, dimensions.height],
  );

  // Build connection edges from agents.connections (id arrays). Dedupe pairs.
  const connections = useMemo(() => {
    const edges: { from: number; to: number; kind: 'command' | 'memory' | 'policy' }[] = [];
    const seen = new Set<string>();
    agents.forEach((a, i) => {
      (a.connections || []).forEach((targetId) => {
        const j = agents.findIndex((x) => x.id === targetId);
        if (j < 0 || j === i) return;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        const kind: 'command' | 'memory' | 'policy' =
          a.name === 'Ralph' || agents[j].name === 'Ralph'
            ? 'memory'
            : a.name === 'Sentinel' || agents[j].name === 'Sentinel'
            ? 'policy'
            : 'command';
        edges.push({ from: i, to: j, kind });
      });
    });
    return edges;
  }, [agents]);

  // Animation tick driver (for moving packets)
  useEffect(() => {
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Garbage-collect expired packets
  useEffect(() => {
    if (packets.length === 0) return;
    const now = performance.now();
    const live = packets.filter((p) => now - p.startedAt < p.duration + 100);
    if (live.length !== packets.length) setPackets(live);
  }, [tick, packets]);

  const fireBetween = useCallback(
    (fromName: string, toName: string, label?: string) => {
      const fromIdx = agents.findIndex((a) => a.name === fromName);
      const toIdx = agents.findIndex((a) => a.name === toName);
      if (fromIdx < 0 || toIdx < 0) return;
      const hue =
        toName === 'Ralph'
          ? 'hsl(200 60% 60%)'
          : toName === 'Sentinel'
          ? 'hsl(40 70% 60%)'
          : 'hsl(25 70% 60%)';
      setPackets((prev) => [
        ...prev,
        {
          id: `${fromName}-${toName}-${performance.now()}-${Math.random()}`,
          fromIdx,
          toIdx,
          startedAt: performance.now(),
          duration: 1100,
          hue,
          label,
        },
      ]);
      setActiveAgents((prev) => new Set(prev).add(toName));
      setTimeout(() => {
        setActiveAgents((prev) => {
          const n = new Set(prev);
          n.delete(toName);
          return n;
        });
      }, 1400);
    },
    [agents],
  );

  // Simulation: random traffic from Chief of Staff out to specialists
  useEffect(() => {
    if (mode !== 'simulation' || agents.length === 0 || running) return;
    const specialists = agents.filter((a) => a.type !== 'orchestrator');
    const interval = setInterval(() => {
      const target = specialists[Math.floor(Math.random() * specialists.length)];
      if (!target) return;
      fireBetween('Chief of Staff', target.name);
      // Memory write back to Ralph half the time
      if (Math.random() < 0.5 && target.name !== 'Ralph') {
        setTimeout(() => fireBetween(target.name, 'Ralph'), 400);
      }
      // Sentinel validates executors
      if (['Forge', 'Herald', 'Scout'].includes(target.name) && Math.random() < 0.4) {
        setTimeout(() => fireBetween('Sentinel', target.name), 200);
      }
    }, 1300);
    return () => clearInterval(interval);
  }, [mode, agents, fireBetween, running]);

  // Live mode: stream from orchestrate edge function
  const runDirective = async () => {
    if (!directive.trim() || running) return;
    setRunning(true);
    setTranscript([]);
    setFinalOutput('');
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrate`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ directive }),
      });
      if (!resp.ok || !resp.body) {
        setTranscript([{ type: 'error', agent: 'system', message: `Failed: ${resp.status}` }]);
        setRunning(false);
        return;
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            handleLiveEvent(evt);
          } catch {
            // partial
          }
        }
      }
    } catch (e: any) {
      setTranscript((t) => [...t, { type: 'error', agent: 'system', message: e?.message || 'error' }]);
    } finally {
      setRunning(false);
    }
  };

  const handleLiveEvent = (evt: any) => {
    setTranscript((t) => [...t, evt]);
    if (evt.type === 'routed' && Array.isArray(evt.assignments)) {
      evt.assignments.forEach((a: any, i: number) => {
        setTimeout(() => fireBetween('Chief of Staff', a.agent_name, a.subtask), i * 250);
      });
    } else if (evt.type === 'dispatch') {
      // already animated above; flash a memory write
      setTimeout(() => fireBetween(evt.agent, 'Ralph'), 600);
    } else if (evt.type === 'result') {
      setTimeout(() => fireBetween(evt.agent, 'Chief of Staff'), 100);
    } else if (evt.type === 'final') {
      setFinalOutput(evt.content || '');
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2
            className="text-xl font-normal tracking-[-0.01em]"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Fleet Topology
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'simulation'
              ? 'Synthetic traffic · click any agent to inspect'
              : 'Live orchestration · directives route through Chief of Staff'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-3">
          <div
            className="inline-flex rounded border border-border overflow-hidden"
            style={{ background: 'hsl(0 0% 5%)' }}
          >
            {(['simulation', 'live'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1.5 text-[9px] tracking-[0.2em] uppercase transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: mode === m ? 'hsl(25 35% 18%)' : 'transparent',
                  color: mode === m ? 'hsl(25 50% 70%)' : 'hsl(40 4% 45%)',
                }}
              >
                {m === 'simulation' ? '◐ Simulation' : '◉ Live'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live directive input */}
      {mode === 'live' && (
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={directive}
            onChange={(e) => setDirective(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runDirective()}
            placeholder="Issue a directive to the Chief of Staff…"
            disabled={running}
            className="flex-1 bg-transparent border border-border rounded px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            style={{ fontFamily: "'Instrument Sans', sans-serif" }}
          />
          <button
            onClick={runDirective}
            disabled={!directive.trim() || running}
            className="px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase border rounded transition-all disabled:opacity-30"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              borderColor: 'hsl(25 30% 35%)',
              color: 'hsl(25 50% 65%)',
              background: running ? 'hsl(25 30% 12%)' : 'transparent',
            }}
          >
            {running ? 'Routing…' : 'Dispatch'}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4">
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

      <div
        ref={containerRef}
        className="relative w-full rounded border border-border overflow-hidden"
        style={{
          height: dimensions.width < 600 ? '560px' : '620px',
          background:
            'radial-gradient(ellipse at center, hsl(25 20% 6%) 0%, hsl(0 0% 3%) 70%, hsl(0 0% 2%) 100%)',
        }}
      >
        {/* Concentric rings + grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" style={{ zIndex: 0 }}>
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="hsl(40 10% 82%)" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(25 50% 50%)" stopOpacity="0.25" />
              <stop offset="60%" stopColor="hsl(25 50% 50%)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2 < 310 ? dimensions.height / 2 : 310}
            r={Math.min(dimensions.width, 620) * 0.34}
            fill="none"
            stroke="hsl(25 30% 30% / 0.18)"
            strokeDasharray="2 6"
          />
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2 < 310 ? dimensions.height / 2 : 310}
            r={Math.min(dimensions.width, 620) * 0.18}
            fill="none"
            stroke="hsl(200 30% 35% / 0.18)"
            strokeDasharray="2 6"
          />
        </svg>

        {/* Edges + traveling packets */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {connections.map((conn, i) => {
            const from = positions[conn.from];
            const to = positions[conn.to];
            if (!from || !to) return null;
            const fromAgent = agents[conn.from];
            const toAgent = agents[conn.to];
            const isHovered =
              hoveredAgent === fromAgent?.id || hoveredAgent === toAgent?.id;
            const isActive =
              activeAgents.has(fromAgent?.name || '') ||
              activeAgents.has(toAgent?.name || '');

            const baseStroke =
              conn.kind === 'memory'
                ? 'hsl(200 30% 40% / 0.22)'
                : conn.kind === 'policy'
                ? 'hsl(40 35% 40% / 0.22)'
                : 'hsl(25 30% 40% / 0.22)';
            const hotStroke =
              conn.kind === 'memory'
                ? 'hsl(200 60% 60% / 0.7)'
                : conn.kind === 'policy'
                ? 'hsl(40 70% 60% / 0.7)'
                : 'hsl(25 70% 60% / 0.7)';

            return (
              <path
                key={i}
                d={bezierPath(from, to, dimensions.width / 2, dimensions.height / 2)}
                fill="none"
                stroke={isHovered || isActive ? hotStroke : baseStroke}
                strokeWidth={isHovered || isActive ? 1.4 : 0.8}
                strokeDasharray={conn.kind === 'memory' ? '3 4' : 'none'}
                style={{
                  opacity: phase >= 2 ? 1 : 0,
                  transition: `opacity 0.8s ease ${i * 60}ms, stroke 0.3s, stroke-width 0.3s`,
                  filter: isActive ? 'url(#glow)' : 'none',
                }}
              />
            );
          })}

          {/* Packets */}
          {packets.map((p) => {
            const from = positions[p.fromIdx];
            const to = positions[p.toIdx];
            if (!from || !to) return null;
            const t = Math.min(1, (performance.now() - p.startedAt) / p.duration);
            const pt = bezierPoint(from, to, dimensions.width / 2, dimensions.height / 2, t);
            const opacity = t < 0.1 ? t * 10 : t > 0.9 ? (1 - t) * 10 : 1;
            return (
              <g key={p.id} style={{ opacity }}>
                <circle cx={pt.x} cy={pt.y} r={6} fill={p.hue} opacity={0.25} filter="url(#glow)" />
                <circle cx={pt.x} cy={pt.y} r={2.5} fill={p.hue} />
              </g>
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
          const isNarrow = dimensions.width < 600;
          const nodeSize = isOrchestrator ? (isNarrow ? 70 : 92) : (isNarrow ? 46 : 60);
          const isActiveNow = activeAgents.has(agent.name);

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
              {(agent.status === 'active' || isActiveNow) && (
                <div
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: nodeSize + 16,
                    height: nodeSize + 16,
                    left: -8,
                    top: -8,
                    border: `1px solid ${cfg.color}`,
                    opacity: isActiveNow ? 0.4 : 0.15,
                    animationDuration: isActiveNow ? '1.2s' : '3s',
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
                  border: `1.5px solid ${isHovered || isActiveNow ? cfg.color : 'hsl(0 0% 15%)'}`,
                  boxShadow: isHovered
                    ? `0 0 24px ${cfg.ring}, 0 4px 16px hsl(0 0% 0% / 0.5)`
                    : isActiveNow
                    ? `0 0 18px ${cfg.ring}`
                    : '0 2px 8px hsl(0 0% 0% / 0.3)',
                  transform: isHovered ? 'scale(1.1)' : isActiveNow ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <span
                  className="transition-all duration-300"
                  style={{
                    fontSize: isOrchestrator ? '32px' : '20px',
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

      {/* Live transcript */}
      {mode === 'live' && (transcript.length > 0 || finalOutput) && (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div
            className="rounded border border-border p-4 max-h-72 overflow-y-auto"
            style={{ background: 'hsl(0 0% 4%)' }}
          >
            <div
              className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Orchestration Trace
            </div>
            <div className="space-y-2">
              {transcript.map((e, i) => (
                <div key={i} className="text-[11px] leading-relaxed">
                  <span
                    className="text-[9px] tracking-[0.15em] uppercase mr-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color:
                        e.type === 'error'
                          ? 'hsl(0 60% 60%)'
                          : e.type === 'final' || e.type === 'done'
                          ? 'hsl(160 50% 55%)'
                          : 'hsl(25 50% 60%)',
                    }}
                  >
                    {e.type}
                  </span>
                  <span className="text-foreground">{e.agent}</span>
                  {e.subtask && <span className="text-muted-foreground"> · {e.subtask}</span>}
                  {e.message && <span className="text-muted-foreground"> · {e.message}</span>}
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded border border-border p-4 max-h-72 overflow-y-auto"
            style={{ background: 'hsl(0 0% 4%)' }}
          >
            <div
              className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Synthesis
            </div>
            {finalOutput ? (
              <p
                className="text-sm leading-relaxed text-foreground whitespace-pre-wrap"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                {finalOutput}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">Awaiting synthesis…</p>
            )}
          </div>
        </div>
      )}

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
