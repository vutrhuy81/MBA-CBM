import React from 'react';
import { calculateDuvalCoordinates, getDuvalPath, Point } from '../utils/duvalMath';

interface DuvalTriangleProps {
  type: "1";
  title: string;
  pA: number;
  pB: number;
  pC: number;
  labelA: string;
  labelB: string;
  labelC: string;
  description?: string;
}

interface Zone {
  label: string;
  color: string;
  // a=Top, b=Right, c=Left
  points: { a: number, b: number, c: number }[]; 
  labelPos?: { a: number, b: number, c: number };
}

// ==========================================
// 1. TỌA ĐỘ CHUẨN DUVAL TRIANGLE 1
// (Dựa trên tài liệu Power Transformer Health)
// A=CH4, B=C2H4, C=C2H2
// ==========================================
const P1 = {
  Top: {a:100, b:0, c:0},
  Right: {a:0, b:100, c:0},
  Left: {a:0, b:0, c:100},
  
  // Các điểm neo a-o
  a: {a:98, b:0, c:2},
  b: {a:98, b:2, c:0},
  c: {a:96, b:0, c:4},
  d: {a:76, b:20, c:4},
  e: {a:80, b:20, c:0},
  f: {a:46, b:50, c:4},
  g: {a:50, b:50, c:0},
  h: {a:35, b:50, c:15},
  I: {a:0, b:85, c:15},
  J: {a:0, b:71, c:29},
  k: {a:31, b:40, c:29},
  l: {a:47, b:40, c:13},
  m: {a:64, b:23, c:13}, // Triple Point
  n: {a:87, b:0, c:13},
  o: {a:0, b:23, c:77}
};

