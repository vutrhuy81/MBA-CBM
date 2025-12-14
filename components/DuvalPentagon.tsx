import React from 'react';
import { calculatePentagonCentroid } from '../utils/duvalMath';
import { GasData } from '../types';

interface DuvalPentagonProps {
  gasData: GasData;
  title: string;
  description?: string;
}

// TỌA ĐỘ CHÍNH XÁC (Giữ nguyên như đã chốt)
const COORDS = {
  // --- 5 Đỉnh Ngũ Giác ---
  H2: { x: 0, y: 40 },
  C2H6: { x: -38, y: 12.4 },
  CH4: { x: -23.5, y: -32.4 },
  C2H4: { x: 23.5, y: -32.4 },
  C2H2: { x: 38, y: 12.4 },

  // --- Các điểm ranh giới ---
  Center_Top: { x: 0, y: 1.5 },       
  Center_Bottom: { x: 0, y: -3 },     
  S_T1_Edge: { x: -35, y: 3.1 },      
  T1_Inner_Peak: { x: -6, y: -4 },    
  T1_T2_Edge: { x: -22.5, y: -32.4 }, 
  T2_T3_Edge: { x: 1, y: -32.4 },     
  T3_D2_Edge: { x: 32, y: -6.1 },     
  T3_Notch: { x: 24.3, y: -30 },      
  D1_D2_Inner: { x: 4, y: 16 },       
  
  // PD Zone 
  PD_BL: { x: -1, y: 24.5 },
  PD_BR: { x: 0, y: 24.5 },
  PD_TL: { x: -1, y: 33 },
  PD_TR: { x: 0, y: 33 }, 
};

