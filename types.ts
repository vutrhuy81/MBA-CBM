
export type Language = 'en' | 'vi';

export type ModelType = 'gbdt' | 'fasttree';

export type TabType = 'gemini' | 'proposed' | 'health' | 'manual' | 'logs';

export interface GasData {
  H2: number;
  CH4: number;
  C2H6: number;
  C2H4: number;
  C2H2: number;
  // New gases for Health Index
  CO: number;
  CO2: number;
  O2: number;
  N2: number;
}

export interface DiagnosisResult {
  faultType: string;
  confidence: string; // High, Medium, Low
  severity: string; // Normal, Caution, Critical
  description: string;
  recommendation: string;
  keyGasRatios: {
    ratioName: string;
    value: number;
    interpretation: string;
  }[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface HealthIndexResult {
  TDCG: number;
  CO2_CO_Ratio: number;
  DGAF: number;
  HI_DGAF: number;
  HI_FF: number;
  gbdtFault: string; // The fault predicted by GBDT used for HI_FF
  
  // New Indices
  LEDTF: number;
  PIF1: number;
  PIF2: number;
  PIF: number;

  finalHI: number; 
  condition: string;
  
  details: {
      gas: string;
      value: number;
      score: number;
      weight: number;
      weightedScore: number;
  }[];
}

export interface LogEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}
