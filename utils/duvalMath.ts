import { GasData } from "../types";

export interface Point {
  x: number;
  y: number;
}

export interface DuvalResult {
  pA: number; // % CH4 (Top)
  pB: number; // % C2H4 (Right)
  pC: number; // % C2H2 (Left)
  zone: string;
}

// Giữ nguyên hàm tính toán tọa độ cơ bản cho Tam giác
export const calculateDuvalCoordinates = (
  pA: number,
  pB: number,
  pC: number,
  width: number,
  height: number,
  padding: number
): Point => {
  const Ax = width / 2;
  const Ay = padding;
  const Bx = width - padding;
  const By = height - padding;
  const Cx = padding;
  const Cy = height - padding;

  const a = pA / 100;
  const b = pB / 100;
  const c = pC / 100;

  const x = a * Ax + b * Bx + c * Cx;
  const y = a * Ay + b * By + c * Cy;

  return { x, y };
};

export const getDuvalPath = (
  points: { a: number, b: number, c: number }[], 
  width: number, 
  height: number, 
  padding: number
): string => {
  if (points.length === 0) return "";
  const coords = points.map(p => calculateDuvalCoordinates(p.a, p.b, p.c, width, height, padding));
  const start = coords[0];
  let d = `M ${start.x},${start.y}`;
  for (let i = 1; i < coords.length; i++) {
    d += ` L ${coords[i].x},${coords[i].y}`;
  }
  d += " Z";
  return d;
};

// --- DUVAL TRIANGLE 1 (LOGIC CHÍNH XÁC) ---
export const getDuval1Analysis = (gas: GasData): DuvalResult => {
  const sum = gas.CH4 + gas.C2H4 + gas.C2H2;
  if (sum === 0) return { pA: 0, pB: 0, pC: 0, zone: "N/A" };

  const pCH4 = (gas.CH4 / sum) * 100;   // Top
  const pC2H4 = (gas.C2H4 / sum) * 100; // Right
  const pC2H2 = (gas.C2H2 / sum) * 100; // Left

  let zone = "DT"; 

  if (pCH4 >= 98) {
    zone = "PD"; 
  } else if (pC2H2 < 4) {
      if (pC2H4 < 20) zone = "T1";
      else if (pC2H4 < 50) zone = "T2";
      else zone = "T3";
  } else if (pC2H2 >= 13 && pC2H4 < 23) {
      zone = "D1";
  } else if (pC2H4 >= 23 && pC2H2 >= 13) {
      if (pC2H4 >= 40 && pC2H2 < 29) {
          if (pC2H2 < 15) zone = "T3"; 
          else zone = "D2";
      } else {
          zone = "D2";
      }
  } else if (pC2H4 >= 50 && pC2H2 < 15) {
      zone = "T3"; 
  } else {
      zone = "DT";
  }

  return { pA: pCH4, pB: pC2H4, pC: pC2H2, zone };
};

// ==========================================
// 6. DUVAL PENTAGON ANALYSIS (WEIGHTED VECTOR METHOD)
// ==========================================

// Helper: Chuyển độ sang radian
const toRad = (deg: number) => (deg * Math.PI) / 180;

// Góc của các trục khí (Độ)
const AXIS_ANGLES = [
  90,   // H2 (Top)
  162,  // C2H6 (Top Left)
  234,  // CH4 (Bottom Left)
  306,  // C2H4 (Bottom Right)
  18    // C2H2 (Top Right)
];

/**
 * Tính toán điểm lỗi dựa trên phương pháp TRỌNG SỐ VECTOR (Standard Duval Method)
 * Điểm lỗi là trọng tâm của 5 đỉnh ngũ giác, với khối lượng tại mỗi đỉnh 
 * tương ứng với % nồng độ khí đó.
 */
export const calculatePentagonCentroid = (
  gas: GasData,
  cx: number,
  cy: number,
  scale: number
): Point | null => {
  const sum = gas.H2 + gas.C2H6 + gas.CH4 + gas.C2H4 + gas.C2H2;
  if (sum === 0) return null;

  // 1. Tính % từng khí
  const gasPercent = [
    (gas.H2 / sum) * 100,
    (gas.C2H6 / sum) * 100,
    (gas.CH4 / sum) * 100,
    (gas.C2H4 / sum) * 100,
    (gas.C2H2 / sum) * 100,
  ];

  // 2. Tính tọa độ 5 đỉnh của đa giác khí (xi, yi) trên hệ tọa độ Descartes chuẩn
  const vertices: {x: number, y: number}[] = gasPercent.map((val, i) => {
    const angle = toRad(AXIS_ANGLES[i]);
    return {
      x: val * Math.cos(angle),
      y: val * Math.sin(angle)
    };
  });

  // 3. Tính Diện tích (A) và Trọng tâm (Cx, Cy) theo công thức Polygon Centroid
  // Công thức:
  // A = 0.5 * Σ (xi*yi+1 - xi+1*yi)
  // Cx = (1/6A) * Σ (xi + xi+1)(xi*yi+1 - xi+1*yi)
  // Cy = (1/6A) * Σ (yi + yi+1)(xi*yi+1 - xi+1*yi)

  let A = 0;
  let Cx_num = 0;
  let Cy_num = 0;
  const n = 5;

  for (let i = 0; i < n; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % n]; // Quay vòng về 0

    const cross = curr.x * next.y - next.x * curr.y; // (xi*yi+1 - xi+1*yi)

    A += cross;
    Cx_num += (curr.x + next.x) * cross;
    Cy_num += (curr.y + next.y) * cross;
  }

  A = A * 0.5;

  // Nếu diện tích quá nhỏ (đa giác suy biến), trả về tâm
  if (Math.abs(A) < 1e-9) return { x: cx, y: cy };

  const finalCx = Cx_num / (6 * A);
  const finalCy = Cy_num / (6 * A);

  // 4. Chuyển sang tọa độ màn hình (SVG)
  // SVG Y ngược chiều với Descartes Y
  return {
    x: cx + finalCx * scale,
    y: cy - finalCy * scale 
  };
};
