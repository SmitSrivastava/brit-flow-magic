import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askBritGPT, generateConceptImage } from "@/lib/vertex-ai.functions";

type Followup = { label: string; icon?: string; action?: string; topic?: string };

type Message =
  | { role: "user"; text: string }
  | { role: "model"; text: string; followups?: Followup[]; image?: string; concept?: ConceptCard };

type ConceptCard = {
  image_prompt?: string;
  product_name?: string;
  brand_route?: string;
  format?: string;
  flavour?: string;
  pack?: string;
  occasion?: string;
};

type Signal = { name: string; spicy?: boolean };

const REGIONAL: Signal[] = [
  { name: "Kaju Katli" },
  { name: "Ras Malai" },
  { name: "Nolen Gur" },
  { name: "Schezwan", spicy: true },
];
const GLOBAL: Signal[] = [
  { name: "Biscoff" },
  { name: "Tiramisu" },
  { name: "Yuzu" },
  { name: "Matcha" },
];

const TAG_PILLS = ["📊 Flavour table", "🗺️ Regional signals", "👥 FPD volumes", "🏭 Full portfolio"];

const flavourQuestion = (f: string) =>
  `Explore **${f}** for Britannia — what is the best brand fit, opportunity mapping, and concept direction? Include FPD audience sizing.`;

// Strip any stray fenced code block whose payload starts with [ or { (leftover JSON
// the model occasionally emits without the `followups`/`concept` tag).
function cleanText(t: string): string {
  return t
    .replace(/```[a-z]*\s*([\[{][\s\S]*?)```/gi, (_m, body: string) => {
      const trimmed = body.trim();
      return trimmed.startsWith("[") || trimmed.startsWith("{") ? "" : _m;
    })
    .trim();
}

