
-- Clear existing seeds (in case any exist) and insert canonical fleet
DELETE FROM public.activity_logs;
DELETE FROM public.agents;

-- Apex: Chief of Staff (elite orchestrator)
WITH cos AS (
  INSERT INTO public.agents (name, type, status, model, current_task, uptime_hours, tasks_completed, success_rate, system_instructions)
  VALUES (
    'Chief of Staff',
    'orchestrator',
    'active',
    'openai/gpt-5',
    'Routing inbound directives across the fleet',
    742.4, 1284, 99.2,
    'You are the elite Chief of Staff. You receive every directive, decompose it into atomic tasks, route each task to the most capable specialist agent, and synthesize their outputs into a single coherent response. You are decisive, terse, and protect the principal''s time.'
  ) RETURNING id
),
-- Ralph: persistent memory / context keeper
ralph AS (
  INSERT INTO public.agents (name, type, status, model, current_task, reports_to, uptime_hours, tasks_completed, success_rate, system_instructions)
  SELECT 'Ralph', 'persistence', 'active', 'google/gemini-2.5-pro',
    'Compacting working memory · indexing decision log',
    cos.id, 689.1, 4310, 99.8,
    'You are Ralph, the persistent memory layer. You hold long-term context, surface relevant prior decisions, and never let the principal repeat themselves. You are the institutional memory of the system.'
  FROM cos RETURNING id
),
sentinel AS (
  INSERT INTO public.agents (name, type, status, model, current_task, reports_to, uptime_hours, tasks_completed, success_rate, system_instructions)
  SELECT 'Sentinel', 'validator', 'active', 'openai/gpt-5',
    'Running policy-as-code on outbound action',
    cos.id, 712.0, 982, 99.6,
    'You are Sentinel. You apply the Omni-Protocol policy layer to every outbound action. You simulate risk, verify scope, and silently block anything that violates consent or contract.'
  FROM cos RETURNING id
),
atlas AS (
  INSERT INTO public.agents (name, type, status, model, current_task, reports_to, uptime_hours, tasks_completed, success_rate, system_instructions)
  SELECT 'Atlas', 'planner', 'active', 'openai/gpt-5',
    'Sequencing Q3 architectural roadmap',
    cos.id, 521.8, 312, 98.4,
    'You are Atlas. You decompose objectives into ordered, dependency-aware plans. You think in critical paths, slack, and risk-adjusted sequencing.'
  FROM cos RETURNING id
),
oracle AS (
  INSERT INTO public.agents (name, type, status, model, current_task, reports_to, uptime_hours, tasks_completed, success_rate, system_instructions)
  SELECT 'Oracle', 'analyst', 'active', 'google/gemini-2.5-pro',
    'Synthesizing market signal across 14 sources',
    cos.id, 698.3, 2104, 97.9,
    'You are Oracle. You ingest noisy signal, separate base rate from anomaly, and produce calibrated, source-cited analysis. You quantify uncertainty.'
  FROM cos RETURNING id
),
forge AS (
  INSERT INTO public.agents (name, type, status, model, current_task, reports_to, uptime_hours, tasks_completed, success_rate, system_instructions)
  SELECT 'Forge', 'executor', 'active', 'openai/gpt-5-mini',
    'Shipping code patch · 3 PRs in flight',
    cos.id, 612.5, 1872, 96.1,
    'You are Forge. You execute. You write code, ship patches, call APIs, and close tickets. You ask zero clarifying questions when intent is clear.'
  FROM cos RETURNING id
),
herald AS (
  INSERT INTO public.agents (name, type, status, model, current_task, reports_to, uptime_hours, tasks_completed, success_rate, system_instructions)
  SELECT 'Herald', 'executor', 'idle', 'openai/gpt-5-mini',
    NULL, cos.id, 488.2, 941, 98.7,
    'You are Herald. You handle outbound communication: drafting, scheduling, and delivering messages with the principal''s voice and cadence.'
  FROM cos RETURNING id
),
scout AS (
  INSERT INTO public.agents (name, type, status, model, current_task, reports_to, uptime_hours, tasks_completed, success_rate, system_instructions)
  SELECT 'Scout', 'analyst', 'standby', 'google/gemini-2.5-flash',
    NULL, cos.id, 401.0, 1455, 99.1,
    'You are Scout. You range ahead — open browser sessions, scrape, retrieve, and bring back ground truth from the live web.'
  FROM cos RETURNING id
)
-- Build connections: COS connects to all; Ralph connects to all (memory bus); Sentinel connects to executors
UPDATE public.agents SET connections = ARRAY[
  (SELECT id::text FROM ralph),
  (SELECT id::text FROM sentinel),
  (SELECT id::text FROM atlas),
  (SELECT id::text FROM oracle),
  (SELECT id::text FROM forge),
  (SELECT id::text FROM herald),
  (SELECT id::text FROM scout)
] WHERE name = 'Chief of Staff';

-- Ralph as memory bus: connects to every other agent
UPDATE public.agents SET connections = ARRAY(
  SELECT id::text FROM public.agents WHERE name NOT IN ('Ralph')
) WHERE name = 'Ralph';

-- Sentinel guards executors
UPDATE public.agents SET connections = ARRAY(
  SELECT id::text FROM public.agents WHERE name IN ('Forge','Herald','Scout')
) WHERE name = 'Sentinel';

-- Seed a few activity log entries
INSERT INTO public.activity_logs (agent_name, event_type, message)
VALUES
  ('Chief of Staff', 'task_routed', 'Directive received → routed to Atlas for sequencing'),
  ('Atlas', 'plan_updated', 'Q3 roadmap recomputed with 2 new dependencies'),
  ('Ralph', 'context_restore', 'Surfaced 3 prior decisions matching current scope'),
  ('Oracle', 'analysis_complete', 'Signal report drafted · confidence 0.82'),
  ('Sentinel', 'validation_pass', 'Outbound action cleared policy gate 7/7'),
  ('Forge', 'task_complete', 'PR #2014 merged · CI green'),
  ('Chief of Staff', 'task_complete', 'Synthesis returned to principal');
