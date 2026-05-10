import { motion } from "framer-motion";
import { Flywheel } from "@/components/Flywheel";
import { britgpt, creative, aeo, type Wheel } from "@/lib/flywheel-data";

type Props = { onSelectStage: (wheel: Wheel, stageId: string) => void };

// Layout coordinates (must match the absolute-positioned wheels below)
const VW = 1200;
const VH = 1280;

// AEO top-center
const AEO_SIZE = 320;
const AEO_CX = 600;
const AEO_TOP = 40;
const AEO_CY = AEO_TOP + AEO_SIZE / 2; // 200

// BritGPT middle
const BG_SIZE = 580;
const BG_CX = 600;
const BG_TOP = 380;
const BG_CY = BG_TOP + BG_SIZE / 2; // 670
const BG_R = BG_SIZE / 2;

// Creative bottom
const CR_SIZE = 320;
const CR_CX = 600;
const CR_TOP = 940;
const CR_CY = CR_TOP + CR_SIZE / 2; // 1100
const CR_R = CR_SIZE / 2;

// Helper: stage-box centers on a wheel (i = stage index, 0..5)
function stagePos(cx: number, cy: number, r: number, i: number, n = 6) {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + Math.cos(angle) * (r * 0.72), y: cy + Math.sin(angle) * (r * 0.72) };
}

export function FlywheelGalaxy({ onSelectStage }: Props) {
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

        {/* BritGPT box 2 -> Creative box 1 */}
        <motion.path
          d={`M ${bg2.x + 40} ${bg2.y + 20} C ${bg2.x + 120} ${(bg2.y + crTop.y) / 2}, ${crTop.x + 80} ${(bg2.y + crTop.y) / 2}, ${crTop.x + 10} ${crTop.y - 40}`}
          stroke="var(--britannia-red)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#arr-red)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.15 }}
        />
        {/* BritGPT box 3 -> Creative box 1 */}
        <motion.path
          d={`M ${bg3.x + 40} ${bg3.y + 20} C ${bg3.x + 100} ${(bg3.y + crTop.y) / 2}, ${crTop.x + 60} ${(bg3.y + crTop.y) / 2}, ${crTop.x + 30} ${crTop.y - 30}`}
          stroke="var(--britannia-red)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#arr-red)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.3 }}
        />
        <text x={bg3.x + 90} y={(bg3.y + crTop.y) / 2 - 10} fill="var(--britannia-red)" fontSize="12" fontWeight="700">
          Audience + Commerce context
        </text>

        {/* Creative Activate (box 3) -> BritGPT box 4 (Activate) */}
        <motion.path
          d={`M ${crActivate.x - 40} ${crActivate.y - 10} C ${crActivate.x - 140} ${(crActivate.y + bg4.y) / 2}, ${bg4.x - 100} ${(crActivate.y + bg4.y) / 2}, ${bg4.x - 10} ${bg4.y + 40}`}
          stroke="var(--creative)" strokeWidth="2.5" fill="none"
          strokeDasharray="8 6" markerEnd="url(#arr-orange)"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.45 }}
        />
        <text x={bg4.x - 280} y={(crActivate.y + bg4.y) / 2 + 6} fill="var(--creative)" fontSize="12" fontWeight="700">
          Creative variants → Activate
        </text>
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
