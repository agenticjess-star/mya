// Enqueues a message for delivery to an agent. Honors per-agent rate limits.
// Called by: UI (user → agent), Telegram poller (telegram → agent), orchestrator (chief → agent).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  agent_id: string;
  payload: string;
  source?: "ui" | "telegram" | "orchestrator" | "agent" | "scheduler";
  reply_channel?: "telegram" | "ui" | "none";
  reply_chat_id?: string;
  conversation_id?: string;
  parent_message_id?: string;
  from_agent_id?: string;
  bypass_daily_limit?: boolean; // orchestrator may bypass daily cap (still honors min-delay)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = (await req.json()) as Body;

    if (!body.agent_id || !body.payload) {
      return new Response(JSON.stringify({ error: "agent_id and payload required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("id, name, daily_message_limit, min_seconds_between_messages")
      .eq("id", body.agent_id)
      .single();
    if (!agent) {
      return new Response(JSON.stringify({ error: "agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute next eligible send time
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setUTCHours(0, 0, 0, 0);

    const { count: sentToday } = await supabase
      .from("message_queue")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", body.agent_id)
      .eq("status", "sent")
      .gte("updated_at", startOfDay.toISOString());

    if (!body.bypass_daily_limit && (sentToday ?? 0) >= agent.daily_message_limit) {
      // queue for tomorrow
      const tomorrow = new Date(startOfDay); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const { data: q } = await supabase.from("message_queue").insert({
        agent_id: body.agent_id,
        payload: body.payload,
        source: body.source || "ui",
        reply_channel: body.reply_channel || "none",
        reply_chat_id: body.reply_chat_id || null,
        conversation_id: body.conversation_id || null,
        parent_message_id: body.parent_message_id || null,
        from_agent_id: body.from_agent_id || null,
        status: "rate_limited",
        scheduled_for: tomorrow.toISOString(),
      }).select("id").single();
      return new Response(JSON.stringify({ queued: true, id: q?.id, status: "rate_limited", scheduled_for: tomorrow.toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Min-delay since last sent
    const { data: lastSent } = await supabase
      .from("message_queue")
      .select("updated_at")
      .eq("agent_id", body.agent_id)
      .eq("status", "sent")
      .order("updated_at", { ascending: false })
      .limit(1).maybeSingle();

    let scheduledFor = now;
    if (lastSent?.updated_at) {
      const earliest = new Date(new Date(lastSent.updated_at).getTime() + agent.min_seconds_between_messages * 1000);
      if (earliest > now) scheduledFor = earliest;
    }

    const { data: q, error } = await supabase.from("message_queue").insert({
      agent_id: body.agent_id,
      payload: body.payload,
      source: body.source || "ui",
      reply_channel: body.reply_channel || "none",
      reply_chat_id: body.reply_chat_id || null,
      conversation_id: body.conversation_id || null,
      parent_message_id: body.parent_message_id || null,
      from_agent_id: body.from_agent_id || null,
      status: "pending",
      scheduled_for: scheduledFor.toISOString(),
    }).select("id").single();
    if (error) throw error;

    return new Response(JSON.stringify({ queued: true, id: q.id, status: "pending", scheduled_for: scheduledFor.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enqueue-message error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});