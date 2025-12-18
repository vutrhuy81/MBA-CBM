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

  // 3. Tính Diện tích (A) và Trọng tâm (Cx, Cy)
  let A = 0;
  let Cx_num = 0;
  let Cy_num = 0;
  const n = 5;

  for (let i = 0; i < n; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % n]; 

    const cross = curr.x * next.y - next.x * curr.y; 

    A += cross;
    Cx_num += (curr.x + next.x) * cross;
    Cy_num += (curr.y + next.y) * cross;
  }

  A = A * 0.5;

  // Nếu diện tích quá nhỏ, trả về tâm
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

// Hàm tính vùng lỗi Pentagon (Ước lượng dựa trên góc của trọng tâm)
// Lưu ý: Đây là phép tính gần đúng dựa trên vị trí góc của điểm lỗi
export const getDuvalPentagonAnalysis = (gas: GasData): string => {
  // Tính trọng tâm trong hệ tọa độ Descartes (không scale, không dịch chuyển tâm)
  const sum = gas.H2 + gas.C2H6 + gas.CH4 + gas.C2H4 + gas.C2H2;
  if (sum === 0) return "N/A";

  const gasPercent = [
    (gas.H2 / sum) * 100,
    (gas.C2H6 / sum) * 100,
    (gas.CH4 / sum) * 100,
    (gas.C2H4 / sum) * 100,
    (gas.C2H2 / sum) * 100,
  ];

  const vertices: {x: number, y: number}[] = gasPercent.map((val, i) => {
    const angle = toRad(AXIS_ANGLES[i]);
    return { x: val * Math.cos(angle), y: val * Math.sin(angle) };
  });

  let A = 0;
  let Cx_num = 0;
  let Cy_num = 0;
  const n = 5;

  for (let i = 0; i < n; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % n]; 
    const cross = curr.x * next.y - next.x * curr.y; 
    A += cross;
    Cx_num += (curr.x + next.x) * cross;
    Cy_num += (curr.y + next.y) * cross;
  }
  A = A * 0.5;

  if (Math.abs(A) < 1e-9) return "N/A";

  const cx = Cx_num / (6 * A);
  const cy = Cy_num / (6 * A);

  // Tính góc của vector trọng tâm (0-360 độ)
  let angle = Math.atan2(cy, cx) * 180 / Math.PI;
  if (angle < 0) angle += 360;

  // Phân loại vùng dựa trên góc (Mapping với sơ đồ Duval Pentagon 1)
  // H2 (90), C2H6 (162), CH4 (234), C2H4 (306), C2H2 (18)
  
  if (angle >= 80 && angle < 100) return "PD"; // Khu vực đỉnh H2
  if (angle >= 100 && angle < 190) return "S"; // Giữa H2 và C2H6
  if (angle >= 190 && angle < 240) return "T1"; // Khu vực CH4
  if (angle >= 240 && angle < 280) return "T2"; // Giữa CH4 và C2H4 (đáy)
  if (angle >= 280 && angle < 320) return "T3"; // Khu vực C2H4
  if (angle >= 320 || angle < 10) return "D2"; // Khu vực bên phải
  if (angle >= 10 && angle < 80) return "D1"; // Giữa C2H2 và H2

  return "Undetermined";
}