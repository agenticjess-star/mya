import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  last_heartbeat: string;
}

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  active: { color: 'hsl(160 40% 45%)', label: 'Active', dot: 'hsl(160 50% 50%)' },
  idle: { color: 'hsl(40 30% 45%)', label: 'Idle', dot: 'hsl(40 40% 50%)' },
  standby: { color: 'hsl(200 25% 45%)', label: 'Standby', dot: 'hsl(200 35% 50%)' },
  error: { color: 'hsl(0 50% 50%)', label: 'Error', dot: 'hsl(0 60% 55%)' },
};

const typeIcons: Record<string, string> = {
  orchestrator: '◈',
  persistence: '◉',
  analyst: '◎',
  executor: '▣',
  validator: '◆',
  planner: '△',
};

export default function AgentStatusBoard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase.from('agents').select('*').order('name');
      if (data) setAgents(data as Agent[]);
      setLoading(false);
    };
    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 rounded border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-normal tracking-[-0.01em]"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Agent Fleet
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {agents.filter(a => a.status === 'active').length} of {agents.length} active
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, i) => {
          const sc = statusConfig[agent.status] || statusConfig.idle;
          return (
            <div
              key={agent.id}
              className="rounded border border-border bg-card p-5 transition-all duration-500 hover:border-accent/30"
              style={{
                animationDelay: `${i * 80}ms`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg" style={{ color: sc.color }}>
                    {typeIcons[agent.type] || '●'}
                  </span>
                  <div>
                    <h3
                      className="text-sm font-medium"
                      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                    >
                      {agent.name}
                    </h3>
                    <span
                      className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {agent.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: sc.dot,
                      boxShadow: agent.status === 'active' ? `0 0 8px ${sc.dot}` : 'none',
                    }}
                  />
                  <span
                    className="text-[9px] tracking-[0.1em] uppercase"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: sc.color }}
                  >
                    {sc.label}
                  </span>
                </div>
              </div>

              {/* Model */}
              {agent.model && (
                <div
                  className="text-[10px] tracking-[0.1em] px-2 py-1 rounded-sm border border-border inline-block mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(40 4% 40%)' }}
                >
                  {agent.model}
                </div>
              )}

              {/* Current task */}
              {agent.current_task && (
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  {agent.current_task}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-4 mt-auto pt-3 border-t border-border">
                <Stat label="Uptime" value={`${agent.uptime_hours}h`} />
                <Stat label="Tasks" value={String(agent.tasks_completed)} />
                <Stat label="Success" value={`${agent.success_rate}%`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </p>
      <p
        className="text-xs font-medium"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(40 10% 70%)' }}
      >
        {value}
      </p>
    </div>
  );
}
