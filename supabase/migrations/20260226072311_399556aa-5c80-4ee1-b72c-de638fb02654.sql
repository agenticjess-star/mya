
-- Agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'executor',
  status TEXT NOT NULL DEFAULT 'idle',
  model TEXT,
  current_task TEXT,
  uptime_hours NUMERIC DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Roadmap tasks table
CREATE TABLE public.roadmap_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_agent TEXT,
  progress INTEGER DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read for Captain's Key authenticated sessions (no RLS for now - gated by app-level key)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;

-- Public read policies (gated by Captain's Key at app level)
CREATE POLICY "Allow public read on agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Allow public read on activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read on roadmap_tasks" ON public.roadmap_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on agents" ON public.agents FOR UPDATE USING (true);
CREATE POLICY "Allow public update on roadmap_tasks" ON public.roadmap_tasks FOR UPDATE USING (true);

-- Enable realtime for activity logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Seed mock agents
INSERT INTO public.agents (name, type, status, model, current_task, uptime_hours, tasks_completed, success_rate) VALUES
  ('Zoe', 'orchestrator', 'active', 'GPT-4o', 'Routing task pipeline for Sprint 14', 847.2, 1243, 99.2),
  ('Ralph', 'persistence', 'active', 'o3', 'Compressing session state', 612.5, 892, 98.7),
  ('Gemini Scout', 'analyst', 'active', 'Gemini 2.5', 'Visual synthesis of dashboard metrics', 234.1, 456, 97.1),
  ('Codex', 'executor', 'idle', 'GPT-4o', NULL, 502.3, 789, 96.8),
  ('Sentinel', 'validator', 'active', 'o3', 'Council review on deployment spec', 389.6, 567, 99.5),
  ('Architect', 'planner', 'standby', 'GPT-4o', NULL, 156.8, 234, 98.1);

-- Seed mock activity logs
INSERT INTO public.activity_logs (agent_name, event_type, message) VALUES
  ('Zoe', 'task_routed', 'Routed "API integration spec" to Codex for execution'),
  ('Ralph', 'state_saved', 'Session state compressed and persisted (14.2KB → 3.1KB)'),
  ('Sentinel', 'validation_pass', 'Council review passed: deployment spec approved (3/3 consensus)'),
  ('Gemini Scout', 'analysis_complete', 'Dashboard metric synthesis complete — 12 anomalies flagged'),
  ('Zoe', 'priority_shift', 'Priority arbitration: Sprint 14 items reordered based on dependency graph'),
  ('Codex', 'task_complete', 'Edge function deployed: /api/agent-heartbeat'),
  ('Ralph', 'context_restore', 'Session context restored from checkpoint #847'),
  ('Sentinel', 'validation_fail', 'Council review flagged: inconsistency in data pipeline spec'),
  ('Zoe', 'escalation', 'Stalled task escalated: "Schema migration" idle for 2h'),
  ('Architect', 'plan_updated', 'Roadmap v3.2 generated — 3 new milestones added');

-- Seed mock roadmap tasks
INSERT INTO public.roadmap_tasks (title, description, status, priority, assigned_agent, progress, due_date) VALUES
  ('Agent Communication Protocol v2', 'Implement inter-agent messaging with priority queues', 'in_progress', 'high', 'Codex', 65, '2026-03-15'),
  ('Council Review Automation', 'Automate multi-model validation pipeline', 'in_progress', 'critical', 'Sentinel', 40, '2026-03-10'),
  ('Context Compression Engine', 'Build token-efficient context serialization', 'completed', 'high', 'Ralph', 100, '2026-02-20'),
  ('Dashboard Real-time Feeds', 'WebSocket-based live activity streaming', 'planned', 'medium', 'Codex', 0, '2026-03-25'),
  ('Agent Swarm Scaling', 'Horizontal scaling for parallel agent execution', 'planned', 'high', 'Architect', 10, '2026-04-01'),
  ('Living Spec Engine v2', 'Auto-updating specifications with decision logging', 'in_progress', 'medium', 'Zoe', 55, '2026-03-20');
