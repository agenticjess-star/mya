import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Msg {
  id: string;
  conversation_id: string;
  from_kind: string;
  from_label: string | null;
  to_kind: string;
  to_label: string | null;
  channel: string;
  content: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  // Either filter by a single agent or by a from→to pair
  agentId?: string;
  fromAgentId?: string;
  toAgentId?: string;
  title: string;
}

export default function ConversationViewer({ open, onClose, agentId, fromAgentId, toAgentId, title }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let q = supabase.from('agent_messages').select('*').order('created_at', { ascending: false }).limit(200);
      if (fromAgentId && toAgentId) {
        q = q.or(
          `and(from_agent_id.eq.${fromAgentId},to_agent_id.eq.${toAgentId}),and(from_agent_id.eq.${toAgentId},to_agent_id.eq.${fromAgentId})`,
        );
      } else if (agentId) {
        q = q.or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`);
      }
      const { data } = await q;
      if (!cancelled && data) setMessages((data as Msg[]).reverse());
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`conv-${agentId || ''}-${fromAgentId || ''}-${toAgentId || ''}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_messages' }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [open, agentId, fromAgentId, toAgentId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center px-2 sm:px-4">
      <div className="absolute inset-0" style={{ background: 'hsl(0 0% 0% / 0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl h-[80vh] sm:h-[70vh] flex flex-col rounded-t sm:rounded border border-border"
        style={{ background: 'hsl(0 0% 5%)' }}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Conversation
            </p>
            <h3 className="text-base truncate" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {!loading && messages.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No messages yet.</p>
          )}
          {messages.map((m) => {
            const isAgent = m.from_kind === 'agent';
            return (
              <div key={m.id} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-[85%] rounded px-3 py-2 text-sm leading-relaxed border`}
                  style={{
                    background: isAgent ? 'hsl(25 20% 10%)' : 'hsl(200 15% 10%)',
                    borderColor: isAgent ? 'hsl(25 25% 22%)' : 'hsl(200 20% 22%)',
                  }}
                >
                  <p
                    className="text-[8px] tracking-[0.2em] uppercase mb-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isAgent ? 'hsl(25 40% 55%)' : 'hsl(200 35% 55%)',
                    }}
                  >
                    {m.from_label || m.from_kind} → {m.to_label || m.to_kind} · {m.channel}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-[13px]">{m.content}</p>
                </div>
                <p
                  className="text-[9px] mt-1 text-muted-foreground"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {new Date(m.created_at).toLocaleTimeString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}