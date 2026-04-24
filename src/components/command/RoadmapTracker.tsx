import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RoadmapTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_agent: string | null;
  progress: number;
  due_date: string | null;
  created_at: string;
}

const statusOrder = ['in_progress', 'planned', 'completed'];
const statusLabels: Record<string, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: 'hsl(25 35% 50%)' },
  planned: { label: 'Planned', color: 'hsl(200 25% 45%)' },
  completed: { label: 'Completed', color: 'hsl(160 40% 45%)' },
};

const priorityStyles: Record<string, { color: string; bg: string }> = {
  critical: { color: 'hsl(0 60% 55%)', bg: 'hsl(0 60% 55% / 0.1)' },
  high: { color: 'hsl(25 40% 50%)', bg: 'hsl(25 40% 50% / 0.1)' },
  medium: { color: 'hsl(40 30% 45%)', bg: 'hsl(40 30% 45% / 0.1)' },
  low: { color: 'hsl(200 20% 45%)', bg: 'hsl(200 20% 45% / 0.1)' },
};

export default function RoadmapTracker() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase.from('roadmap_tasks').select('*').order('created_at');
      if (data) setTasks(data as RoadmapTask[]);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const grouped = statusOrder.map(status => ({
    status,
    ...statusLabels[status],
    tasks: tasks.filter(t => t.status === status),
  }));

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-xl font-normal tracking-[-0.01em]"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          Roadmap
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {tasks.filter(t => t.status !== 'completed').length} active tasks ·{' '}
          {tasks.filter(t => t.status === 'completed').length} completed
        </p>
      </div>

      <div className="space-y-10">
        {grouped.map(group => (
          <div key={group.status}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-px" style={{ background: group.color }} />
              <h3
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: group.color,
                }}
              >
                {group.label}
              </h3>
              <span
                className="text-[9px] text-muted-foreground/40"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {group.tasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {group.tasks.map(task => {
                const ps = priorityStyles[task.priority] || priorityStyles.medium;
                return (
                  <div
                    key={task.id}
                    className="rounded border border-border bg-card p-4 transition-all hover:border-accent/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4
                            className="text-sm font-medium truncate"
                            style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                          >
                            {task.title}
                          </h4>
                          <span
                            className="text-[8px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: ps.color,
                              background: ps.bg,
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          {task.assigned_agent && (
                            <span
                              className="text-[9px] tracking-[0.1em] text-muted-foreground"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              ◈ {task.assigned_agent}
                            </span>
                          )}
                          {task.due_date && (
                            <span
                              className="text-[9px] tracking-[0.1em] text-muted-foreground/60"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              Due {new Date(task.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      {task.status !== 'completed' && task.progress > 0 && (
                        <div className="shrink-0 w-16 flex flex-col items-end gap-1">
                          <span
                            className="text-[10px]"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: group.color,
                            }}
                          >
                            {task.progress}%
                          </span>
                          <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${task.progress}%`,
                                background: group.color,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {task.status === 'completed' && (
                        <span
                          className="text-sm shrink-0"
                          style={{ color: group.color }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
