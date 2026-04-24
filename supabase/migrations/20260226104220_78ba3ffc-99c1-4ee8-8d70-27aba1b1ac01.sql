ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS system_instructions text DEFAULT '';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS reports_to uuid DEFAULT NULL;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS connections text[] DEFAULT '{}';

UPDATE public.agents SET system_instructions = CASE 
  WHEN type = 'orchestrator' THEN 'You are the central orchestrator. Route tasks to appropriate agents, monitor execution flow, and ensure completion loops close. Maintain sovereign oversight of all agent activities.'
  WHEN type = 'persistence' THEN 'You are the persistence layer guardian. Ensure all state transitions are captured, maintain data integrity across sessions, and provide reliable recall for all agents.'
  WHEN type = 'analyst' THEN 'You are the analytical engine. Process incoming data streams, identify patterns, surface insights, and provide decision-support intelligence to the orchestrator.'
  WHEN type = 'executor' THEN 'You are the execution engine. Take validated plans and execute them with precision. Report progress, handle errors gracefully, and confirm completion.'
  WHEN type = 'validator' THEN 'You are the validation layer. Verify outputs against specifications, run quality checks, and ensure all deliverables meet the sovereign standard.'
  WHEN type = 'planner' THEN 'You are the strategic planner. Break complex objectives into actionable plans, sequence dependencies, and optimize resource allocation across the fleet.'
  ELSE 'Agent system instructions pending configuration.'
END
WHERE system_instructions = '' OR system_instructions IS NULL;