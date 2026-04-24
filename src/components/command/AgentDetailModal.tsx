import { useState } from 'react';
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
  system_instructions: string | null;
  connections: string[] | null;
}

const typeConfig: Record<string, { icon: string; color: string }> = {
  orchestrator: { icon: '◈', color: 'hsl(25 35% 55%)' },
  persistence: { icon: '◉', color: 'hsl(200 35% 55%)' },
  analyst: { icon: '◎', color: 'hsl(280 30% 55%)' },
  executor: { icon: '▣', color: 'hsl(160 35% 50%)' },
  validator: { icon: '◆', color: 'hsl(40 40% 55%)' },
  planner: { icon: '△', color: 'hsl(340 30% 55%)' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'hsl(160 50% 50%)' },
  idle: { label: 'Idle', color: 'hsl(40 40% 50%)' },
  standby: { label: 'Standby', color: 'hsl(200 35% 50%)' },
  error: { label: 'Error', color: 'hsl(0 60% 55%)' },
};

interface Props {
  agent: Agent;
  onClose: () => void;
  onUpdate: (agent: Agent) => void;
}

export default function AgentDetailModal({ agent, onClose, onUpdate }: Props) {
  const [instructions, setInstructions] = useState(agent.system_instructions || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cfg = typeConfig[agent.type] || typeConfig.executor;
  const status = statusLabels[agent.status] || statusLabels.idle;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('agents')
      .update({ system_instructions: instructions } as any)
      .eq('id', agent.id);

    if (!error) {
      onUpdate({ ...agent, system_instructions: instructions });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'hsl(0 0% 0% / 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sidecar panel */}
      <div
        className="relative z-10 h-full w-full max-w-lg border-l border-border overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, hsl(0 0% 5%) 0%, hsl(0 0% 3.5%) 100%)',
          animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-8 pt-8 pb-6 border-b border-border" style={{ background: 'hsl(0 0% 5% / 0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: status.color,
                  boxShadow: agent.status === 'active' ? `0 0 8px ${status.color}` : 'none',
                }}
              />
              <span
                className="text-[9px] tracking-[0.15em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: status.color }}
              >
                {status.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${cfg.color}20 0%, ${cfg.color}08 100%)`,
                border: `1.5px solid ${cfg.color}40`,
              }}
            >
              <span style={{ fontSize: '28px', color: cfg.color }}>{cfg.icon}</span>
            </div>
            <div>
              <h2
                className="text-xl font-normal tracking-[-0.01em]"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                {agent.name}
              </h2>
              <span
                className="text-[9px] tracking-[0.2em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: cfg.color }}
              >
                {agent.type}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Uptime" value={`${agent.uptime_hours}h`} />
            <StatCard label="Tasks Done" value={String(agent.tasks_completed)} />
            <StatCard label="Success" value={`${agent.success_rate}%`} />
          </div>

          {/* Model */}
          {agent.model && (
            <div>
              <label
                className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground block mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Model
              </label>
              <div
                className="text-xs px-3 py-2 rounded border border-border inline-block"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(40 10% 70%)' }}
              >
                {agent.model}
              </div>
            </div>
          )}

          {/* Current Task */}
          {agent.current_task && (
            <div>
              <label
                className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground block mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Current Task
              </label>
              <p className="text-sm text-foreground leading-relaxed">{agent.current_task}</p>
            </div>
          )}

          {/* System Instructions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                System Instructions
              </label>
              {saved && (
                <span
                  className="text-[9px] tracking-[0.15em] uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(160 50% 50%)' }}
                >
                  ✓ Saved
                </span>
              )}
            </div>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={8}
              className="w-full bg-transparent border border-border rounded px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none focus:border-accent transition-colors resize-y"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
              placeholder="Define this agent's system instructions..."
            />
            <button
              onClick={handleSave}
              disabled={saving || instructions === (agent.system_instructions || '')}
              className="mt-3 text-[10px] tracking-[0.2em] uppercase px-5 py-2 border rounded transition-all duration-300 disabled:opacity-30"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: 'hsl(25 30% 35%)',
                color: 'hsl(25 30% 55%)',
              }}
            >
              {saving ? 'Saving...' : 'Update Instructions'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 rounded border border-border">
      <p
        className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground mb-1"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </p>
      <p
        className="text-base font-medium"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: 'hsl(40 10% 70%)' }}
      >
        {value}
      </p>
    </div>
  );
}
