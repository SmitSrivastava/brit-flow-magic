import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askBritGPT, generateConceptImage } from "@/lib/vertex-ai.functions";

type Followup = { label: string; icon?: string; action?: string; topic?: string };

type Play = { play: string; icon?: string; route: string; why: string; brands: string[] };

type Message =
  | { role: "user"; text: string }
  | { role: "model"; text: string; followups?: Followup[]; image?: string; concept?: ConceptCard; plays?: Play[] };

type ConceptCard = {
  image_prompt?: string;
  product_name?: string;
  brand_route?: string;
  format?: string;
  flavour?: string;
  pack?: string;
  occasion?: string;
  states?: string[];
  languages?: string[];
};

type Brief = {
  topic: string;
  brand: string;
  format: string;
  scope: "Pan India" | "Specific States";
  states: string[];
  languages: string[];
  occasion: string;
};

const BRAND_OPTIONS = [
  { brand: "Treat Wafer", format: "wafer" },
  { brand: "Pure Magic", format: "premium cream biscuit" },
  { brand: "GoodDay", format: "cookie" },
  { brand: "GoodDay Cake", format: "cake" },
  { brand: "Bourbon", format: "cream biscuit" },
  { brand: "Jim-Jam", format: "cream biscuit" },
  { brand: "50-50", format: "cracker" },
  { brand: "MilkBikis", format: "milk biscuit" },
  { brand: "Marie Gold", format: "tea biscuit" },
  { brand: "NutriChoice", format: "healthy biscuit" },
  { brand: "Winkin Cow", format: "milkshake" },
  { brand: "Toastea", format: "rusk" },
  { brand: "Layerz", format: "layered cake" },
  { brand: "Little Hearts", format: "sugar biscuit" },
];

const STATE_OPTIONS = [
  "Maharashtra","Gujarat","Rajasthan","Delhi NCR","Punjab","UP","MP","West Bengal","Odisha","Bihar",
  "Tamil Nadu","Karnataka","Kerala","Telangana","Andhra Pradesh","Assam","NorthEast"
];
const LANG_OPTIONS = ["Hindi","English","Marathi","Gujarati","Bengali","Tamil","Telugu","Kannada","Malayalam","Punjabi"];
const OCCASIONS = ["Diwali","Raksha Bandhan","Holi","Eid","Onam","Pongal","Durga Puja","Everyday Snack","Tea-time","Gifting","Kids Tiffin"];

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