const DuvalTriangle: React.FC<DuvalTriangleProps> = ({
  type, title, pA, pB, pC, labelA, labelB, labelC, description
}) => {
  const width = 360; 
  const height = 320;
  const padding = 40;

  // Vertices
  const Ax = width / 2;
  const Ay = padding;
  const Bx = width - padding;
  const By = height - padding;
  const Cx = padding;
  const Cy = height - padding;

  const getZones = (): Zone[] => {
    // --- TYPE 1: CLASSIC DGA ---
    if (type === "1") {
      return [
        { label: "PD", color: "#3b82f6", points: [P1.Top, P1.b, P1.a] },
        { label: "T1", color: "#facc15", points: [P1.b, P1.e, P1.d, P1.c] },
        { label: "T2", color: "#f8d47e", points: [P1.e, P1.g, P1.f, P1.d] },
        { label: "T3", color: "#DE8F6E", points: [P1.g, P1.Right, P1.I, P1.h, P1.f] },
        { label: "D1", color: "#10b981", points: [P1.n, P1.m, P1.o, P1.Left] },
        { 
          label: "D2", color: "#ef4444", 
          points: [P1.m, P1.l, P1.k, P1.J, P1.o],
          labelPos: {a:20, b:40, c:40}
        },
        // DT: Vùng trung tâm nối liền mạch
        { 
          label: "DT", color: "#8b5cf6", 
          points: [P1.c, P1.d, P1.f, P1.h, P1.I, P1.J, P1.k, P1.l, P1.m, P1.n] 
        }
      ];
    } 
    return [];
  };

  const zones = getZones();
  const point = calculateDuvalCoordinates(pA, pB, pC, width, height, padding);

  const getLabelPos = (z: Zone) => {
    if (z.labelPos) {
       return calculateDuvalCoordinates(z.labelPos.a, z.labelPos.b, z.labelPos.c, width, height, padding);
    }
    let sumA = 0, sumB = 0, sumC = 0;
    // Lấy mẫu nhiều điểm hơn cho đa giác phức tạp (như vùng S hay DT)
    const len = Math.min(z.points.length, 8);
    for(let i=0; i<len; i++) {
        sumA += z.points[i].a;
        sumB += z.points[i].b;
        sumC += z.points[i].c;
    }
    return calculateDuvalCoordinates(sumA/len, sumB/len, sumC/len, width, height, padding);
  };

  return (
    <div className="flex flex-col items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
      <h4 className="text-white font-bold text-lg mb-1">{title}</h4>
      <div className="text-xs text-slate-400 mb-6 text-center h-4">{description}</div>
      
      <div className="relative w-full flex justify-center">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto max-w-[360px] overflow-visible"
        >
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
               <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Background Triangle */}
          <path d={`M${Ax},${Ay} L${Bx},${By} L${Cx},${Cy} Z`} fill="#1e293b" stroke="#475569" strokeWidth="3" />

          {/* Zones */}
          {zones.map((zone, idx) => (
            <path
                key={idx}
                d={getDuvalPath(zone.points, width, height, padding)}
                fill={zone.color}
                fillOpacity="0.4"
                stroke={zone.color}
                strokeWidth="1"
                className="transition-all hover:fill-opacity-60"
            />
          ))}

          {/* Zone Labels */}
          {zones.map((zone, idx) => {
            const pos = getLabelPos(zone);
            return (
                <text 
                    key={`label-${idx}`} 
                    x={pos.x} y={pos.y} 
                    textAnchor="middle" dominantBaseline="middle" 
                    fill="#fff" fontSize="10" fontWeight="bold" pointerEvents="none"
                    style={{ textShadow: '1px 1px 2px black' }}
                >
                    {zone.label}
                </text>
            );
          })}

          {/* Grid Lines (Dashed) */}
          <path d={`M${(Ax+Bx)/2},${(Ay+By)/2} L${(Ax+Cx)/2},${(Ay+Cy)/2}`} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>
          <path d={`M${(Ax+Bx)/2},${(Ay+By)/2} L${(Bx+Cx)/2},${(By+Cy)/2}`} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>
          <path d={`M${(Ax+Cx)/2},${(Ay+Cy)/2} L${(Bx+Cx)/2},${(By+Cy)/2}`} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>

          {/* Axis Labels & Values */}
          {/* TOP */}
          <text x={Ax} y={Ay - 25} textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">{labelA}</text>
          <text x={Ax} y={Ay - 8} textAnchor="middle" fill="#94a3b8" fontSize="11">{Math.round(pA)}%</text>

          {/* RIGHT */}
          <text x={Bx + 15} y={By} textAnchor="start" fill="#e2e8f0" fontSize="14" fontWeight="bold">{labelB}</text>
          <text x={Bx + 15} y={By + 15} textAnchor="start" fill="#94a3b8" fontSize="11">{Math.round(pB)}%</text>

          {/* LEFT */}
          <text x={Cx - 15} y={By} textAnchor="end" fill="#e2e8f0" fontSize="14" fontWeight="bold">{labelC}</text>
          <text x={Cx - 15} y={By + 15} textAnchor="end" fill="#94a3b8" fontSize="11">{Math.round(pC)}%</text>
          
          {/* Arrows */}
          <line x1={Cx - 10} y1={Cy - 30} x2={Ax - 35} y2={Ay + 20} stroke="#475569" strokeWidth="1" markerEnd="url(#arrow)" />
          <line x1={Ax + 35} y1={Ay + 20} x2={Bx + 10} y2={By - 30} stroke="#475569" strokeWidth="1" markerEnd="url(#arrow)" />
          <line x1={Bx - 30} y1={By + 20} x2={Cx + 30} y2={Cy + 20} stroke="#475569" strokeWidth="1" markerEnd="url(#arrow)" />

          {/* Data Point */}
          {point && (
            <>
                <circle cx={point.x} cy={point.y} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" className="animate-pulse shadow-lg" />
                <circle cx={point.x} cy={point.y} r="12" fill="#ef4444" opacity="0.4" className="animate-ping" />
            </>
          )}

        </svg>
      </div>
      
      {/* Values Table */}
      <div className="mt-6 flex gap-2 text-xs w-full px-2 justify-center">
        {[
          { l: labelA, v: pA },
          { l: labelB, v: pB },
          { l: labelC, v: pC }
        ].map((item, i) => (
           <div key={i} className="bg-slate-900/50 p-2 rounded border border-slate-700 text-center min-w-[80px]">
              <div className="text-slate-400 mb-1">{item.l}</div>
              <div className="font-mono text-white font-bold">{item.v.toFixed(1)}%</div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default DuvalTriangle;