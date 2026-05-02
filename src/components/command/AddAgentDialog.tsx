import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TYPES = ['executor', 'persistence', 'analyst', 'validator', 'planner', 'orchestrator'] as const;

export default function AddAgentDialog({ open, onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'executor' as (typeof TYPES)[number],
    description: '',
    system_instructions: '',
    webhook_url: '',
    webhook_secret: '',
    telegram_bot_token: '',
    daily_message_limit: 3,
    min_seconds_between_messages: 60,
  });

  if (!open) return null;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      setError('Name required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('register-agent', { body: form });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to register agent');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'hsl(0 0% 0% / 0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded border border-border"
        style={{ background: 'hsl(0 0% 5%)', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h2
            className="text-lg font-normal tracking-[-0.01em]"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Register an agent
          </h2>
          <button
            onClick={onClose}
            className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Field label="Name *">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Mya" />
          </Field>

          <Field label="Role">
            <select value={form.type} onChange={(e) => set('type', e.target.value as any)} className={inputCls}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="What this agent does"
            />
          </Field>

          <div className="pt-3 border-t border-border">
            <p className={sectionTitle}>Hyperagent webhook</p>
            <Field label="Webhook URL">
              <input value={form.webhook_url} onChange={(e) => set('webhook_url', e.target.value)} className={inputCls} placeholder="https://hyperagent.com/api/webhooks/…" />
            </Field>
            <Field label="Webhook secret">
              <input
                type="password"
                value={form.webhook_secret}
                onChange={(e) => set('webhook_secret', e.target.value)}
                className={inputCls}
                placeholder="Sent as X-Hyperagent-Webhook-Secret"
              />
            </Field>
          </div>

          <div className="pt-3 border-t border-border">
            <p className={sectionTitle}>Telegram (optional)</p>
            <Field label="Bot token">
              <input
                type="password"
                value={form.telegram_bot_token}
                onChange={(e) => set('telegram_bot_token', e.target.value)}
                className={inputCls}
                placeholder="123456:ABC-…"
              />
            </Field>
            <p className="text-[10px] text-muted-foreground -mt-2 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              DM the bot on Telegram → it replies via this agent's webhook. Mirrored to UI.
            </p>
          </div>

          <div className="pt-3 border-t border-border">
            <p className={sectionTitle}>Rate limit</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Daily message cap">
                <input
                  type="number" min={1} max={1000}
                  value={form.daily_message_limit}
                  onChange={(e) => set('daily_message_limit', parseInt(e.target.value || '3'))}
                  className={inputCls}
                />
              </Field>
              <Field label="Min seconds between">
                <input
                  type="number" min={0} max={86400}
                  value={form.min_seconds_between_messages}
                  onChange={(e) => set('min_seconds_between_messages', parseInt(e.target.value || '60'))}
                  className={inputCls}
                />
              </Field>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Default: 3/day, 60s apart. Prevents agent loops.
            </p>
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded border" style={{ borderColor: 'hsl(0 50% 35%)', color: 'hsl(0 60% 65%)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={submitting} className={btnPrimary}>
            {submitting ? 'Registering…' : 'Register agent'}
          </button>
        </div>
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

const inputCls =
  "w-full bg-transparent border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors";
const sectionTitle =
  "text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-3";
const btnGhost =
  "px-4 py-2 text-[10px] tracking-[0.2em] uppercase border border-border rounded text-muted-foreground hover:text-foreground transition-colors";
const btnPrimary =
  "px-5 py-2 text-[10px] tracking-[0.2em] uppercase border rounded transition-all disabled:opacity-30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label
        className="block text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}