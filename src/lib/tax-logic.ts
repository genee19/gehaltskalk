export interface TaxSettings {
  taxClass: number; // 1-6
  churchTax: boolean; // true/false
  kvType: 'public' | 'private';
  kvAddOn: number; // Zusatzbeitrag percentage (e.g. 1.7)
  kvPrivateAmount?: number; // Monthly payment if private
  hasChildren: boolean; // for PV
  childCount: number; // for PV reduction
  state: 'west' | 'east' | string; // for RV limits (West/East usually differ)
  age: number; // for PV surcharge (usually > 23 without kids)
}

export interface TaxResult {
  grossYearly: number;
  netYearly: number;
  taxes: {
    lohnsteuer: number;
    soli: number;
    church: number;
    total: number;
  };
  social: {
    rv: number;
    av: number;
    kv: number;
    pv: number;
    total: number;
  };
}

// 2026 Official Constants
const CONSTANTS = {
  GFB: 12096, // Grundfreibetrag
  SOLI_LIMIT: 18130, // Soli Freigrenze (tax amount, roughly)
  KIRCHE_RATE: 0.09, // Usually 9%, 8% in Bayern/BW
  
  // Social Security (Employee Share)
  RV_RATE: 0.093, // 18.6% total / 2
  AV_RATE: 0.013, // 2.6% total / 2
  KV_RATE_BASE: 0.073, // 14.6% total / 2
  // Average Zusatzbeitrag 2026: 2.9% total -> 1.45% employee share
  // So total employee KV rate with average addon = 7.3% + 1.45% = 8.75%
  
  // PV 2026 (Pflegeversicherung)
  // Base: 3.4% total -> 1.7% employee (with children)
  // Surcharge for childless > 23: +0.7% employee = 2.4% total
  // Relief for children: -0.25% per child (from 2nd to 5th)
  PV_RATE_BASE: 0.017,
  PV_CHILDLESS_SURCHARGE: 0.007, // 0.7% for childless > 23
  
  // Caps (Beitragsbemessungsgrenzen) - Yearly
  BBG_KV: 69750, // 5812.50€/month * 12 for 2026
  BBG_RV_WEST: 96600, // for 2026
  BBG_RV_EAST: 96600, // aligned with West in 2026
};

