
export type Language = 'en' | 'vi';

export interface GasData {
  H2: number;
  CH4: number;
  C2H6: number;
  C2H4: number;
  C2H2: number;
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