export function BritGPTChat({ onBack }: { onBack: () => void }) {
  const ask = useServerFn(askBritGPT);
  const genImage = useServerFn(generateConceptImage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hideSpicy, setHideSpicy] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const regional = useMemo(() => REGIONAL.filter((s) => !hideSpicy || !s.spicy), [hideSpicy]);
  const global = useMemo(() => GLOBAL.filter((s) => !hideSpicy || !s.spicy), [hideSpicy]);

  async function sendQuestion(question: string) {
    if (!question.trim() || loading) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const r = await ask({ data: { question, history } });
      if (r.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: cleanText(r.text), followups: r.followups, concept: r.concept },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "model", text: `**Error:** ${r.message}` }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "model", text: `**Error:** ${String(e)}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function createConceptCard(topic: string) {
    if (loading) return;
    const question = `Create a complete **Concept Card** for **${topic}** as a Britannia NPD. Structure with these sections (markdown headings + tables):
1. ## 🍪 Concept Name & Tagline
2. ## 🏭 Brand Route & Portfolio Cross-Map  (table)
3. ## 🎨 Flavour, Format & Pack
4. ## 👥 Target FPD Cohort  (cite actual base-brand volumes)
5. ## 📣 Communication Angle & Claim
6. ## 🎬 Influencer + Media Plan
7. ## ✅ Why It Wins
8. ## 🧪 Validation Plan

Then output the mandatory \`\`\`concept ...\`\`\` and \`\`\`followups ...\`\`\` JSON blocks. Do NOT output any other raw JSON in the body.`;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: `🎨 Create Concept Card — ${topic}` }]);
    setLoading(true);
    try {
      const textRes = await ask({ data: { question, history } });
      const imagePrompt =
        textRes.ok && textRes.concept?.image_prompt
          ? textRes.concept.image_prompt
          : `Britannia branded product packaging concept for "${topic}". Photoreal product hero shot of the actual packaged biscuit/cookie/wafer pack on a cream background, studio lighting, 1:1 square.`;
      const imgRes = await genImage({ data: { prompt: imagePrompt } });
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: textRes.ok ? cleanText(textRes.text) : `**Error:** ${textRes.message}`,
          followups: textRes.ok ? textRes.followups : undefined,
          concept: textRes.ok ? textRes.concept : undefined,
          image: imgRes.ok ? imgRes.dataUrl : undefined,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleFollowup(f: Followup) {
    if (f.action === "concept_card" && f.topic) createConceptCard(f.topic);
    else sendQuestion(f.label);
  }

  const lastFollowups = [...messages].reverse().find((m) => m.role === "model")?.followups;
  const chatStarted = messages.length > 0;

  return (
    <div className="space-y-4">
      {/* Breadcrumb / back */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="opacity-70 hover:opacity-100 hover:underline"
            style={{ color: "var(--britannia-red-deep)" }}
          >
            ● Research & Discovery
          </button>
          <span className="opacity-50">›</span>
          <span
            className="font-semibold border-b-2 pb-0.5"
            style={{ color: "var(--britannia-red)", borderColor: "var(--britannia-red)" }}
          >
            ● BritGPT FPD Strategy
          </span>
        </div>
        <span
          className="text-[10px] tracking-[0.25em] font-bold px-2 py-1 rounded-full"
          style={{
            background: "color-mix(in oklch, var(--britannia-red) 12%, transparent)",
            color: "var(--britannia-red-deep)",
          }}
        >
          BRITGPT
        </span>
      </div>

      {/* Consuma data loaded card */}
      <div
        className="rounded-2xl border p-4 flex items-start gap-3"
        style={{
          background: "white",
          borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)",
        }}
      >
        <div
          className="rounded-lg p-2 text-lg"
          style={{ background: "color-mix(in oklch, var(--britannia-red) 10%, transparent)" }}
        >
          📋
        </div>
        <div className="flex-1">
          <div
            className="text-[11px] uppercase tracking-[0.22em] font-bold"
            style={{ color: "var(--britannia-red)" }}
          >
            Consuma Data Loaded
          </div>
          <div className="text-sm mt-0.5">
            Flavour analysis (100+ signals) + FPD brand volumes + cross-state insights preloaded.
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {TAG_PILLS.map((p) => (
              <span
                key={p}
                className="text-xs px-3 py-1 rounded-full border"
                style={{
                  background: "var(--britannia-cream)",
                  borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)",
                  color: "var(--britannia-red-deep)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* KEY FLAVOUR SIGNALS — always shown, compact after chat starts */}
      <div
        className="rounded-2xl border bg-white overflow-hidden"
        style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "var(--britannia-cream)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] uppercase tracking-[0.22em] font-bold"
              style={{ color: "var(--britannia-red-deep)" }}
            >
              Key Flavour Signals
            </span>
            {!chatStarted && (
              <span
                className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "color-mix(in oklch, var(--britannia-red) 15%, transparent)",
                  color: "var(--britannia-red)",
                }}
              >
                Click to explore
              </span>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <span style={{ color: "var(--britannia-red-deep)" }}>Hide spicy / masala</span>
            <input
              type="checkbox"
              checked={hideSpicy}
              onChange={(e) => setHideSpicy(e.target.checked)}
              className="sr-only peer"
            />
            <span
              className="relative w-9 h-5 rounded-full transition"
              style={{
                background: hideSpicy
                  ? "var(--britannia-red)"
                  : "color-mix(in oklch, var(--britannia-red) 18%, white)",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition"
                style={{ transform: hideSpicy ? "translateX(16px)" : "translateX(0)" }}
              />
            </span>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x"
          style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 12%, transparent)" }}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
              🇮🇳 Regional <span className="text-[10px] opacity-60">South &amp; North India</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {regional.map((s) => (
                <button
                  key={s.name}
                  disabled={loading}
                  onClick={() => sendQuestion(flavourQuestion(s.name))}
                  className="text-sm px-3 py-1.5 rounded-full border font-medium transition hover:-translate-y-0.5 disabled:opacity-50"
                  style={{
                    background: "color-mix(in oklch, var(--britannia-red) 10%, white)",
                    borderColor: "color-mix(in oklch, var(--britannia-red) 25%, transparent)",
                    color: "var(--britannia-red-deep)",
                  }}
                >
                  ★ {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
              🌐 Global <span className="text-[10px] opacity-60">Urban India</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {global.map((s) => (
                <button
                  key={s.name}
                  disabled={loading}
                  onClick={() => sendQuestion(flavourQuestion(s.name))}
                  className="text-sm px-3 py-1.5 rounded-full border font-medium transition hover:-translate-y-0.5 disabled:opacity-50"
                  style={{
                    background: "color-mix(in oklch, oklch(0.62 0.18 250) 8%, white)",
                    borderColor: "color-mix(in oklch, oklch(0.62 0.18 250) 30%, transparent)",
                    color: "oklch(0.35 0.15 250)",
                  }}
                >
                  🌐 {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero band */}
      {!chatStarted && (
        <div
          className="rounded-2xl p-5 flex gap-4 items-start text-white"
          style={{
            background: "linear-gradient(135deg, var(--britannia-red-deep), var(--britannia-red))",
            boxShadow: "var(--shadow-britannia)",
          }}
        >
          <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-xl">
            B
          </div>
          <div>
            <h3 className="text-2xl font-extrabold">
              What would you like to <em className="font-serif italic">do next?</em>
            </h3>
            <p className="text-sm opacity-90 mt-0.5">
              Pick a flavour signal above, or ask BritGPT anything below.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {chatStarted && (
        <div
          ref={scrollRef}
          className="rounded-2xl border bg-white p-5 space-y-5 overflow-y-auto"
          style={{
            maxHeight: "60vh",
            borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)",
          }}
        >
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
              {m.role === "user" ? (
                <div
                  className="rounded-2xl px-4 py-2.5 max-w-[80%] text-sm font-medium"
                  style={{ background: "var(--britannia-red)", color: "white" }}
                >
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              ) : (
                <div className="max-w-[95%] w-full space-y-3">
                  {m.concept && (
                    <ConceptCardView card={m.concept} image={m.image} />
                  )}
                  {!m.concept && m.image && (
                    <img
                      src={m.image}
                      alt="Generated concept"
                      className="rounded-xl border w-72 h-72 object-cover"
                      style={{
                        borderColor: "color-mix(in oklch, var(--britannia-red) 25%, transparent)",
                      }}
                    />
                  )}
                  <div
                    className="prose prose-sm max-w-none
                      prose-headings:font-extrabold prose-headings:text-[var(--britannia-red-deep)]
                      prose-h2:mt-5 prose-h2:mb-2 prose-h2:text-lg
                      prose-strong:text-[var(--britannia-red-deep)]
                      prose-a:text-[var(--britannia-red)]
                      prose-table:rounded-xl prose-table:overflow-hidden prose-table:border
                      prose-th:bg-[var(--britannia-cream)] prose-th:text-[var(--britannia-red-deep)]
                      prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
                      prose-tr:border-t prose-tr:border-[color-mix(in_oklch,var(--britannia-red)_12%,transparent)]"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--britannia-red-deep)" }}
            >
              <span className="inline-flex gap-1">
                <span className="size-1.5 rounded-full bg-current animate-bounce" />
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0.15s]" />
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0.3s]" />
              </span>
              BritGPT is thinking…
            </div>
          )}
        </div>
      )}

      {/* Dynamic followups from Gemini (only after first reply) */}
      {lastFollowups && lastFollowups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lastFollowups.map((c, i) => (
            <button
              key={i}
              onClick={() => handleFollowup(c)}
              disabled={loading}
              className="text-sm px-4 py-2 rounded-full border transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                background:
                  c.action === "concept_card"
                    ? "color-mix(in oklch, oklch(0.7 0.18 300) 15%, white)"
                    : "color-mix(in oklch, var(--britannia-red) 8%, white)",
                borderColor:
                  c.action === "concept_card"
                    ? "color-mix(in oklch, oklch(0.7 0.18 300) 35%, transparent)"
                    : "color-mix(in oklch, var(--britannia-red) 25%, transparent)",
                color: c.action === "concept_card" ? "oklch(0.4 0.2 300)" : "var(--britannia-red-deep)",
              }}
            >
              {c.icon ? `${c.icon} ` : ""}
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion(input);
        }}
        className="rounded-2xl border bg-white p-3 flex items-end gap-2"
        style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 25%, transparent)" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendQuestion(input);
            }
          }}
          placeholder="Ask BritGPT anything — e.g. 'Explore Tiramisu for Britannia'"
          rows={2}
          className="flex-1 resize-none outline-none text-sm bg-transparent px-2 py-2"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="size-10 rounded-xl text-white grid place-items-center disabled:opacity-40"
          style={{ background: "var(--britannia-red)", boxShadow: "var(--shadow-britannia)" }}
          aria-label="Send"
        >
          ↑
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        BritGPT can make mistakes. Cross-check with your data team · powered by{" "}
        <span className="font-semibold" style={{ color: "var(--britannia-red)" }}>
          consuma
        </span>{" "}
        &amp; Gemini
      </div>
    </div>
  );
}

function ConceptCardView({ card, image }: { card: ConceptCard; image?: string }) {
  const rows: Array<[string, string | undefined]> = [
    ["Product", card.product_name],
    ["Brand route", card.brand_route],
    ["Format", card.format],
    ["Flavour", card.flavour],
    ["Pack", card.pack],
    ["Occasion", card.occasion],
  ];
  return (
    <div
      className="rounded-2xl border overflow-hidden grid sm:grid-cols-[auto,1fr]"
      style={{
        borderColor: "color-mix(in oklch, var(--britannia-red) 22%, transparent)",
        boxShadow: "var(--shadow-britannia)",
        background:
          "linear-gradient(135deg, color-mix(in oklch, var(--britannia-red) 4%, white), white)",
      }}
    >
      {image ? (
        <img
          src={image}
          alt={card.product_name ?? "Concept"}
          className="w-full sm:w-64 h-64 object-cover"
        />
      ) : (
        <div className="w-full sm:w-64 h-64 grid place-items-center text-4xl bg-[var(--britannia-cream)]">
          🍪
        </div>
      )}
      <div className="p-5">
        <div
          className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1"
          style={{ color: "var(--britannia-red)" }}
        >
          Concept Card
        </div>
        <h3 className="text-xl font-extrabold mb-3" style={{ color: "var(--britannia-red-deep)" }}>
          {card.product_name ?? "Britannia NPD"}
        </h3>
        <dl className="divide-y" style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 12%, transparent)" }}>
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px,1fr] gap-3 py-2 text-sm">
                <dt className="opacity-60 uppercase tracking-wider text-[11px] font-semibold pt-0.5">
                  {k}
                </dt>
                <dd className="font-medium" style={{ color: "var(--britannia-red-deep)" }}>
                  {v}
                </dd>
              </div>
            ))}
        </dl>
      </div>
    </div>
  );
}
