import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askBritGPT, generateConceptImage } from "@/lib/vertex-ai.functions";

type Followup = { label: string; icon?: string; action?: string; topic?: string };

type Message =
  | { role: "user"; text: string }
  | { role: "model"; text: string; followups?: Followup[]; image?: string };

const STARTERS: Followup[] = [
  { icon: "⚡", label: "What is Britannia's play here?", action: "ask" },
  { icon: "⚡", label: "Map NPD opportunities", action: "ask" },
  { icon: "❓", label: "Top brand-flavour fits?", action: "ask" },
  { icon: "⚡", label: "Good Day festive NPD concept", action: "ask" },
  { icon: "🔍", label: "Show portfolio matrix", action: "ask" },
  { icon: "⚡", label: "Gunpowder Podi activation", action: "ask" },
  { icon: "🎨", label: "Create Concept Card — Kaju Katli", action: "concept_card", topic: "Kaju Katli" },
];

const TAG_PILLS = ["📊 Flavour table", "🗺️ Regional signals", "👥 FPD volumes", "🏭 Full portfolio"];

export function BritGPTChat({ onBack }: { onBack: () => void }) {
  const ask = useServerFn(askBritGPT);
  const genImage = useServerFn(generateConceptImage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendQuestion(question: string) {
    if (!question.trim() || loading) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const r = await ask({ data: { question, history } });
      if (r.ok) {
        setMessages((prev) => [...prev, { role: "model", text: r.text, followups: r.followups }]);
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
    const question = `Create a complete **Concept Card** for **${topic}** as a Britannia NPD. Structure with these sections (use markdown headings + tables):
1. ## 🍪 Concept Name & Tagline
2. ## 🏭 Brand Route & Portfolio Cross-Map  (table — show ALL plausible Britannia brands/formats this idea could plug into, pick the lead one)
3. ## 🎨 Flavour, Format & Pack  (chosen format e.g. cream biscuit / wafer / cake / rusk / shake — be specific)
4. ## 👥 Target FPD Cohort  (cite actual base-brand volumes)
5. ## 📣 Communication Angle & Claim
6. ## 🎬 Influencer + Media Plan  (regional creators, channels)
7. ## ✅ Why It Wins  (tie to specific Consuma signals/growth %)
8. ## 🧪 Validation Plan  (concept test → FPD pilot → commerce)

Then output the mandatory \`\`\`concept ... \`\`\` JSON block (with a precise image_prompt that describes the ACTUAL packaged product format you chose — e.g. a Britannia GoodDay cream cookie pack, NOT a generic plate of mithai) and the \`\`\`followups ... \`\`\` block.`;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: `🎨 Create Concept Card — ${topic}` }]);
    setLoading(true);
    try {
      const textRes = await ask({ data: { question, history } });
      const imagePrompt = textRes.ok && textRes.concept?.image_prompt
        ? textRes.concept.image_prompt
        : `Britannia branded product packaging concept for "${topic}". Photoreal product hero shot of the packaged biscuit/cookie/wafer pack on a clean cream background, studio lighting, Indian festive cues, 1:1 square. Show the actual packaged product, not raw sweets.`;
      const imgRes = await genImage({ data: { prompt: imagePrompt } });
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: textRes.ok ? textRes.text : `**Error:** ${textRes.message}`,
          followups: textRes.ok ? textRes.followups : undefined,
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
  const chips = lastFollowups && lastFollowups.length ? lastFollowups : STARTERS;

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
          style={{ background: "color-mix(in oklch, var(--britannia-red) 12%, transparent)", color: "var(--britannia-red-deep)" }}
        >
          BRITGPT
        </span>
      </div>

      {/* Consuma data loaded card */}
      <div
        className="rounded-2xl border p-4 flex items-start gap-3"
        style={{ background: "white", borderColor: "color-mix(in oklch, var(--britannia-red) 18%, transparent)" }}
      >
        <div
          className="rounded-lg p-2 text-lg"
          style={{ background: "color-mix(in oklch, var(--britannia-red) 10%, transparent)" }}
        >
          📋
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] font-bold" style={{ color: "var(--britannia-red)" }}>
            Consuma Data Loaded
          </div>
          <div className="text-sm mt-0.5">
            Flavour analysis (India + Global) + FPD brand volumes + full Britannia portfolio preloaded.
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

      {/* Hero band */}
      {messages.length === 0 && (
        <div
          className="rounded-2xl p-5 flex gap-4 items-start text-white"
          style={{
            background: "linear-gradient(135deg, var(--britannia-red-deep), var(--britannia-red))",
            boxShadow: "var(--shadow-britannia)",
          }}
        >
          <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-xl">B</div>
          <div>
            <h3 className="text-2xl font-extrabold">
              What would you like to <em className="font-serif italic">do next?</em>
            </h3>
            <p className="text-sm opacity-90 mt-0.5">
              Flavour data, FPD volumes & portfolio loaded. Ask anything or pick a signal below.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
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
                  {m.text}
                </div>
              ) : (
                <div className="max-w-[92%] space-y-3">
                  {m.image && (
                    <img
                      src={m.image}
                      alt="Generated concept"
                      className="rounded-xl border w-72 h-72 object-cover"
                      style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 25%, transparent)" }}
                    />
                  )}
                  <div className="prose prose-sm max-w-none prose-headings:font-extrabold prose-headings:text-[var(--britannia-red-deep)] prose-strong:text-[var(--britannia-red-deep)] prose-a:text-[var(--britannia-red)]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--britannia-red-deep)" }}>
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

      {/* Suggested chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((c, i) => (
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
              color:
                c.action === "concept_card" ? "oklch(0.4 0.2 300)" : "var(--britannia-red-deep)",
            }}
          >
            {c.icon ? `${c.icon} ` : ""}
            {c.label}
          </button>
        ))}
      </div>

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
          placeholder="Ask anything — e.g. 'What is Britannia's play here?' or 'Create a concept card for Kaju Katli'"
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
        & Gemini
      </div>
    </div>
  );
}