const DuvalPentagon: React.FC<DuvalPentagonProps> = ({ gasData, title, description }) => {
  const width = 360;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;
  
  // Scale factor
  const scale = 3.5; 

  const mapPoint = (p: {x: number, y: number}) => ({
    x: cx + p.x * scale,
    y: cy - p.y * scale 
  });

  const P = {
    H2: mapPoint(COORDS.H2),
    C2H6: mapPoint(COORDS.C2H6),
    CH4: mapPoint(COORDS.CH4),
    C2H4: mapPoint(COORDS.C2H4),
    C2H2: mapPoint(COORDS.C2H2),
    
    Center_Top: mapPoint(COORDS.Center_Top),
    Center_Bottom: mapPoint(COORDS.Center_Bottom),
    S_T1_Edge: mapPoint(COORDS.S_T1_Edge),
    T1_Inner_Peak: mapPoint(COORDS.T1_Inner_Peak),
    T1_T2_Edge: mapPoint(COORDS.T1_T2_Edge),
    T2_T3_Edge: mapPoint(COORDS.T2_T3_Edge),
    T3_D2_Edge: mapPoint(COORDS.T3_D2_Edge),
    T3_Notch: mapPoint(COORDS.T3_Notch),
    D1_D2_Inner: mapPoint(COORDS.D1_D2_Inner),
    
    PD_BL: mapPoint(COORDS.PD_BL),
    PD_BR: mapPoint(COORDS.PD_BR),
    PD_TL: mapPoint(COORDS.PD_TL),
    PD_TR: mapPoint(COORDS.PD_TR),
  };

  // --- PATHS ---
  const pathS = `M ${P.H2.x},${P.H2.y} L ${P.C2H6.x},${P.C2H6.y} L ${P.S_T1_Edge.x},${P.S_T1_Edge.y} L ${P.Center_Top.x},${P.Center_Top.y} L ${P.PD_BR.x},${P.PD_BR.y} L ${P.PD_TR.x},${P.PD_TR.y} Z`;
  const pathT1 = `M ${P.S_T1_Edge.x},${P.S_T1_Edge.y} L ${P.CH4.x},${P.CH4.y} L ${P.T1_T2_Edge.x},${P.T1_T2_Edge.y} L ${P.T1_Inner_Peak.x},${P.T1_Inner_Peak.y} L ${P.Center_Bottom.x},${P.Center_Bottom.y} L ${P.Center_Top.x},${P.Center_Top.y} Z`;
  const pathT2 = `M ${P.T1_Inner_Peak.x},${P.T1_Inner_Peak.y} L ${P.T1_T2_Edge.x},${P.T1_T2_Edge.y} L ${P.T2_T3_Edge.x},${P.T2_T3_Edge.y} Z`;
  const pathT3 = `M ${P.Center_Bottom.x},${P.Center_Bottom.y} L ${P.T1_Inner_Peak.x},${P.T1_Inner_Peak.y} L ${P.T2_T3_Edge.x},${P.T2_T3_Edge.y} L ${P.C2H4.x},${P.C2H4.y} L ${P.T3_Notch.x},${P.T3_Notch.y} Z`;
  const pathD2 = `M ${P.Center_Top.x},${P.Center_Top.y} L ${P.Center_Bottom.x},${P.Center_Bottom.y} L ${P.T3_Notch.x},${P.T3_Notch.y} L ${P.T3_D2_Edge.x},${P.T3_D2_Edge.y} L ${P.D1_D2_Inner.x},${P.D1_D2_Inner.y} Z`;
  const pathD1 = `M ${P.Center_Top.x},${P.Center_Top.y} L ${P.D1_D2_Inner.x},${P.D1_D2_Inner.y} L ${P.T3_D2_Edge.x},${P.T3_D2_Edge.y} L ${P.C2H2.x},${P.C2H2.y} L ${P.H2.x},${P.H2.y} L ${P.PD_TR.x},${P.PD_TR.y} L ${P.PD_BR.x},${P.PD_BR.y} Z`;
  const pathPD = `M ${P.PD_TL.x},${P.PD_TL.y} L ${P.PD_TR.x},${P.PD_TR.y} L ${P.PD_BR.x},${P.PD_BR.y} L ${P.PD_BL.x},${P.PD_BL.y} Z`;

  // Bảng màu (Giữ màu tương phản cao nhưng điều chỉnh stroke cho Dark Mode)
  // Text color logic: Màu nào quá sáng thì chữ đen, màu nào đậm thì chữ trắng
  const zones = [
    { label: "S",  color: "#60AFFF", path: pathS,  textColor: "#000" }, // Light Blue
    { label: "D1", color: "#e879f9", path: pathD1, textColor: "#000" }, // Magenta
    { label: "D2", color: "#ef4444", path: pathD2, textColor: "#000" }, // Olive Green #65a30d
    { label: "T3", color: "#DE8F6E", path: pathT3, textColor: "#000" }, // Yellow/Orange
    { label: "T2", color: "#f8d47e", path: pathT2, textColor: "#000" }, // Purple
    { label: "T1", color: "#9966CC", path: pathT1, textColor: "#000" }, // Bright Green
    { label: "PD", color: "#FFDBA4", path: pathPD, textColor: "#000" }, // Pale Yellow
  ];

  const point = calculatePentagonCentroid(gasData, cx, cy, scale);
  
  const pentagonOutline = `M ${P.H2.x},${P.H2.y} L ${P.C2H6.x},${P.C2H6.y} L ${P.CH4.x},${P.CH4.y} L ${P.C2H4.x},${P.C2H4.y} L ${P.C2H2.x},${P.C2H2.y} Z`;

  return (
    // CARD CONTAINER: Dark Slate Background
    <div className="flex flex-col items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-xl w-full">
      <h4 className="text-white font-bold text-lg mb-1">{title}</h4>
      <div className="text-xs text-slate-400 mb-6 text-center h-4">{description}</div>

      <div className="relative w-full flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[360px] overflow-visible">
          
          {/* Background Outline: Light color for Dark mode */}
          <path d={pentagonOutline} fill="none" stroke="#94a3b8" strokeWidth="2" />

          {/* ZONES */}
          {zones.map((z, i) => (
             <path 
                key={i} 
                d={z.path} 
                fill={z.color} 
                fillOpacity="0.85" 
                stroke="#fff" 
                strokeWidth="1"
                className="transition-all hover:fill-opacity-100 cursor-pointer"
             />
          ))}

          {/* ZONE LABELS */}
          <text x={cx - 50} y={cy - 50} fill="#000" fontSize="14" fontWeight="bold" opacity="0.8">S</text>
          <text x={cx + 50} y={cy - 50} fill="#000" fontSize="14" fontWeight="bold" opacity="0.8">D1</text>
          <text x={cx + 50} y={cy + 40} fill="#000" fontSize="14" fontWeight="bold" opacity="0.8">D2</text>
          <text x={cx - 70} y={cy + 40} fill="#000" fontSize="14" fontWeight="bold" opacity="0.8">T1</text>
          <text x={cx - 35} y={cy + 95} fill="#000" fontSize="14" fontWeight="bold" opacity="0.8">T2</text>
          <text x={cx + 30} y={cy + 95} fill="#000" fontSize="14" fontWeight="bold" opacity="0.8">T3</text>
          <text x={cx - 8} y={P.H2.y + 25} fill="#000" fontSize="10" fontWeight="bold">PD</text>

          {/* AXIS LINES (Dashed): Light Slate */}
          {[P.H2, P.C2H6, P.CH4, P.C2H4, P.C2H2].map((v, i) => (
             <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          ))}

          {/* VERTEX LABELS: White/Light Text */}
          <text x={P.H2.x} y={P.H2.y - 15} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">H2</text>
          <text x={P.C2H6.x - 25} y={P.C2H6.y} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">C2H6</text>
          <text x={P.CH4.x - 20} y={P.CH4.y + 15} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">CH4</text>
          <text x={P.C2H4.x + 20} y={P.C2H4.y + 15} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">C2H4</text>
          <text x={P.C2H2.x + 25} y={P.C2H2.y} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">C2H2</text>

          {/* VERTEX DOTS: White */}
          <circle cx={P.H2.x} cy={P.H2.y} r="3" fill="#fff" />
          <circle cx={P.C2H6.x} cy={P.C2H6.y} r="3" fill="#fff" />
          <circle cx={P.CH4.x} cy={P.CH4.y} r="3" fill="#fff" />
          <circle cx={P.C2H4.x} cy={P.C2H4.y} r="3" fill="#fff" />
          <circle cx={P.C2H2.x} cy={P.C2H2.y} r="3" fill="#fff" />

          {/* CENTER DOT */}
          <circle cx={cx} cy={cy} r="3" fill="#fff" />

          {/* DATA POINT */}
          {point && (
            <>
               <circle cx={point.x} cy={point.y} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" className="shadow-lg shadow-red-500/50" />
               <circle cx={point.x} cy={point.y} r="12" fill="#ef4444" opacity="0.4" className="animate-ping" />
            </>
          )}
        </svg>
      </div>

      {/* LEGEND: Dark mode style */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center w-full px-2">
         {zones.map((z, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 shadow-sm">
               <span className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: z.color}}></span>
               <span className="text-[11px] font-bold text-slate-300">{z.label}</span>
            </div>
         ))}
      </div>
    </div>
  );
};

export default DuvalPentagon;
