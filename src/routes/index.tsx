import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlywheelGalaxy } from "@/components/FlywheelGalaxy";
import { StageDialogs } from "@/components/StageDialogs";
import { BritGPTPanel } from "@/components/BritGPTPanel";
import { wheels, type Stage, type Wheel } from "@/lib/flywheel-data";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Britannia Intelligence Architecture · BritGPT Flywheel" },
      { name: "description", content: "Interactive BritGPT, Creative Studio and AEO/GEO flywheels showing inputs and outputs across the Britannia intelligence ecosystem." },
    ],
  }),
});

type TabKey = "flywheel" | "phase2" | "britgpt";

function Index() {
  const [selected, setSelected] = useState<{ wheel: Wheel; stage: Stage } | null>(null);
  const [tab, setTab] = useState<TabKey>("flywheel");

  const open = (wheel: Wheel, stageId: string) => {
    const stage = wheel.stages.find((s) => s.id === stageId);
    if (stage) setSelected({ wheel, stage });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b" style={{ background: "linear-gradient(135deg, var(--britannia-red-deep), var(--britannia-red))" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 text-white">
          <div className="text-xs uppercase tracking-[0.3em] opacity-80">Britannia</div>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-1">Intelligence Architecture</h1>
          <p className="mt-2 text-sm md:text-base opacity-90 max-w-3xl">
            BritGPT sits at the core. Creative Studio and the AEO / GEO engine spin around it — feeding it
            and being fed by it. Click any stage to see what flows in and what flows out.
          </p>

          <div className="mt-6 inline-flex p-1 rounded-full bg-white/15 backdrop-blur">
            {([
              { k: "flywheel", label: "Flywheel Architecture" },
              { k: "phase2", label: "Phase-2" },
              { k: "britgpt", label: "BritGPT" },
            ] as { k: TabKey; label: string }[]).map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className="px-5 py-2 rounded-full text-sm font-semibold transition"
                style={
                  tab === t.k
                    ? { background: "white", color: "var(--britannia-red-deep)" }
                    : { color: "white" }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab === "flywheel" || tab === "phase2" ? (
        <>
          <section className="max-w-7xl mx-auto px-4 py-10 overflow-x-auto">
            <div className="min-w-[1200px] relative" style={{ height: 1700 }}>
              <FlywheelGalaxy onSelectStage={open} showExternal={tab === "phase2"} />
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="grid md:grid-cols-3 gap-4">
              {wheels.map((w) => (
                <div key={w.id} className="rounded-2xl border-2 p-5 bg-card" style={{ borderColor: w.color }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="size-3 rounded-full" style={{ background: w.color }} />
                    <h3 className="font-bold" style={{ color: w.color }}>{w.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{w.tagline}</p>
                  <ol className="text-xs space-y-1">
                    {w.stages.map((s) => (
                      <li key={s.id}>
                        <button onClick={() => open(w, s.id)} className="text-left hover:underline">
                          {s.num}. {s.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <BritGPTPanel />
        </section>
      )}


      <StageDialogs
        wheel={selected?.wheel ?? null}
        stage={selected?.stage ?? null}
        onClose={() => setSelected(null)}
      />
    </main>
  );
}