export function calculateTaxes(grossYearly: number, settings: TaxSettings): TaxResult {
  const { taxClass, churchTax, kvType, kvAddOn, state, age, hasChildren, childCount } = settings;
  
  // --- Social Security ---
  let social = { rv: 0, av: 0, kv: 0, pv: 0, total: 0 };
  
  if (grossYearly > 0) {
    const bbgRv = state === 'east' ? CONSTANTS.BBG_RV_EAST : CONSTANTS.BBG_RV_WEST;
    const bbgKv = CONSTANTS.BBG_KV;
    
    // RV & AV
    const rvAvBase = Math.min(grossYearly, bbgRv);
    social.rv = rvAvBase * CONSTANTS.RV_RATE;
    social.av = rvAvBase * CONSTANTS.AV_RATE;
    
    // KV
    if (kvType === 'public') {
      const kvBase = Math.min(grossYearly, bbgKv);
      const kvRate = CONSTANTS.KV_RATE_BASE + (kvAddOn / 100 / 2);
      social.kv = kvBase * kvRate;
      
      // PV
      let pvRate = CONSTANTS.PV_RATE_BASE;
      if (age > 23 && !hasChildren) {
        pvRate += CONSTANTS.PV_CHILDLESS_SURCHARGE;
      }
      // Child relief (simplified)
      if (childCount >= 2) {
        const relief = Math.min(childCount - 1, 4) * 0.0025;
        pvRate -= relief; 
        if (pvRate < 0) pvRate = 0; // Should not happen usually
      }
      
      // In Sachsen PV is different (omitted for simplicity unless requested)
      social.pv = kvBase * pvRate;
    } else {
      // Private KV
      social.kv = (settings.kvPrivateAmount || 0) * 12; // Assuming monthly input
      social.pv = 0; // Usually included in private amount or separate
    }
    
    social.total = social.rv + social.av + social.kv + social.pv;
  }

  // --- Tax ---
  // Simplified Taxable Income (ZV)
  // ZV = Gross - Social (partially deductible) - Werbungskosten (1230 flat) - Sonderausgaben
  // This is a VERY simplified estimation.
  // In reality: Vorsorgeaufwendungen are deductible up to limits.
  // We will assume a standard deduction simulation.
  
  // Step 1: Deduct Vorsorgeaufwendungen (Social Security)
  // RV is 100% tax deductible in 2026.
  // KV/PV is deductible (basis absicherung).
  const deductibleSocial = social.rv + social.kv + social.pv + social.av; // Simplified
  const werbungskosten = 1230; 
  const sonderausgaben = 36; // Pauschale
  
  let zv = grossYearly - deductibleSocial - werbungskosten - sonderausgaben;
  
  // Children allowance (Kinderfreibetrag) only for Soli/Church, not for Lohnsteuer (usually Kindergeld is better)
  // But for high income, it matters. We ignore Günstigerprüfung for now.
  
  if (taxClass === 3) zv = zv * 0.6; // Rough approximation for splitting? No, StK 3 is simpler.
  // Actually StK 3/5 is complex.
  // Let's use the tariff formula on ZV.
  
  // Tax Class Logic Adjustment (Simulated)
  let taxableBase = zv;
  if (taxableBase < 0) taxableBase = 0;

  // Lohnsteuer Tariff 2026 (Linear-Progressive)
  // We use the 2024/25 style formulas
  let lohnsteuer = calculateLohnsteuerFormula(taxableBase);
  
  // Adjust for Tax Classes
  if (taxClass === 3) lohnsteuer *= 0.6; // Very rough
  if (taxClass === 5) lohnsteuer *= 1.6; // Very rough
  if (taxClass === 2) lohnsteuer *= 0.95; // Entlastungsbetrag
  
  // Cap at 45% effective (simplified)
  if (lohnsteuer > grossYearly * 0.45) lohnsteuer = grossYearly * 0.45;
  
  // Soli
  let soli = 0;
  // Soli limit is high now.
  if (lohnsteuer > CONSTANTS.SOLI_LIMIT) {
     soli = lohnsteuer * 0.055;
  }
  
  // Church
  let church = 0;
  if (churchTax) {
    church = lohnsteuer * CONSTANTS.KIRCHE_RATE;
  }
  
  const taxes = {
    lohnsteuer,
    soli,
    church,
    total: lohnsteuer + soli + church
  };
  
  const netYearly = grossYearly - social.total - taxes.total;
  
  return {
    grossYearly,
    netYearly,
    taxes,
    social
  };
}

function calculateLohnsteuerFormula(zv: number): number {
   // 2026 estimated zones
   // Zone 1: < 12096 -> 0
   // Zone 2: 12096 - 17500 -> 14% to 24%
   // Zone 3: 17500 - 68500 -> 24% to 42%
   // Zone 4: 68500 - 277825 -> 42%
   // Zone 5: > 277825 -> 45%
   
   if (zv <= 12096) return 0;
   
   if (zv <= 17500) {
     const y = (zv - 12096) / 10000;
     return (974.58 * y + 1400) * y; // Generic polynomial form
   }
   
   if (zv <= 68500) {
     const z = (zv - 17500) / 10000;
     return (212.02 * z + 2397) * z + 950.96; // Generic form
   }
   
   if (zv <= 277825) {
     return 0.42 * zv - 10600; // Linear
   }
   
   return 0.45 * zv - 18900;
}

// Inverse Calculation (Target Net -> Required Gross)
// Uses Binary Search
export function calculateGrossFromNet(targetNet: number, settings: TaxSettings): number {
  let low = targetNet;
  let high = targetNet * 3; // Initial guess upper bound
  let tolerance = 1; // 1 Euro
  let steps = 0;
  
  // Expand high if needed
  while (calculateTaxes(high, settings).netYearly < targetNet) {
    high *= 1.5;
    steps++;
    if (steps > 20) break; // Safety
  }
  
  // Binary search
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const res = calculateTaxes(mid, settings);
    
    if (Math.abs(res.netYearly - targetNet) < tolerance) {
      return mid;
    }
    
    if (res.netYearly < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return low;
}
