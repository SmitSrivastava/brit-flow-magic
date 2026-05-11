import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Wheel } from "@/lib/flywheel-data";

type Props = {
  wheel: Wheel;
  size: number;
  onSelectStage: (wheel: Wheel, stageId: string) => void;
  highlight?: boolean;
  spinDuration?: number;
};

export function Flywheel({ wheel, size, onSelectStage, highlight, spinDuration = 60 }: Props) {
  const r = size / 2;
  const inner = r * 0.42;
  const stages = wheel.stages;

  const radiusFactor = 0.78;
  const positions = useMemo(
    () =>
      stages.map((_, i) => {
        const angle = (i / stages.length) * Math.PI * 2 - Math.PI / 2;
        const cx = r + Math.cos(angle) * (r * radiusFactor);
        const cy = r + Math.sin(angle) * (r * radiusFactor);
        return { cx, cy, angle };
      }),
    [stages.length, r],
  );

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Rotating arrow ring */}
      <motion.svg
        className="absolute inset-0"
        width={size}
        height={size}
        animate={{ rotate: 360 }}
        transition={{ duration: spinDuration, ease: "linear", repeat: Infinity }}
      >
        <defs>
          <marker id={`arrow-${wheel.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={wheel.color} />
          </marker>
        </defs>
        {stages.map((_, i) => {
          const a1 = (i / stages.length) * Math.PI * 2 - Math.PI / 2 + 0.08;
          const a2 = ((i + 1) / stages.length) * Math.PI * 2 - Math.PI / 2 - 0.08;
          const ringR = r * 0.96;
          const x1 = r + Math.cos(a1) * ringR;
          const y1 = r + Math.sin(a1) * ringR;
          const x2 = r + Math.cos(a2) * ringR;
          const y2 = r + Math.sin(a2) * ringR;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${ringR} ${ringR} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={wheel.color}
              strokeWidth={2}
              strokeOpacity={0.55}
              markerEnd={`url(#arrow-${wheel.id})`}
            />
          );
        })}
      </motion.svg>

      {/* Center hub */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center text-center px-4"
        style={{
          left: r - inner / 2,
          top: r - inner / 2,
          width: inner,
          height: inner,
          background: `radial-gradient(circle at 30% 30%, ${wheel.color}, oklch(0.25 0.05 25))`,
          color: "white",
          boxShadow: highlight ? "var(--shadow-britannia)" : "0 8px 30px -10px rgba(0,0,0,0.3)",
        }}
      >
        <div className="text-xs uppercase tracking-[0.2em] opacity-80">Flywheel</div>
        <div className="font-bold leading-tight mt-1" style={{ fontSize: size * 0.042 }}>
          {wheel.name.replace(" Flywheel", "")}
        </div>
        <div className="text-[10px] mt-1 opacity-80 max-w-[80%]">{wheel.tagline}</div>
      </div>

      {/* Stage boxes */}
      {stages.map((s, i) => {
        const { cx, cy } = positions[i];
        const w = Math.max(size * 0.3, 140);
        const h = Math.max(size * 0.18, 84);
        return (
          <motion.button
            key={s.id}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectStage(wheel, s.id)}
            className="absolute rounded-xl text-left px-2.5 py-2 bg-card border-2 shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col"
            style={{
              left: cx - w / 2,
              top: cy - h / 2,
              width: w,
              height: h,
              borderColor: wheel.color,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                style={{ background: wheel.color, width: 18, height: 18 }}
              >
                {s.num}
              </span>
              <div className="text-[11px] font-bold leading-tight text-foreground">
                {s.title}
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground mt-1 leading-snug">{s.subtitle}</div>
          </motion.button>
        );
      })}
    </div>
  );
}
