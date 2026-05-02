
-- Extend agents
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS daily_message_limit integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS min_seconds_between_messages integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS is_user_added boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_enabled boolean NOT NULL DEFAULT false;

-- Allow inserts and deletes on agents (the dashboard is gated by access code 7787)
DO $$ BEGIN
  CREATE POLICY "Allow public insert on agents" ON public.agents FOR INSERT TO public WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete on agents" ON public.agents FOR DELETE TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service-role-only credentials store
CREATE TABLE IF NOT EXISTS public.agent_credentials (
  agent_id uuid PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
  webhook_secret text,
  telegram_bot_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_credentials ENABLE ROW LEVEL SECURITY;
-- no policies = service role only

-- Conversation mirror
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_kind text NOT NULL CHECK (from_kind IN ('user','agent','system','telegram','orchestrator')),
  from_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  from_label text,
  to_kind text NOT NULL CHECK (to_kind IN ('user','agent','telegram','broadcast','orchestrator')),
  to_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  to_label text,
  channel text NOT NULL CHECK (channel IN ('telegram','webhook','orchestrator','ui','system')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  parent_message_id uuid REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_messages_conv ON public.agent_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_messages_to_agent ON public.agent_messages(to_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_from_agent ON public.agent_messages(from_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_pair ON public.agent_messages(from_agent_id, to_agent_id, created_at DESC);
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow public read on agent_messages" ON public.agent_messages FOR SELECT TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert on agent_messages" ON public.agent_messages FOR INSERT TO public WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Outbound queue
CREATE TABLE IF NOT EXISTS public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  conversation_id uuid,
  parent_message_id uuid REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  source text NOT NULL,        -- telegram, ui, orchestrator, agent, scheduler
  reply_channel text NOT NULL DEFAULT 'none',  -- telegram, ui, none
  reply_chat_id text,
  from_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  payload text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','sent','failed','rate_limited','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_queue_agent_status ON public.message_queue(agent_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_queue_pending ON public.message_queue(status, scheduled_for) WHERE status IN ('pending','rate_limited');
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow public read on message_queue" ON public.message_queue FOR SELECT TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert on message_queue" ON public.message_queue FOR INSERT TO public WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public update on message_queue" ON public.message_queue FOR UPDATE TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete on message_queue" ON public.message_queue FOR DELETE TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Telegram polling offsets (per agent bot)
CREATE TABLE IF NOT EXISTS public.telegram_bot_state (
  agent_id uuid PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
  update_offset bigint NOT NULL DEFAULT 0,
  last_polled_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;
-- service role only

-- updated_at trigger fn (reuse if exists)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_message_queue_touch ON public.message_queue;
CREATE TRIGGER trg_message_queue_touch
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_agent_credentials_touch ON public.agent_credentials;
CREATE TRIGGER trg_agent_credentials_touch
  BEFORE UPDATE ON public.agent_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_queue;
