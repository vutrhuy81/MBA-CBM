import React from 'react';
import { calculatePentagonCentroid } from '../utils/duvalMath';
import { GasData } from '../types';

interface DuvalPentagonProps {
  gasData: GasData;
  title: string;
  description?: string;
}

const DuvalPentagon: React.FC<DuvalPentagonProps> = ({ gasData, title, description }) => {
  const width = 360;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;
  const r = 130; // Bán kính ngũ giác nền

  // --- CẤU HÌNH ĐỈNH NGŨ GIÁC NỀN ---
  // H2 (90), C2H6 (162), CH4 (234), C2H4 (306), C2H2 (18)
  const anglesDeg = [90, 162, 234, 306, 18];
  const labels = ["H2", "C2H6", "CH4", "C2H4", "C2H2"];

  // Hàm helper tính tọa độ đỉnh trên SVG
  const getVertex = (deg: number, radius: number = r) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad) // Flip Y cho SVG
    };
  };

  const V = anglesDeg.map(deg => getVertex(deg));
  const [P_H2, P_C2H6, P_CH4, P_C2H4, P_C2H2] = V;
  const Center = { x: cx, y: cy };

  // --- ĐỊNH NGHĨA CÁC ĐIỂM CẮT (ZONE BOUNDARIES) ---
  // Dựa trên hình ảnh Duval Pentagon 1
  
  // 1. Điểm PD (Hộp nhỏ ngay dưới đỉnh H2)
  // PD chiếm khoảng 24% đường cao từ tâm đến H2?
  // Trong hình, PD là hình chữ nhật hẹp dọc trục H2.
  // Ta vẽ xấp xỉ vùng PD nằm đè lên S và D1
  
  // 2. Điểm phân chia trên các cạnh ngũ giác (Dựa vào hình ảnh)
  // Cạnh C2H6 - CH4 (Trái): Phân chia S và T1
  const Edge_S_T1 = { 
    x: P_C2H6.x + (P_CH4.x - P_C2H6.x) * 0.4, 
    y: P_C2H6.y + (P_CH4.y - P_C2H6.y) * 0.4 
  };
  
  // Cạnh CH4 - C2H4 (Đáy): Phân chia T1/T2 và T2/T3
  // T1 chiếm góc nhỏ, T2 ở giữa, T3 bên phải
  const Edge_T1_T2 = { 
    x: P_CH4.x + (P_C2H4.x - P_CH4.x) * 0.25, 
    y: P_CH4.y + (P_C2H4.y - P_CH4.y) * 0.25 
  };
  const Edge_T2_T3 = { 
    x: P_CH4.x + (P_C2H4.x - P_CH4.x) * 0.55, 
    y: P_CH4.y + (P_C2H4.y - P_CH4.y) * 0.55 
  };

  // Cạnh C2H4 - C2H2 (Phải dưới): Phân chia T3 và D2
  // T3 chiếm một phần nhỏ cạnh đáy phải
  const Edge_T3_D2 = {
    x: P_C2H4.x + (P_C2H2.x - P_C2H4.x) * 0.3,
    y: P_C2H4.y + (P_C2H2.y - P_C2H4.y) * 0.3
  };

  // Cạnh C2H2 - H2 (Phải trên): Phân chia D2 và D1?
  // Thực tế D1 chiếm phần lớn góc phải trên.
  // Đường phân chia D1/D2 xuất phát từ tâm đi ra cạnh C2H2-C2H4 (như hình) 
  // hoặc cạnh C2H4-C2H2. Trong hình Duval 1, D1 nằm trên, D2 nằm dưới.
  // Ranh giới D1/D2 cắt cạnh C2H2-C2H4.
  const Edge_D1_D2 = {
    x: P_C2H2.x + (P_C2H4.x - P_C2H2.x) * 0.35,
    y: P_C2H2.y + (P_C2H4.y - P_C2H2.y) * 0.35
  };

  // Điểm giao nhau trung tâm (Inner Junctions)
  // Các đường ranh giới trong Duval Pentagon 1 hội tụ tại một điểm lệch tâm về phía dưới
  const Inner_Junction = { x: cx, y: cy + 15 }; 
  // Ranh giới S/D1 (Thẳng đứng từ H2 xuống Junction)
  // Ranh giới S/T1 (Ngang sang trái)
  const Inner_S_T1 = { x: cx - 40, y: cy + 10 };

  // --- TẠO PATH CHO CÁC VÙNG ---
  const zones = [
    { // S: Stray Gassing (Góc Lớn Trái Trên)
      label: "S", color: "#a3e635",
      path: `M ${P_H2.x},${P_H2.y} L ${P_C2H6.x},${P_C2H6.y} L ${Edge_S_T1.x},${Edge_S_T1.y} L ${Inner_S_T1.x},${Inner_S_T1.y} L ${Inner_Junction.x},${Inner_Junction.y} L ${P_H2.x},${P_H2.y}`
    },
    { // T1: Thermal < 300 (Góc Trái Dưới)
      label: "T1", color: "#facc15",
      path: `M ${Inner_S_T1.x},${Inner_S_T1.y} L ${Edge_S_T1.x},${Edge_S_T1.y} L ${P_CH4.x},${P_CH4.y} L ${Edge_T1_T2.x},${Edge_T1_T2.y} Z`
    },
    { // T2: Thermal 300-700 (Đáy Trái)
      label: "T2", color: "#fbbf24",
      path: `M ${Inner_S_T1.x},${Inner_S_T1.y} L ${Edge_T1_T2.x},${Edge_T1_T2.y} L ${Edge_T2_T3.x},${Edge_T2_T3.y} L ${Inner_Junction.x},${Inner_Junction.y} Z`
    },
    { // T3: Thermal > 700 (Đáy Phải)
      label: "T3", color: "#ea580c",
      path: `M ${Inner_Junction.x},${Inner_Junction.y} L ${Edge_T2_T3.x},${Edge_T2_T3.y} L ${P_C2H4.x},${P_C2H4.y} L ${Edge_T3_D2.x},${Edge_T3_D2.y} Z`
    },
    { // D2: High Energy Discharge (Phải Dưới)
      label: "D2", color: "#ef4444",
      path: `M ${Inner_Junction.x},${Inner_Junction.y} L ${Edge_T3_D2.x},${Edge_T3_D2.y} L ${Edge_D1_D2.x},${Edge_D1_D2.y} Z`
    },
    { // D1: Low Energy Discharge (Phải Trên - Lớn)
      label: "D1", color: "#34d399",
      path: `M ${Inner_Junction.x},${Inner_Junction.y} L ${Edge_D1_D2.x},${Edge_D1_D2.y} L ${P_C2H2.x},${P_C2H2.y} L ${P_H2.x},${P_H2.y} Z`
    },
    { // PD: Partial Discharge (Hình chữ nhật nhỏ trên trục H2)
      label: "PD", color: "#60a5fa",
      // Vẽ đè lên trên cùng
      path: `M ${cx - 5},${P_H2.y + 10} L ${cx + 5},${P_H2.y + 10} L ${cx + 5},${P_H2.y + 45} L ${cx - 5},${P_H2.y + 45} Z`
    }
  ];

  // Tính điểm dữ liệu
  const point = calculatePentagonCentroid(gasData, cx, cy, r);

  // Đường bao ngũ giác
  const pentagonPath = `M ${V[0].x},${V[0].y} ` + V.slice(1).map(v => `L ${v.x},${v.y}`).join(" ") + " Z";

  return (
    <div className="flex flex-col items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
      <h4 className="text-white font-bold text-lg mb-1">{title}</h4>
      <div className="text-xs text-slate-400 mb-6 text-center h-4">{description}</div>

      <div className="relative w-full flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[360px] overflow-visible">
          <defs>
             <radialGradient id="pentagonGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
             </radialGradient>
          </defs>

          {/* Background Gradient */}
          <path d={pentagonPath} fill="url(#pentagonGrad)" stroke="#475569" strokeWidth="2" />

          {/* VẼ ZONES */}
          {zones.map((z, i) => (
             <path 
                key={i} 
                d={z.path} 
                fill={z.color} 
                fillOpacity="0.4" 
                stroke={z.color} 
                strokeWidth="1"
                className="transition-all hover:fill-opacity-60"
             />
          ))}

          {/* LABELS ZONES */}
          <text x={cx - 50} y={cy - 20} fill="#a3e635" fontSize="12" fontWeight="bold">S</text>
          <text x={cx + 40} y={cy - 30} fill="#34d399" fontSize="12" fontWeight="bold">D1</text>
          <text x={cx + 30} y={cy + 40} fill="#ef4444" fontSize="12" fontWeight="bold">D2</text>
          <text x={cx - 60} y={cy + 50} fill="#facc15" fontSize="10" fontWeight="bold">T1</text>
          <text x={cx - 20} y={cy + 85} fill="#fbbf24" fontSize="10" fontWeight="bold">T2</text>
          <text x={cx + 15} y={cy + 90} fill="#ea580c" fontSize="10" fontWeight="bold">T3</text>
          <text x={cx} y={P_H2.y + 30} fill="#1d4ed8" fontSize="9" fontWeight="bold" textAnchor="middle">PD</text>

          {/* TRỤC KẾT NỐI TÂM */}
          {V.map((v, i) => (
             <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          ))}

          {/* LABELS ĐỈNH */}
          {V.map((v, i) => {
            const labelPos = getVertex(anglesDeg[i], r + 25);
            return (
                <g key={i}>
                    <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
                        {labels[i]}
                    </text>
                    <circle cx={v.x} cy={v.y} r="3" fill="#94a3b8" />
                </g>
            );
          })}

          {/* TÂM */}
          <circle cx={cx} cy={cy} r="2" fill="#fff" />

          {/* ĐIỂM DỮ LIỆU */}
          {point && (
            <>
               <line x1={cx} y1={cy} x2={point.x} y2={point.y} stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
               <circle cx={point.x} cy={point.y} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" className="animate-pulse shadow-lg" />
               <circle cx={point.x} cy={point.y} r="12" fill="#ef4444" opacity="0.3" className="animate-ping" />
            </>
          )}
        </svg>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 justify-center w-full px-2">
         {zones.map((z, i) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded border border-slate-700 bg-slate-900" style={{color: z.color}}>
               {z.label}
            </span>
         ))}
      </div>
    </div>
  );
};

export default DuvalPentagon;