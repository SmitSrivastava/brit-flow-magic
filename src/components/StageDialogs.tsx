import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { Stage, Wheel } from "@/lib/flywheel-data";

type Props = {
  wheel: Wheel | null;
  stage: Stage | null;
  onClose: () => void;
};

export function StageDialogs({ wheel, stage, onClose }: Props) {
  return (
    <AnimatePresence>
      {wheel && stage && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div
            className="grid md:grid-cols-2 gap-6 w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* INPUT POPUP */}
            <motion.div
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="bg-card rounded-2xl shadow-2xl overflow-hidden border-2"
              style={{ borderColor: wheel.color }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2 text-white"
                style={{ background: wheel.color }}
              >
                <ArrowDownToLine className="size-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Inputs into</span>
                <span className="text-sm font-semibold ml-1">{stage.title}</span>
              </div>
              <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
                {stage.inputs.map((g) => (
                  <div key={g.group}>
                    <div className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5" style={{ color: wheel.color }}>
                      {g.group}
                    </div>
                    <ul className="space-y-1">
                      {g.items.map((it) => (
                        <li key={it} className="text-sm text-foreground flex gap-2">
                          <span className="opacity-50">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* OUTPUT POPUP */}
            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.05 }}
              className="bg-card rounded-2xl shadow-2xl overflow-hidden border-2 relative"
              style={{ borderColor: wheel.color }}
            >
              <button
                onClick={onClose}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
              >
                <X className="size-4" />
              </button>
              <div
                className="px-5 py-3 flex items-center gap-2 text-white"
                style={{ background: wheel.color }}
              >
                <ArrowUpFromLine className="size-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Output from</span>
                <span className="text-sm font-semibold ml-1">{stage.title}</span>
              </div>
              <div className="p-6 space-y-4">
                <div
                  className="rounded-xl p-5 border-l-4"
                  style={{
                    borderColor: wheel.color,
                    background: `color-mix(in oklch, ${wheel.color} 8%, transparent)`,
                  }}
                >
                  <div className="text-xs uppercase tracking-wider mb-2 opacity-70">
                    What this box produces
                  </div>
                  <p className="text-base leading-relaxed text-foreground">{stage.output}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  This output flows into downstream stages of the {wheel.name} and connected flywheels.
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