const STARTER_QUESTIONS: Followup[] = [
  { icon: "⚡", label: "Kaju Katli → which Britannia brands win? (FPD-sized)", action: "ask" },
  { icon: "🌐", label: "Matcha for urban India — best Britannia route + cohort?", action: "ask" },
  { icon: "🌶️", label: "Schezwan signal — is there a 50-50 / Treat savoury play?", action: "ask" },
  { icon: "🧭", label: "Show Britannia's 4 Plays across the portfolio", action: "ask" },
  { icon: "🍪", label: "Map NPD opportunities across all categories (incl. Wafers)", action: "ask" },
  { icon: "📋", label: "Build a Creative Brief for the top opportunity", action: "ask" },
  { icon: "🧪", label: "Design the Concept Test plan (FPD cohort + sampling)", action: "ask" },
  { icon: "🎨", label: "Create Concept Card — Treat Kaju Katli Wafer", action: "concept_card", topic: "Treat Kaju Katli Wafer" },
];

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

  const [briefTopic, setBriefTopic] = useState<string | null>(null);

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
          { role: "model", text: cleanText(r.text), followups: r.followups, concept: r.concept, plays: r.plays },
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

  function openConceptBrief(topic: string) {
    if (loading) return;
    setBriefTopic(topic);
  }

  async function submitConceptBrief(brief: Brief) {
    setBriefTopic(null);
    if (loading) return;
    const statesLine = brief.scope === "Pan India"
      ? "Pan India activation"
      : `Specific states: ${brief.states.join(", ") || "—"}`;
    const langLine = brief.languages.length ? brief.languages.join(", ") : "Hindi, English";
    const question = `Create a complete **Concept Card** for **${brief.topic}** as a Britannia NPD.

**Brief locked by user — RESPECT EXACTLY:**
- Brand route: **${brief.brand}**
- Format: **${brief.format}** (image_prompt MUST depict this exact format — not a generic cookie/sweet)
- Geographic scope: **${statesLine}**
- Languages: **${langLine}**
- Occasion: **${brief.occasion}**

Structure with markdown headings + tables:
1. ## 🍪 Concept Name & Tagline (tagline in each briefed language)
2. ## 🏭 Brand Route & Portfolio Cross-Map (anchor brand = ${brief.brand}; show 2-3 adjacent Britannia brands)
3. ## 🎨 Flavour, Format & Pack (format = ${brief.format})
4. ## 🗺️ Regional Rollout (${statesLine})
5. ## 👥 Target FPD Cohort (cite actual base-brand volumes)
6. ## 📣 Communication Angle & Claim (per-language)
7. ## 🎬 Influencer + Media Plan (region/language-specific)
8. ## ✅ Why It Wins
9. ## 🧪 Validation Plan

Then output the mandatory \`\`\`concept\`\`\`, \`\`\`plays\`\`\` and \`\`\`followups\`\`\` JSON blocks. The concept's "format" and "image_prompt" MUST match "${brief.format}".`;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `🎨 Concept Brief — ${brief.topic} · ${brief.brand} · ${brief.format} · ${statesLine} · ${langLine} · ${brief.occasion}` },
    ]);
    setLoading(true);
    try {
      const textRes = await ask({ data: { question, history } });
      const fallback = `Britannia ${brief.brand} ${brief.format} pack mockup, ${brief.topic} flavour, photoreal product hero shot of the actual packaged ${brief.format} on a cream background, gold festive accents, studio lighting, 1:1 square.`;
      const imagePrompt =
        textRes.ok && textRes.concept?.image_prompt ? textRes.concept.image_prompt : fallback;
      const imgRes = await genImage({ data: { prompt: imagePrompt } });
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: textRes.ok ? cleanText(textRes.text) : `**Error:** ${textRes.message}`,
          followups: textRes.ok ? textRes.followups : undefined,
          concept: textRes.ok ? textRes.concept : undefined,
          plays: textRes.ok ? textRes.plays : undefined,
          image: imgRes.ok ? imgRes.dataUrl : undefined,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleFollowup(f: Followup) {
    if (f.action === "concept_card" && f.topic) openConceptBrief(f.topic);
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
                  {m.plays && m.plays.length > 0 && <PlaysGrid plays={m.plays} />}
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

      {briefTopic && (
        <ConceptBriefModal
          topic={briefTopic}
          onCancel={() => setBriefTopic(null)}
          onSubmit={submitConceptBrief}
        />
      )}
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

const PLAY_PALETTE = [
  { bg: "oklch(0.96 0.05 30)", accent: "var(--britannia-red)", border: "color-mix(in oklch, var(--britannia-red) 30%, transparent)" },
  { bg: "oklch(0.96 0.05 80)", accent: "oklch(0.55 0.16 70)", border: "color-mix(in oklch, oklch(0.55 0.16 70) 30%, transparent)" },
  { bg: "oklch(0.95 0.05 280)", accent: "oklch(0.5 0.18 290)", border: "color-mix(in oklch, oklch(0.5 0.18 290) 30%, transparent)" },
  { bg: "oklch(0.95 0.06 160)", accent: "oklch(0.45 0.13 160)", border: "color-mix(in oklch, oklch(0.45 0.13 160) 30%, transparent)" },
];

function PlaysGrid({ plays }: { plays: Play[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🧭</span>
        <h3 className="text-base font-extrabold" style={{ color: "var(--britannia-red-deep)" }}>
          Britannia's 4 Plays
        </h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {plays.slice(0, 4).map((p, i) => {
          const c = PLAY_PALETTE[i % PLAY_PALETTE.length];
          return (
            <div
              key={i}
              className="rounded-2xl border p-4 flex flex-col gap-2 transition hover:-translate-y-0.5"
              style={{ background: c.bg, borderColor: c.border, boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-9 rounded-xl grid place-items-center text-lg font-bold text-white"
                  style={{ background: c.accent }}
                >
                  {p.icon ?? ["🍪","📣","🎬","🛒"][i]}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70" style={{ color: c.accent }}>
                    Play 0{i + 1}
                  </div>
                  <div className="font-extrabold text-sm leading-tight" style={{ color: c.accent }}>
                    {p.play}
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium leading-snug">{p.route}</div>
              <div className="text-xs opacity-75 leading-snug">{p.why}</div>
              {p.brands?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.brands.map((b) => (
                    <span
                      key={b}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/70 border"
                      style={{ borderColor: c.border, color: c.accent }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConceptBriefModal({
  topic,
  onCancel,
  onSubmit,
}: {
  topic: string;
  onCancel: () => void;
  onSubmit: (b: Brief) => void;
}) {
  // Smart default brand inference from the topic text
  const inferred = BRAND_OPTIONS.find((b) => topic.toLowerCase().includes(b.brand.toLowerCase().split(" ")[0]));
  const [brand, setBrand] = useState(inferred?.brand ?? "Treat Wafer");
  const current = BRAND_OPTIONS.find((b) => b.brand === brand) ?? BRAND_OPTIONS[0];
  const [format, setFormat] = useState(current.format);
  const [scope, setScope] = useState<"Pan India" | "Specific States">("Pan India");
  const [states, setStates] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["Hindi", "English"]);
  const [occasion, setOccasion] = useState("Diwali");

  useEffect(() => {
    const b = BRAND_OPTIONS.find((x) => x.brand === brand);
    if (b) setFormat(b.format);
  }, [brand]);

  function toggle(list: string[], setList: (v: string[]) => void, v: string) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ background: "var(--britannia-cream)", borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)" }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: "var(--britannia-red)" }}>
              Creative Brief
            </div>
            <h3 className="text-lg font-extrabold" style={{ color: "var(--britannia-red-deep)" }}>
              🎨 {topic}
            </h3>
          </div>
          <button onClick={onCancel} className="opacity-60 hover:opacity-100 text-xl">×</button>
        </div>

        <div className="p-5 space-y-5">
          <Field label="Brand route">
            <div className="flex flex-wrap gap-2">
              {BRAND_OPTIONS.map((b) => (
                <button
                  key={b.brand}
                  onClick={() => setBrand(b.brand)}
                  className="text-xs px-3 py-1.5 rounded-full border font-semibold"
                  style={{
                    background: brand === b.brand ? "var(--britannia-red)" : "white",
                    color: brand === b.brand ? "white" : "var(--britannia-red-deep)",
                    borderColor: "color-mix(in oklch, var(--britannia-red) 25%, transparent)",
                  }}
                >
                  {b.brand}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Format">
            <input
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 22%, transparent)" }}
            />
          </Field>

          <Field label="Geographic scope">
            <div className="flex gap-2 mb-2">
              {(["Pan India", "Specific States"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className="text-xs px-3 py-1.5 rounded-full border font-semibold"
                  style={{
                    background: scope === s ? "var(--britannia-red)" : "white",
                    color: scope === s ? "white" : "var(--britannia-red-deep)",
                    borderColor: "color-mix(in oklch, var(--britannia-red) 25%, transparent)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {scope === "Specific States" && (
              <div className="flex flex-wrap gap-1.5">
                {STATE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle(states, setStates, s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border"
                    style={{
                      background: states.includes(s) ? "color-mix(in oklch, var(--britannia-red) 15%, white)" : "white",
                      borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)",
                      color: "var(--britannia-red-deep)",
                      fontWeight: states.includes(s) ? 700 : 500,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </Field>

          <Field label="Languages">
            <div className="flex flex-wrap gap-1.5">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l}
                  onClick={() => toggle(languages, setLanguages, l)}
                  className="text-[11px] px-2.5 py-1 rounded-full border"
                  style={{
                    background: languages.includes(l) ? "color-mix(in oklch, var(--britannia-red) 15%, white)" : "white",
                    borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)",
                    color: "var(--britannia-red-deep)",
                    fontWeight: languages.includes(l) ? 700 : 500,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Occasion">
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  className="text-[11px] px-2.5 py-1 rounded-full border"
                  style={{
                    background: occasion === o ? "var(--britannia-red)" : "white",
                    color: occasion === o ? "white" : "var(--britannia-red-deep)",
                    borderColor: "color-mix(in oklch, var(--britannia-red) 22%, transparent)",
                    fontWeight: occasion === o ? 700 : 500,
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div
          className="px-5 py-3 border-t flex items-center justify-end gap-2"
          style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)" }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 22%, transparent)", color: "var(--britannia-red-deep)" }}
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({ topic, brand, format, scope, states, languages, occasion })
            }
            className="px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: "var(--britannia-red)", boxShadow: "var(--shadow-britannia)" }}
          >
            Generate Concept →
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: "var(--britannia-red)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
