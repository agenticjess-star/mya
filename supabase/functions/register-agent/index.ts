// Registers a new agent (or updates an existing one) and stores its credentials
// in the service-role-only agent_credentials table.
// Public-facing: gated by the same access pattern as the rest of the dashboard.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  id?: string;
  name: string;
  type?: string;
  description?: string;
  model?: string;
  system_instructions?: string;
  webhook_url?: string;
  webhook_secret?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  daily_message_limit?: number;
  min_seconds_between_messages?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = (await req.json()) as Body;
    if (!body.name || typeof body.name !== "string") {
      return new Response(JSON.stringify({ error: "name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookEnabled = !!(body.webhook_url && body.webhook_url.trim());
    const telegramEnabled = !!(body.telegram_bot_token && body.telegram_bot_token.trim());

    const agentRow: Record<string, unknown> = {
      name: body.name,
      type: body.type || "executor",
      description: body.description ?? null,
      model: body.model ?? null,
      system_instructions: body.system_instructions ?? "",
      webhook_url: webhookEnabled ? body.webhook_url!.trim() : null,
      telegram_chat_id: body.telegram_chat_id?.trim() || null,
      webhook_enabled: webhookEnabled,
      telegram_enabled: telegramEnabled,
      is_user_added: true,
      status: "idle",
      daily_message_limit: body.daily_message_limit ?? 3,
      min_seconds_between_messages: body.min_seconds_between_messages ?? 60,
    };

    let agentId = body.id;
    if (agentId) {
      const { error } = await supabase.from("agents").update(agentRow).eq("id", agentId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("agents").insert(agentRow).select("id").single();
      if (error) throw error;
      agentId = data.id;
    }

    // Upsert credentials (only the fields the user provided)
    const credPatch: Record<string, unknown> = { agent_id: agentId };
    if (body.webhook_secret !== undefined) credPatch.webhook_secret = body.webhook_secret || null;
    if (body.telegram_bot_token !== undefined) credPatch.telegram_bot_token = body.telegram_bot_token || null;

    if (Object.keys(credPatch).length > 1) {
      const { error: cErr } = await supabase
        .from("agent_credentials")
        .upsert(credPatch, { onConflict: "agent_id" });
      if (cErr) throw cErr;
    }

    // Initialize telegram poll state if enabled
    if (telegramEnabled) {
      await supabase.from("telegram_bot_state").upsert({ agent_id: agentId }, { onConflict: "agent_id" });
    }

    await supabase.from("activity_logs").insert({
      agent_id: agentId,
      agent_name: body.name,
      event_type: "agent_registered",
      message: `Agent ${body.name} registered (webhook:${webhookEnabled}, telegram:${telegramEnabled})`,
    });

    return new Response(JSON.stringify({ id: agentId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("register-agent error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});