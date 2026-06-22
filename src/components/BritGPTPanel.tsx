import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { testVertexConnection } from "@/lib/vertex-ai.functions";
import { BritGPTChat } from "@/components/BritGPTChat";

type DemoKey = "india" | "global";

const DEMOS: Record<DemoKey, { label: string; url: string; subtitle: string }> = {
  india: {
    label: "Indian Flavour Demo",
    url: "https://britgpt-n.vercel.app/",
    subtitle: "Consumer Research · India",
  },
  global: {
    label: "Global Flavour Demo",
    url: "https://britgpt-g.vercel.app/",
    subtitle: "Consumer Research · Global",
  },
};

export function BritGPTPanel() {
  const [active, setActive] = useState<DemoKey>("india");
  const [view, setView] = useState<"demo" | "fpd">("demo");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const ping = useServerFn(testVertexConnection);

  useEffect(() => {
    let cancelled = false;
    ping()
      .then((r) => !cancelled && setStatus({ ok: r.ok, message: r.message }))
      .catch((e) => !cancelled && setStatus({ ok: false, message: String(e) }));
    return () => {
      cancelled = true;
    };
  }, [ping]);

  const demo = DEMOS[active];

  if (view === "fpd") {
    return <BritGPTChat onBack={() => setView("demo")} />;
  }

  return (
    <div className="space-y-5">

      {/* Demo selector */}
      <div
        className="rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4"
        style={{
          background: "var(--britannia-cream)",
          borderColor: "color-mix(in oklch, var(--britannia-red) 20%, transparent)",
        }}
      >
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ color: "var(--britannia-red-deep)" }}
          >
            BritGPT · Consumer Research
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: "var(--britannia-red-deep)" }}>
            What would you like to <em className="font-serif italic">discover</em> today?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{demo.subtitle}</p>
        </div>
        <div className="flex gap-3">
          {(Object.keys(DEMOS) as DemoKey[]).map((k) => {
            const isActive = active === k;
            return (
              <button
                key={k}
                onClick={() => setActive(k)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm"
                style={
                  isActive
                    ? {
                        background: "var(--britannia-red)",
                        color: "white",
                        boxShadow: "var(--shadow-britannia)",
                      }
                    : {
                        background: "white",
                        color: "var(--britannia-red-deep)",
                        border: "1px solid color-mix(in oklch, var(--britannia-red) 30%, transparent)",
                      }
                }
              >
                {DEMOS[k].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Iframe */}
      <div
        className="rounded-2xl overflow-hidden border bg-white"
        style={{ borderColor: "color-mix(in oklch, var(--britannia-red) 20%, transparent)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 text-xs"
          style={{ background: "var(--britannia-cream)", color: "var(--britannia-red-deep)" }}
        >
          <span className="font-mono opacity-70">{demo.url}</span>
          <a
            href={demo.url}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Open in new tab ↗
          </a>
        </div>
        <iframe
          key={demo.url}
          src={demo.url}
          title={demo.label}
          className="w-full"
          style={{ height: "calc(100vh - 280px)", minHeight: 600, border: 0 }}
          allow="clipboard-read; clipboard-write"
        />
      </div>

      {/* Vertex AI status */}
      <div
        className="rounded-xl border px-4 py-3 text-xs flex items-center gap-2"
        style={{
          background: "white",
          borderColor: "color-mix(in oklch, var(--britannia-red) 15%, transparent)",
        }}
      >
        <span
          className="inline-block size-2 rounded-full"
          style={{
            background: status?.ok ? "oklch(0.7 0.18 145)" : status ? "var(--britannia-red)" : "oklch(0.8 0 0)",
          }}
        />
        <span className="font-semibold" style={{ color: "var(--britannia-red-deep)" }}>
          Vertex AI (GCP) connection:
        </span>
        <span className="text-muted-foreground">
          {status ? status.message : "Checking service account…"}
        </span>
      </div>
    </div>
  );
}
