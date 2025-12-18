
import { GasData, HealthIndexResult } from "../types";

// --- CONSTANTS ---

// HI (FF) Mapping based on GBDT result
const HI_FF_MAPPING: Record<string, number> = {
    "N": 1,
    "PD": 0.8,
    "T1": 0.7,
    "D1": 0.6,
    "T2": 0.4,
    "T3": 0.3,
    "D2": 0.2,
    "DT": 0.1
};

// Weight configuration from the provided table
const WEIGHTS = {
    H2: 3,
    CH4: 2,
    C2H6: 2,
    C2H4: 4,
    C2H2: 6,
    CO: 3,
    CO2: 2,
    TDCG: 3
};

// Score Table Logic
const getScore = (key: keyof typeof WEIGHTS, value: number): number => {
    switch (key) {
        case 'H2':
            if (value <= 100) return 1;
            if (value <= 200) return 2;
            if (value <= 300) return 3;
            if (value <= 500) return 4;
            if (value <= 700) return 5;
            return 6;
        case 'CH4':
            if (value <= 75) return 1;
            if (value <= 125) return 2;
            if (value <= 200) return 3;
            if (value <= 400) return 4;
            if (value <= 600) return 5;
            return 6;
        case 'C2H6':
            if (value <= 65) return 1;
            if (value <= 80) return 2;
            if (value <= 100) return 3;
            if (value <= 120) return 4;
            if (value <= 150) return 5;
            return 6;
        case 'C2H4':
            if (value <= 50) return 1;
            if (value <= 80) return 2;
            if (value <= 100) return 3;
            if (value <= 150) return 4;
            if (value <= 200) return 5;
            return 6;
        case 'C2H2':
            if (value <= 3) return 1;
            if (value <= 7) return 2;
            if (value <= 35) return 3;
            if (value <= 50) return 4;
            if (value <= 80) return 5;
            return 6;
        case 'CO':
            if (value <= 350) return 1;
            if (value <= 700) return 2;
            if (value <= 900) return 3;
            if (value <= 1100) return 4;
            if (value <= 1400) return 5;
            return 6;
        case 'CO2':
            if (value <= 2500) return 1;
            if (value <= 3000) return 2;
            if (value <= 4000) return 3;
            if (value <= 5000) return 4;
            if (value <= 7000) return 5;
            return 6;
        case 'TDCG':
            if (value <= 690) return 1;
            if (value <= 1251) return 2;
            if (value <= 1785) return 3;
            if (value <= 2720) return 4;
            if (value <= 4360) return 5;
            return 6;
        default:
            return 1;
    }
};

// --- NEW CALCULATIONS ---

const calculateLEDTF = (gasData: GasData): number => {
    const sum = gasData.H2 + gasData.CH4 + gasData.CO;
    
    // Condition 1: If sum is 0
    if (sum === 0) return 0.8;

    const term1 = (gasData.H2 / sum) + 0.5 * (gasData.CH4 / sum);
    const term2 = (Math.sqrt(3) / 2) * (gasData.CH4 / sum);
    
    const calculation = Math.sqrt(Math.pow(term1, 2) + Math.pow(term2, 2));

    // Condition 2 & 3
    if (calculation <= 0.13) {
        return 0.7;
    } else {
        return 0.25;
    }
};

const calculatePIF1 = (gasData: GasData): number => {
    const CO = gasData.CO;
    const CO2 = gasData.CO2;
    
    // Prevent division by zero
    const ratio = CO === 0 ? 0 : CO2 / CO;

    if (CO > 500 && CO2 > 5000) {
        // Logic: IF(CO>350,1,0.8). Since CO > 500 implies CO > 350, this always returns 1.
        return CO > 350 ? 1 : 0.8; 
    } else {
        // Else branch
        if (ratio > 7) return 0.6;
        if (ratio >= 5) return 0.4;
        return 0.2;
    }
};

