import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  agent_name: string;
  event_type: string;
  message: string;
  created_at: string;
}

const eventStyles: Record<string, { color: string; icon: string }> = {
  task_routed: { color: 'hsl(25 35% 50%)', icon: '→' },
  task_complete: { color: 'hsl(160 40% 45%)', icon: '✓' },
  state_saved: { color: 'hsl(200 25% 45%)', icon: '◉' },
  context_restore: { color: 'hsl(200 25% 45%)', icon: '↺' },
  validation_pass: { color: 'hsl(160 40% 45%)', icon: '◆' },
  validation_fail: { color: 'hsl(0 50% 50%)', icon: '✕' },
  analysis_complete: { color: 'hsl(280 18% 48%)', icon: '◎' },
  priority_shift: { color: 'hsl(40 30% 48%)', icon: '⇅' },
  escalation: { color: 'hsl(0 50% 50%)', icon: '!' },
  plan_updated: { color: 'hsl(40 30% 48%)', icon: '△' },
  info: { color: 'hsl(40 4% 40%)', icon: '·' },
};

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setLogs(data as LogEntry[]);
      setLoading(false);
    };
    fetchLogs();

    // Realtime subscription
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          setLogs(prev => [payload.new as LogEntry, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 rounded border border-border bg-card animate-pulse" />
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
            Activity Stream
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time event feed · {logs.length} events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span
            className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Live
          </span>
        </div>
      </div>

      <div className="space-y-0">
        {logs.map((log, i) => {
          const es = eventStyles[log.event_type] || eventStyles.info;
          const time = new Date(log.created_at);
          const timeStr = time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });

          return (
            <div
              key={log.id}
              className="flex items-start gap-4 py-3 border-b border-border/50 group hover:bg-card/30 transition-colors px-2 -mx-2 rounded"
            >
              {/* Time */}
              <span
                className="text-[10px] tracking-[0.05em] shrink-0 pt-0.5"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'hsl(0 0% 22%)',
                  minWidth: '64px',
                }}
              >
                {timeStr}
              </span>

              {/* Icon */}
              <span
                className="text-sm shrink-0 pt-0.5"
                style={{ color: es.color, minWidth: '16px' }}
              >
                {es.icon}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-[10px] tracking-[0.15em] uppercase font-medium shrink-0"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: es.color,
                    }}
                  >
                    {log.agent_name}
                  </span>
                  <span
                    className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/40"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {log.event_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed truncate">
                  {log.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
