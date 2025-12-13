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

// Giữ nguyên hàm tính toán tọa độ cơ bản
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

  let zone = "DT"; // Mặc định là vùng hỗn hợp (DT) để tránh lọt khe

  if (pCH4 >= 98) {
    zone = "PD"; 
  } else if (pC2H2 < 4) {
      // Dãy Thermal phía trên
      if (pC2H4 < 20) zone = "T1";
      else if (pC2H4 < 50) zone = "T2";
      else zone = "T3";
  } else if (pC2H2 >= 13 && pC2H4 < 23) {
      // Góc trái dưới
      zone = "D1";
  } else if (pC2H4 >= 23 && pC2H2 >= 13) {
      // Góc phải dưới (D2)
      // Lưu ý: D2 nằm dưới đường nối m(13% C2H2) -> l(13% C2H2) -> k(29% C2H2)
      // Logic đơn giản hóa: Vùng góc phải dưới chủ yếu là D2
      // Nếu cần chính xác tuyệt đối theo đường gấp khúc l-k:
      if (pC2H4 >= 40 && pC2H2 < 29) {
          // Khu vực bên phải đường dọc l-k (C2H4=40%)
          // Kiểm tra xem nó thuộc D2 hay T3/DT
          // T3 cắt ở C2H2=15%. D2 ở dưới 15%.
          if (pC2H2 < 15) zone = "T3"; // Phần đuôi T3
          else zone = "D2";
      } else {
          zone = "D2";
      }
  } else if (pC2H4 >= 50 && pC2H2 < 15) {
      zone = "T3"; // Phần mở rộng của T3 xuống dưới
  } else {
      // Tất cả phần còn lại ở giữa (bao gồm vùng tím và đen cũ) là DT
      zone = "DT";
  }

  return { pA: pCH4, pB: pC2H4, pC: pC2H2, zone };
};

// ==========================================
// 6. DUVAL PENTAGON ANALYSIS (CENTROID METHOD)
// ==========================================

// Helper: Chuyển độ sang radian
const toRad = (deg: number) => (deg * Math.PI) / 180;

// Các góc trục chuẩn của Duval Pentagon (H2 ở đỉnh 90 độ)
// Thứ tự ngược chiều kim đồng hồ: H2 -> C2H6 -> CH4 -> C2H4 -> C2H2
const PENTAGON_AXES = [
  90,   // H2 (Top)
  162,  // C2H6 (Top Left)
  234,  // CH4 (Bottom Left)
  306,  // C2H4 (Bottom Right)
  18    // C2H2 (Top Right - 360+18=378)
];

/**
 * Tính toán điểm lỗi dựa trên công thức CENTROID (Trọng tâm đa giác)
 * Công thức: Cx = (1/6A) * Σ (xi + xi+1)(xi*yi+1 - xi+1*yi)
 */
export const calculatePentagonCentroid = (
  gas: GasData,
  cx: number,
  cy: number,
  radius: number
): Point | null => {
  const sum = gas.H2 + gas.C2H6 + gas.CH4 + gas.C2H4 + gas.C2H2;
  if (sum === 0) return null;

  // 1. Tính % từng khí (Normalized 0-1)
  // Thứ tự bắt buộc: H2 -> C2H6 -> CH4 -> C2H4 -> C2H2
  const values = [
    gas.H2 / sum,
    gas.C2H6 / sum,
    gas.CH4 / sum,
    gas.C2H4 / sum,
    gas.C2H2 / sum,
  ];

  // 2. Xác định tọa độ 5 đỉnh của "ngũ giác khí" trên hệ trục Descartes
  const vertices: Point[] = values.map((val, i) => {
    const angle = toRad(PENTAGON_AXES[i]);
    return {
      x: val * radius * Math.cos(angle), 
      y: val * radius * Math.sin(angle) 
    };
  });

  // 3. Áp dụng công thức Shoelace để tính Diện tích (A) và Trọng tâm (Cx, Cy)
  let A = 0;
  let Cx_num = 0; 
  let Cy_num = 0; 

  const n = 5;
  for (let i = 0; i < n; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % n]; // Điểm tiếp theo (vòng lại 0)

    const crossProduct = curr.x * next.y - next.x * curr.y;

    A += crossProduct;
    Cx_num += (curr.x + next.x) * crossProduct;
    Cy_num += (curr.y + next.y) * crossProduct;
  }

  A = A * 0.5; // Diện tích có dấu

  // Tránh chia cho 0
  if (Math.abs(A) < 1e-9) return { x: cx, y: cy };

  const finalCx = (1 / (6 * A)) * Cx_num;
  const finalCy = (1 / (6 * A)) * Cy_num;

  // 4. Chuyển đổi từ hệ tọa độ Descartes sang SVG (Lật trục Y)
  return {
    x: cx + finalCx,       
    y: cy - finalCy        // Flip Y cho SVG
  };
};