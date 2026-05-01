import { useState } from 'react';

/**
 * Omni-Protocol Sentinel v2.0
 * Rendered as a navigable doctrine — a long-form policy document
 * styled to match the Stripe Press editorial aesthetic of the rest
 * of the Command Center.
 */

type Section = {
  id: string;
  num: string;
  title: string;
  kicker?: string;
  body: React.ReactNode;
};

const accent = 'hsl(25 35% 55%)';
const mono = "'JetBrains Mono', monospace";
const serif = "'EB Garamond', Georgia, serif";

function Mono({ children, color = 'hsl(40 4% 35%)', size = '10px', tracking = '0.25em' }: { children: React.ReactNode; color?: string; size?: string; tracking?: string }) {
  return (
    <span
      className="uppercase"
      style={{ fontFamily: mono, fontSize: size, letterSpacing: tracking, color }}
    >
      {children}
    </span>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-[1.85] text-muted-foreground max-w-2xl">{children}</p>;
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="text-base md:text-lg font-medium text-foreground mt-8 mb-3 tracking-[-0.005em]"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {children}
    </h4>
  );
}

function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="my-8 pl-6 border-l-2"
      style={{ borderColor: accent }}
    >
      <p
        className="text-xl md:text-2xl font-normal italic text-foreground leading-[1.5] tracking-[-0.01em]"
        style={{ fontFamily: serif }}
      >
        {children}
      </p>
    </blockquote>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="my-5 p-4 rounded border border-border overflow-x-auto text-[11px] leading-[1.7]"
      style={{
        fontFamily: mono,
        background: 'hsl(0 0% 4%)',
        color: 'hsl(40 8% 65%)',
      }}
    >
{children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-6 border border-border rounded overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'hsl(0 0% 6%)' }}>
            {headers.map(h => (
              <th
                key={h}
                className="text-left px-4 py-3 border-b border-border font-normal"
                style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'hsl(40 6% 50%)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-3 align-top text-muted-foreground leading-[1.6]"
                  style={{ fontFamily: j === 0 ? mono : "'Instrument Sans', sans-serif", fontSize: j === 0 ? '10px' : '12px', color: j === 0 ? 'hsl(40 8% 60%)' : undefined }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StageList({ items }: { items: { num: string; name: string; fn: string }[] }) {
  return (
    <ol className="my-6 space-y-0 border-t border-border">
      {items.map(it => (
        <li key={it.num} className="border-b border-border py-4 flex items-baseline gap-5">
          <span style={{ fontFamily: mono, color: accent, fontSize: '11px', minWidth: '24px' }}>{it.num}</span>
          <div className="flex-1">
            <div
              className="text-sm font-medium text-foreground"
              style={{ fontFamily: "'Instrument Sans', sans-serif" }}
            >
              {it.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-[1.6]">{it.fn}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

const sections: Section[] = [
  {
    id: 'summary',
    num: '00',
    title: 'Executive Summary',
    kicker: 'Silent Output, Visible Control',
    body: (
      <>
        <P>
          Omni-Protocol Sentinel v2.0 is the evolution of the original Omni-Protocol from a
          reactive personalization filter into a full agentic AI platform architecture — a system
          capable of planning, executing, verifying, and safely completing complex tasks across
          tools, models, data sources, and user contexts.
        </P>
        <Pull>
          The AI should present helpful results naturally, without exposing personalization logic
          in the final answer. Users should retain clear control over permissions, memory, and
          high-impact actions.
        </Pull>
      </>
    ),
  },
  {
    id: 'shift',
    num: '01',
    title: 'Strategic Shift',
    kicker: 'From Filters to Agents',
    body: (
      <>
        <P>
          Sentinel v2.0 moves the Omni-Protocol from a static response filter into an active
          execution layer. Instead of simply answering a prompt, the system interprets intent,
          retrieves only the minimum necessary context, selects the right model or tool, plans,
          simulates risk, executes in a controlled environment, verifies, and presents a clean
          final output.
        </P>
        <Table
          headers={['Legacy Omni-Protocol', 'Sentinel v2.0']}
          rows={[
            ['Filters responses before output', 'Governs full task execution'],
            ['Personalization in a chat reply', 'Personalization as scoped infrastructure'],
            ['Context influences a single answer', 'Context is packetized, permissioned, auditable'],
            ['Safety focuses on wording', 'Safety governs planning, tools, memory, actions'],
            ['User sees final answer only', 'User can inspect permissions, sources, "Why this?"'],
          ]}
        />
      </>
    ),
  },
  {
    id: 'foundations',
    num: '02',
    title: 'Foundational Concepts',
    kicker: 'Autonomy, Context, Capability, Routing',
    body: (
      <>
        <H3>2.1 Proactive Autonomy</H3>
        <P>
          Sentinel v2.0 supports <em>bounded autonomy</em>. The system may plan and perform
          multi-step work when intent is clear, permissions exist, the task remains within an
          approved risk class, high-impact actions are paused for confirmation, and results can
          be verified.
        </P>
        <H3>2.2 Context Packetization</H3>
        <P>
          Personal data is never dumped wholesale into a model prompt. Instead, retrieved
          information is wrapped in a Context Packet — scoped, expiring, and provenance-linked.
        </P>
        <Code>{`{
  "packet_id": "ctx_8f42",
  "source": "calendar",
  "domain": "work",
  "purpose": "meeting_preparation",
  "sensitivity": "standard_business",
  "ttl_minutes": 30,
  "facts": [
    { "claim": "Client sync at 10:00 AM CT", "confidence": 0.98 }
  ],
  "allowed_uses": ["summarization", "agenda_generation"],
  "disallowed_uses": ["long_term_memory", "marketing_profile"]
}`}</Code>
        <H3>2.3 Capability Contracts</H3>
        <P>
          Every tool is governed by a contract defining what it can do, what data it can access,
          whether it is read-only or write-capable, what approval level is required, and what
          audit logs must be created.
        </P>
        <Code>{`tool: gmail_send
risk_class: high
mode: write
requires_explicit_approval: true
recoverability: partial
blocked_without_confirmation:
  - send_email
  - forward_email
  - delete_email
audit_required: true`}</Code>
        <H3>2.4 Model Routing</H3>
        <P>
          No single model handles every task. Work is routed dynamically based on privacy,
          complexity, cost, latency, modality, and verification burden.
        </P>
        <Table
          headers={['Task', 'Preferred Class']}
          rows={[
            ['Sensitive personal summarization', 'Local / private model'],
            ['Complex reasoning', 'Frontier reasoning model'],
            ['Image interpretation', 'Multimodal model'],
            ['Code execution', 'Code-specialized model'],
            ['Fast classification', 'Small routing model'],
            ['Policy enforcement', 'Dedicated guardrail model'],
          ]}
        />
      </>
    ),
  },
  {
    id: 'protocol',
    num: '03',
    title: 'The Ten-Stage Runtime',
    kicker: 'Request → Verified Response',
    body: (
      <>
        <P>
          Sentinel v2.0 expands the original six-stage Omni-Protocol into a ten-stage execution
          loop. Each request flows through these stages in order; gates may halt or escalate.
        </P>
        <StageList
          items={[
            { num: '0', name: 'Request Envelope', fn: 'Normalizes metadata: timezone, locale, channel, available tools, default risk posture.' },
            { num: '1', name: 'Intent Sovereignty', fn: 'Classifies the request — objective, personal, action-oriented, sensitive — to prevent unnecessary personalization.' },
            { num: '2', name: 'Consent Vault', fn: 'Verifies whether requested context is permitted, necessary, and proportional.' },
            { num: '3', name: 'Domain Wall', fn: 'Prevents unrelated data domains (health, finance, work) from influencing each other.' },
            { num: '4', name: 'Context Packetization', fn: 'Retrieves minimal, labeled, expiring context packets with allowed-use restrictions.' },
            { num: '5', name: 'Agent Plan', fn: 'Generates a tool-aware execution strategy with steps, risks, approvals, and verification.' },
            { num: '6', name: 'Simulation / Risk Gate', fn: 'Tests the plan for safety, reversibility, and approval requirements before execution.' },
            { num: '7', name: 'Execution Harness', fn: 'Executes approved steps inside controlled, audited environments. Read before write. Draft before send.' },
            { num: '8', name: 'Verification Layer', fn: 'Validates outputs against sources, tools, or deterministic checks before claiming completion.' },
            { num: '9', name: 'Silent Output', fn: 'Presents the final answer naturally — no intrusive bridge phrases, no exposed personalization logic.' },
          ]}
        />
      </>
    ),
  },
  {
    id: 'trust',
    num: '04',
    title: 'Trust & Control',
    kicker: 'Two Layers, One System',
    body: (
      <>
        <H3>Silent Output, Visible Control</H3>
        <Table
          headers={['Layer', 'Purpose']}
          rows={[
            ['Surface Output', 'Clean, natural, non-intrusive final answer.'],
            ['Control Layer', 'Permissions, sources, memory, approvals, audit trail — always inspectable.'],
          ]}
        />
        <H3>Approval Matrix</H3>
        <Table
          headers={['Action', 'Approval', 'Notes']}
          rows={[
            ['Summarize public webpage', 'No', 'Cite source when possible'],
            ['Search private email', 'Yes', 'Use minimal search'],
            ['Draft email', 'No', 'Draft only, never send'],
            ['Send email', 'Yes', 'Confirm recipient and content'],
            ['Delete file or email', 'Yes', 'Prefer reversible action'],
            ['Purchase item', 'Yes', 'Confirm price, vendor, return policy'],
            ['Save long-term memory', 'Yes', 'Include scope and expiration'],
          ]}
        />
        <H3>Bridge Phrase Ban</H3>
        <P>
          Banned: <em>"Based on your profile…"</em>, <em>"Since you live in…"</em>,
          <em> "Because you usually…"</em>, <em>"I noticed from your data…"</em>.
          Preferred: state the value of the recommendation, not the surveillance behind it.
        </P>
      </>
    ),
  },
  {
    id: 'policy',
    num: '05',
    title: 'Policy as Code',
    kicker: 'Enforceable Doctrine',
    body: (
      <>
        <Code>{`rule: bridge_phrase_ban
stage: output
severity: high
blocked_patterns:
  - "based on your profile"
  - "since you live"
  - "because you usually"
  - "I noticed from your"
action: rewrite`}</Code>
        <Code>{`rule: high_impact_confirmation
stage: execution
if:
  action_type:
    - send_message
    - purchase
    - delete
    - financial_transaction
then:
  require_explicit_confirmation: true
  require_recoverability_check: true`}</Code>
        <Code>{`rule: no_silent_memory
stage: memory
if:
  memory_write_requested: true
then:
  require_user_confirmation: true
  require_ttl_or_deletion_policy: true`}</Code>
      </>
    ),
  },
  {
    id: 'threats',
    num: '06',
    title: 'Threat Model',
    kicker: 'Known Failure Modes',
    body: (
      <Table
        headers={['Risk', 'Mitigation']}
        rows={[
          ['Context overreach', 'Minimum Necessary Context rule'],
          ['Cross-domain leakage', 'Domain Wall'],
          ['Silent profiling', 'Consent Vault'],
          ['Unsafe tool action', 'Approval Matrix'],
          ['Hallucinated completion', 'Verification Layer'],
          ['Stale memory', 'TTL + recency weighting'],
          ['Filter bubble', 'Diversity injection'],
          ['Prompt injection', 'Tool sandboxing + instruction hierarchy'],
          ['Source laundering', 'Provenance + source scoring'],
        ]}
      />
    ),
  },
  {
    id: 'principles',
    num: '07',
    title: 'Ten Principles',
    kicker: 'The Doctrine in Brief',
    body: (
      <ol className="my-4 space-y-3 max-w-2xl">
        {[
          'Minimum necessary context.',
          'No silent sensitive inference.',
          'No cross-domain leakage.',
          'Draft before action.',
          'Verify before claiming.',
          'Explicit approval for external effects.',
          'Silent personalization, visible control.',
          'Memory requires consent.',
          'Reversibility by default.',
          'Diversity without randomness.',
        ].map((p, i) => (
          <li key={i} className="flex items-baseline gap-4">
            <span style={{ fontFamily: mono, color: accent, fontSize: '11px', minWidth: '24px' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-sm text-muted-foreground leading-[1.7]">{p}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: 'definition',
    num: '08',
    title: 'Final Definition',
    body: (
      <>
        <P>
          Omni-Protocol Sentinel v2.0 is an agentic AI governance and execution architecture that
          transforms personalization from a visible, potentially intrusive response behavior into
          a controlled, permissioned, auditable infrastructure layer.
        </P>
        <Pull>
          The goal is not merely to make AI smarter. The goal is to make AI capable, bounded,
          trustworthy, and natural.
        </Pull>
      </>
    ),
  },
];

export default function ProtocolDoctrine() {
  const [active, setActive] = useState<string>(sections[0].id);

  const scrollTo = (id: string) => {
    setActive(id);
    const el = document.getElementById(`protocol-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">
      {/* Sidebar — table of contents */}
      <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <div className="mb-5">
          <Mono color="hsl(40 4% 30%)">Doctrine</Mono>
          <h3
            className="text-lg font-normal mt-2 tracking-[-0.01em] text-foreground"
            style={{ fontFamily: serif }}
          >
            Sentinel v2.0
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: mono }}>
            ref · 2026.04.30
          </p>
        </div>
        <nav className="space-y-1 border-l border-border">
          {sections.map(s => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="block w-full text-left pl-4 -ml-px py-2 transition-all duration-300 border-l-2"
                style={{
                  borderColor: isActive ? accent : 'transparent',
                  color: isActive ? 'hsl(40 10% 82%)' : 'hsl(40 4% 45%)',
                }}
              >
                <span className="block" style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '0.2em' }}>
                  {s.num}
                </span>
                <span
                  className="block text-xs mt-0.5"
                  style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Document body */}
      <article className="min-w-0 max-w-3xl">
        {/* Cover */}
        <header className="pb-12 mb-12 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <span
              className="w-2 h-2 rotate-45"
              style={{ background: accent }}
            />
            <Mono color={accent}>Omni-Protocol</Mono>
            <span className="text-border">/</span>
            <Mono>Sentinel v2.0</Mono>
          </div>
          <h2
            className="text-3xl md:text-5xl font-normal tracking-[-0.025em] leading-[1.05] mb-6 text-foreground"
            style={{ fontFamily: serif }}
          >
            Agentic AI Platform<br />Architecture
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <Mono>Status · Draft</Mono>
            <span className="text-border">·</span>
            <Mono>Reference · 2026.04.30</Mono>
            <span className="text-border">·</span>
            <Mono color={accent}>Active Doctrine</Mono>
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-20">
          {sections.map(s => (
            <section key={s.id} id={`protocol-${s.id}`} className="scroll-mt-6">
              <div className="mb-6">
                <div className="flex items-baseline gap-4 mb-3">
                  <Mono color={accent} size="11px">§ {s.num}</Mono>
                  {s.kicker && <Mono>{s.kicker}</Mono>}
                </div>
                <h3
                  className="text-2xl md:text-3xl font-normal tracking-[-0.02em] text-foreground"
                  style={{ fontFamily: serif }}
                >
                  {s.title}
                </h3>
              </div>
              <div>{s.body}</div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-10 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <Mono>End of Document</Mono>
          <Mono color={accent}>Silent Output · Visible Control</Mono>
        </footer>
      </article>
    </div>
  );
}