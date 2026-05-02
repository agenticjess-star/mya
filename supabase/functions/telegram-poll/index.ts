// Polls each Telegram-enabled agent's bot for new DMs and enqueues them as messages.
// Designed to be hit every ~60s (manually or via cron).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function pollAgent(supabase: ReturnType<typeof createClient>, agent: any, token: string) {
  const { data: state } = await supabase
    .from("telegram_bot_state").select("update_offset").eq("agent_id", agent.id).maybeSingle();
  const offset = state?.update_offset || 0;

  const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offset, timeout: 0, allowed_updates: ["message"] }),
  });
  const j = await r.json();
  if (!j.ok) {
    console.error(`telegram getUpdates failed for ${agent.name}`, j);
    return 0;
  }
  const updates = j.result || [];
  if (updates.length === 0) return 0;

  let count = 0;
  for (const u of updates) {
    const msg = u.message;
    if (!msg || !msg.text) continue;
    // Only process direct messages (private chat) for one-on-one
    if (msg.chat?.type !== "private") continue;

    // Enqueue
    await supabase.functions.invoke("enqueue-message", {
      body: {
        agent_id: agent.id,
        payload: msg.text,
        source: "telegram",
        reply_channel: "telegram",
        reply_chat_id: String(msg.chat.id),
      },
    }).catch(async () => {
      // fallback: insert directly
      await supabase.from("message_queue").insert({
        agent_id: agent.id, payload: msg.text, source: "telegram",
        reply_channel: "telegram", reply_chat_id: String(msg.chat.id),
        status: "pending",
      });
    });
    count++;
  }

  const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
  await supabase.from("telegram_bot_state").upsert({
    agent_id: agent.id, update_offset: newOffset, last_polled_at: new Date().toISOString(),
  }, { onConflict: "agent_id" });

  return count;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: agents } = await supabase
      .from("agents")
      .select("id, name, telegram_enabled")
      .eq("telegram_enabled", true);

    if (!agents || agents.length === 0) {
      return new Response(JSON.stringify({ polled: 0, messages: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let total = 0;
    for (const a of agents) {
      const { data: cred } = await supabase
        .from("agent_credentials").select("telegram_bot_token").eq("agent_id", a.id).maybeSingle();
      if (!cred?.telegram_bot_token) continue;
      total += await pollAgent(supabase, a, cred.telegram_bot_token);
    }

    return new Response(JSON.stringify({ polled: agents.length, messages: total }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telegram-poll error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});