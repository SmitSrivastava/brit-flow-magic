import { useState } from "react";
import { motion } from "framer-motion";
import { Flywheel } from "@/components/Flywheel";
import { wheels, britgpt, creative, aeo, type Stage, type Wheel } from "@/lib/flywheel-data";

type Props = { onSelectStage: (wheel: Wheel, stageId: string) => void };

export function FlywheelGalaxy({ onSelectStage }: Props) {
  return (
    <div className="relative w-full" style={{ minHeight: 980 }}>
      {/* Connector arrows between wheels */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 980" preserveAspectRatio="none">
        <defs>
          <marker id="big-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--britannia-red)" />
          </marker>
          <marker id="big-arrow-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--creative)" />
          </marker>
          <marker id="big-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--aeo)" />
          </marker>
        </defs>

        {/* Creative (top-left) ↔ BritGPT (center) */}
        <motion.path
          d="M 320 280 C 470 360, 470 380, 540 460"
          stroke="var(--creative)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#big-arrow-orange)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        />
        <motion.path
          d="M 540 420 C 470 340, 470 320, 320 240"
          stroke="var(--britannia-red)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#big-arrow)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.3 }}
        />

        {/* AEO (top-right) ↔ BritGPT */}
        <motion.path
          d="M 880 280 C 750 360, 750 380, 660 460"
          stroke="var(--aeo)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#big-arrow-blue)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.15 }}
        />
        <motion.path
          d="M 660 420 C 750 340, 750 320, 880 240"
          stroke="var(--britannia-red)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#big-arrow)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.5 }}
        />

        {/* Labels */}
        <text x="380" y="350" fill="var(--creative)" fontSize="11" fontWeight="600">creative ↔ activate</text>
        <text x="780" y="350" fill="var(--aeo)" fontSize="11" fontWeight="600">discovery ↔ trends</text>
      </svg>

      {/* Creative Studio top-left */}
      <div className="absolute" style={{ left: 20, top: 20 }}>
        <div className="text-center mb-2">
          <div className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: "var(--creative)" }}>
            Creative Studio
          </div>
        </div>
        <Flywheel wheel={creative} size={300} onSelectStage={onSelectStage} spinDuration={50} />
      </div>

      {/* AEO/GEO top-right */}
      <div className="absolute" style={{ right: 20, top: 20 }}>
        <div className="text-center mb-2">
          <div className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: "var(--aeo)" }}>
            AEO / GEO Engine
          </div>
        </div>
        <Flywheel wheel={aeo} size={300} onSelectStage={onSelectStage} spinDuration={55} />
      </div>

      {/* BritGPT center large */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 380 }}>
        <div className="text-center mb-3">
          <div className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: "var(--britannia-red)" }}>
            Core Engine
          </div>
          <div className="text-2xl font-extrabold" style={{ color: "var(--britannia-red-deep)" }}>
            BritGPT Flywheel
          </div>
        </div>
        <Flywheel wheel={britgpt} size={560} onSelectStage={onSelectStage} highlight spinDuration={70} />
      </div>
    </div>
  );
}