const calculatePIF2 = (gasData: GasData): number => {
    const CO = gasData.CO;
    const CO2 = gasData.CO2;
    const ratio = CO === 0 ? 0 : CO2 / CO;

    if (ratio <= 7.4) return 0.8;
    if (ratio > 7.4 && ratio <= 8) return 0.6;
    if (ratio > 8 && ratio <= 8.7) return 0.4;
    if (ratio > 8.7) return 0.2;
    
    return 0; // Should not happen given logic cover
};

export const calculateHealthIndex = (gasData: GasData, gbdtFault: string): HealthIndexResult => {
    // 1. Calculate TDCG = H2+CH4+C2H6+C2H4+C2H2+CO
    const TDCG = gasData.H2 + gasData.CH4 + gasData.C2H6 + gasData.C2H4 + gasData.C2H2 + gasData.CO;

    // 2. Calculate CO2/CO Ratio
    const CO2_CO_Ratio = gasData.CO === 0 ? 0 : parseFloat((gasData.CO2 / gasData.CO).toFixed(2));

    // 3. Calculate Scores (Si) and Weighted Scores (Si * Wi)
    const params = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO', 'CO2', 'TDCG'] as const;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;

    const details = params.map(param => {
        const val = param === 'TDCG' ? TDCG : gasData[param];
        const score = getScore(param, val);
        const weight = WEIGHTS[param];
        const weightedScore = score * weight;

        totalWeightedScore += weightedScore;
        totalWeight += weight;

        return {
            gas: param,
            value: val,
            score,
            weight,
            weightedScore
        };
    });

    // 4. Calculate DGAF
    const DGAF = parseFloat((totalWeightedScore / totalWeight).toFixed(2));

    // 5. Calculate HI (DGAF)
    let HI_DGAF = 0.2;
    if (DGAF < 1.2) {
        HI_DGAF = 1;
    } else if (DGAF < 1.5) {
        HI_DGAF = 0.8;
    } else if (DGAF < 2) {
        HI_DGAF = 0.6;
    } else if (DGAF < 2.5) {
        HI_DGAF = 0.4;
    } else {
        HI_DGAF = 0.2;
    }

    // 6. Calculate HI (FF)
    const HI_FF = HI_FF_MAPPING[gbdtFault] || 0.1;

    // 7. Calculate New Indices
    const LEDTF = parseFloat(calculateLEDTF(gasData).toFixed(2));
    const PIF1 = parseFloat(calculatePIF1(gasData).toFixed(2));
    const PIF2 = parseFloat(calculatePIF2(gasData).toFixed(2));
    const PIF = parseFloat((PIF1 * 0.6 + PIF2 * 0.4).toFixed(2));

    // 8. Calculate Final HI
    // HI (Final) = HI (DGAF)*0.5+HI (FF)*0.3+HI (LEDTF)*0.1+HI (PIF)*0.1
    // Scale: The sub-indices are 0-1. The Final condition thresholds are 85, 70 etc.
    // So we multiply by 100 to get a 0-100 scale.
    const rawFinal = (HI_DGAF * 0.5) + (HI_FF * 0.3) + (LEDTF * 0.1) + (PIF * 0.1);
    const finalHI = parseFloat((rawFinal * 100).toFixed(2));

    // 9. Determine Condition
    let condition = "Out of range";
    if (finalHI >= 85) {
        condition = "Very Good";
    } else if (finalHI >= 70) {
        condition = "Good";
    } else if (finalHI >= 50) {
        condition = "Need Caution";
    } else if (finalHI >= 30) {
        condition = "Poor";
    } else if (finalHI >= 0) {
        condition = "Very Poor";
    }

    return {
        TDCG,
        CO2_CO_Ratio,
        details,
        DGAF,
        HI_DGAF,
        HI_FF,
        gbdtFault,
        LEDTF,
        PIF1,
        PIF2,
        PIF,
        finalHI,
        condition
    };
};
