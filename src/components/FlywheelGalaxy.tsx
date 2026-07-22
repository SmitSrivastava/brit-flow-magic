import { motion } from "framer-motion";
import { Flywheel } from "@/components/Flywheel";
import { britgpt, creative, aeo, external, type Wheel } from "@/lib/flywheel-data";

type Props = { onSelectStage: (wheel: Wheel, stageId: string) => void; showExternal?: boolean };


// Layout coordinates (must match the absolute-positioned wheels below)
const VW = 1200;
const VH = 1700;

// AEO top-center
const AEO_SIZE = 440;
const AEO_CX = 600;
const AEO_TOP = 60;
const AEO_CY = AEO_TOP + AEO_SIZE / 2;

// BritGPT middle (kept apart from AEO)
const BG_SIZE = 620;
const BG_CX = 600;
const BG_TOP = 620;
const BG_CY = BG_TOP + BG_SIZE / 2;
const BG_R = BG_SIZE / 2;

// Creative bottom (shifted right so BritGPT→Creative arrows are clearly visible)
const CR_SIZE = 440;
const CR_CX = 820;
const CR_TOP = 1320;
const CR_CY = CR_TOP + CR_SIZE / 2;
const CR_R = CR_SIZE / 2;

// Helper: stage-box centers on a wheel (i = stage index, 0..5)
function stagePos(cx: number, cy: number, r: number, i: number, n = 6) {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + Math.cos(angle) * (r * 0.78), y: cy + Math.sin(angle) * (r * 0.78) };
}

export function FlywheelGalaxy({ onSelectStage, showExternal }: Props) {
  // Specific box anchors per architecture
  const bg1 = stagePos(BG_CX, BG_CY, BG_R, 0); // Detect Market Shifts (top)
  const bg2 = stagePos(BG_CX, BG_CY, BG_R, 1); // Connect to Consumers
  const bg3 = stagePos(BG_CX, BG_CY, BG_R, 2); // Connect to Commerce
  const bg4 = stagePos(BG_CX, BG_CY, BG_R, 3); // Activate (bottom)

  const aeoBottom = stagePos(AEO_CX, AEO_CY, AEO_SIZE / 2, 3); // bottom box of AEO
  const crTop = stagePos(CR_CX, CR_CY, CR_R, 0); // top box of Creative (Ingest Context)
  const crActivate = stagePos(CR_CX, CR_CY, CR_R, 2); // Activate of Creative

  return (
    <div className="relative w-full" style={{ minHeight: VH }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
      >
        <defs>
          <marker id="arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--britannia-red)" />
          </marker>
          <marker id="arr-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--creative)" />
          </marker>
          <marker id="arr-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--aeo)" />
          </marker>
        </defs>

        {/* AEO/GEO bottom -> BritGPT box 1 (Detect Market Shifts) */}
        <motion.path
          d={`M ${aeoBottom.x} ${aeoBottom.y + 30} C ${aeoBottom.x} ${(aeoBottom.y + bg1.y) / 2}, ${bg1.x} ${(aeoBottom.y + bg1.y) / 2}, ${bg1.x} ${bg1.y - 40}`}
          stroke="var(--aeo)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#arr-blue)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        />
        <text x={aeoBottom.x + 20} y={(aeoBottom.y + bg1.y) / 2} fill="var(--aeo)" fontSize="12" fontWeight="700">
          Discovery & narrative signals
        </text>

        {/* BritGPT box 2 (right-upper) -> Creative top — smooth S-curve */}
        <motion.path
          d={`M ${bg2.x + 30} ${bg2.y + 10} C ${bg2.x + 30} ${bg2.y + 180}, ${crTop.x} ${crTop.y - 200}, ${crTop.x - 20} ${crTop.y - 40}`}
          stroke="var(--britannia-red)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#arr-red)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.15 }}
        />
        {/* BritGPT box 3 (right-lower) -> Creative top — gentle curve */}
        <motion.path
          d={`M ${bg3.x + 30} ${bg3.y + 10} C ${bg3.x + 60} ${bg3.y + 120}, ${crTop.x + 20} ${crTop.y - 160}, ${crTop.x + 20} ${crTop.y - 40}`}
          stroke="var(--britannia-red)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#arr-red)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.3 }}
        />
        <text x={crTop.x + 40} y={crTop.y - 110} fill="var(--britannia-red)" fontSize="12" fontWeight="700">
          Audience + Commerce context
        </text>

        {/* Creative Activate (right side) -> BritGPT box 4 (bottom) — wide arc going left then up */}
        <motion.path
          d={`M ${crActivate.x + 20} ${crActivate.y + 30} C ${crActivate.x + 60} ${crActivate.y + 220}, ${bg4.x} ${bg4.y + 240}, ${bg4.x} ${bg4.y + 40}`}
          stroke="var(--creative)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#arr-orange)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.45 }}
        />
        <text x={(crActivate.x + bg4.x) / 2 - 80} y={Math.max(crActivate.y, bg4.y) + 235} fill="var(--creative)" fontSize="12" fontWeight="700">
          Creative variants → Activate
        </text>

        {/* External Intelligence → BritGPT Activate (bg4) */}
        {showExternal && (
          <>
            <marker id="arr-ext" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="oklch(0.55 0.14 220)" />
            </marker>
            <motion.path
              d={`M 380 1100 C 480 1100, 520 ${bg4.y}, ${bg4.x - 90} ${bg4.y + 10}`}
              stroke="oklch(0.55 0.14 220)" strokeWidth="2.5" fill="none"
              strokeDasharray="8 6" markerEnd="url(#arr-ext)"
              animate={{ strokeDashoffset: [0, -28] }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.6 }}
            />
            <text x={230} y={1075} fill="oklch(0.45 0.14 220)" fontSize="12" fontWeight="700">
              Geo · Weather · Sales → Activate
            </text>
          </>
        )}
      </svg>


      {/* AEO/GEO top center */}
      <div className="absolute" style={{ left: AEO_CX - AEO_SIZE / 2, top: AEO_TOP - 28 }}>
        <div className="text-center mb-2">
          <div className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: "var(--aeo)" }}>
            AEO / GEO Engine
          </div>
        </div>
        <Flywheel wheel={aeo} size={AEO_SIZE} onSelectStage={onSelectStage} spinDuration={55} />
      </div>

      {/* BritGPT middle */}
      <div className="absolute" style={{ left: BG_CX - BG_SIZE / 2, top: BG_TOP - 40 }}>
        <div className="text-center mb-3">
          <div className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: "var(--britannia-red)" }}>
            Core Engine
          </div>
          <div className="text-2xl font-extrabold" style={{ color: "var(--britannia-red-deep)" }}>
            BritGPT Flywheel
          </div>
        </div>
        <Flywheel wheel={britgpt} size={BG_SIZE} onSelectStage={onSelectStage} highlight spinDuration={70} />
      </div>

      {/* Creative bottom */}
      <div className="absolute" style={{ left: CR_CX - CR_SIZE / 2, top: CR_TOP - 28 }}>
        <div className="text-center mb-2">
          <div className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: "var(--creative)" }}>
            Creative Studio
          </div>
        </div>
        <Flywheel wheel={creative} size={CR_SIZE} onSelectStage={onSelectStage} spinDuration={50} />
      </div>
    </div>
  );
}
