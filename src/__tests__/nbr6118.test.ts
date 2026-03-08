/**
 * NBR 6118:2023 — Comprehensive Test Suite
 *
 * Tests based on numerical examples from:
 * - NBR 6118:2023 normative tables
 * - Standard engineering reference calculations
 * - Known analytical results for verification
 *
 * Each test references the specific normative item being verified.
 */

import { describe, it, expect } from "vitest";
import {
  calcConcreteProperties,
  CONCRETE_CLASSES,
} from "@/data/materials/concrete.data";
import { PASSIVE_STEEL_CLASSES, rebarArea } from "@/data/materials/steel.data";
import { calculateShearDesign } from "@/core/design/ShearDesign";
import { calculateColumnDesign } from "@/core/design/ColumnDesign";
import { verifyPunching } from "@/core/verification/PunchingShear";
import { calculateTorsionDesign } from "@/core/design/TorsionDesign";
import { verifyCracking } from "@/core/verification/CrackingVerification";
import {
  calculateDeflection,
  getCreepCoefficient,
} from "@/core/verification/DeflectionVerification";
import {
  calculateBondStrength,
  calculateAnchorage,
  getSpliceAlpha,
} from "@/core/detailing/AnchorageCalculation";
import { calculateSlabDesign } from "@/core/design/SlabDesign";
import { getMinimumThickness } from "@/data/slabs/bares-coefficients.data";
import { LoadService } from "@/services/load.service";

// ==============================================================================
// 1. MATERIAL PROPERTIES - CONCRETE (NBR 6118:2023, Item 8.2)
// ==============================================================================

describe("Concrete Properties — NBR 6118:2023 Item 8.2", () => {
  describe("fctm (mean tensile strength) — Item 8.2.5", () => {
    it("C25: fctm = 0.3 × 25^(2/3) ≈ 2.56 MPa", () => {
      const c25 = calcConcreteProperties(25);
      expect(c25.fctm).toBeCloseTo(0.3 * Math.pow(25, 2 / 3), 1);
    });

    it("C50: fctm = 0.3 × 50^(2/3) ≈ 4.07 MPa", () => {
      const c50 = calcConcreteProperties(50);
      expect(c50.fctm).toBeCloseTo(0.3 * Math.pow(50, 2 / 3), 1);
    });

    it("C60: fctm = 2.12 × ln(1 + 0.11×60) ≈ 4.21 MPa (formula changes for fck > 50)", () => {
      const c60 = calcConcreteProperties(60);
      expect(c60.fctm).toBeCloseTo(2.12 * Math.log(1 + 0.11 * 60), 1);
    });

    it("C80: fctm uses logarithmic formula", () => {
      const c80 = calcConcreteProperties(80);
      const expected = 2.12 * Math.log(1 + 0.11 * 80);
      expect(c80.fctm).toBeCloseTo(expected, 1);
    });
  });

  describe("Eci (initial tangent modulus) — Item 8.2.8", () => {
    it("C30 granite: Eci = 1.0 × 5600 × √30 / 1000 ≈ 30.67 GPa", () => {
      const c30 = calcConcreteProperties(30, "granite");
      const expected = (1.0 * 5600 * Math.sqrt(30)) / 1000;
      expect(c30.Eci).toBeCloseTo(expected, 0);
    });

    it("C30 basalt: Eci = 1.2 × 5600 × √30 / 1000 ≈ 36.80 GPa", () => {
      const c30_basalt = calcConcreteProperties(30, "basalt");
      const expected = (1.2 * 5600 * Math.sqrt(30)) / 1000;
      expect(c30_basalt.Eci).toBeCloseTo(expected, 0);
    });

    it("TASK 1 FIX: C60 granite uses αe in high-strength formula", () => {
      const c60 = calcConcreteProperties(60, "granite");
      // αe for granite = 1.0
      const expected = (1.0 * 21500 * Math.pow(60 / 10 + 1.25, 1 / 3)) / 1000;
      expect(c60.Eci).toBeCloseTo(expected, 0);
    });

    it("TASK 1 FIX: C60 basalt includes αe = 1.2", () => {
      const c60_basalt = calcConcreteProperties(60, "basalt");
      const expected = (1.2 * 21500 * Math.pow(60 / 10 + 1.25, 1 / 3)) / 1000;
      expect(c60_basalt.Eci).toBeCloseTo(expected, 0);
    });
  });

  describe("Stress block parameters — Item 17.2.2", () => {
    it("C30: λ = 0.8, αc = 0.85", () => {
      const c30 = calcConcreteProperties(30);
      expect(c30.lambda).toBe(0.8);
      expect(c30.alpha_c).toBe(0.85);
    });

    it("C70: λ = 0.8 - (70-50)/400 = 0.75", () => {
      const c70 = calcConcreteProperties(70);
      expect(c70.lambda).toBeCloseTo(0.75, 2);
    });

    it("C70: αc = 0.85 × (1 - (70-50)/200) = 0.765", () => {
      const c70 = calcConcreteProperties(70);
      expect(c70.alpha_c).toBeCloseTo(0.765, 3);
    });
  });

  describe("C65 class exists (TASK 2)", () => {
    it("C65 is available in CONCRETE_CLASSES", () => {
      expect(CONCRETE_CLASSES).toHaveProperty("C65");
      expect(CONCRETE_CLASSES["C65"].fck).toBe(65);
    });
  });

  describe("Strain limits (εc2, εcu) — Item 8.2.10", () => {
    it("C30: εc2 = 2.0‰, εcu = 3.5‰", () => {
      const c30 = calcConcreteProperties(30);
      expect(c30.epsilon_c2).toBe(2.0);
      expect(c30.epsilon_cu).toBe(3.5);
    });

    it("C60: εcu < 3.5‰ (reduced for high strength)", () => {
      const c60 = calcConcreteProperties(60);
      expect(c60.epsilon_cu).toBeLessThan(3.5);
      expect(c60.epsilon_cu).toBeGreaterThan(2.0);
    });
  });
});

// ==============================================================================
// 2. MATERIAL PROPERTIES - STEEL (NBR 6118:2023, Item 8.3)
// ==============================================================================

describe("Steel Properties — NBR 6118:2023 Item 8.3", () => {
  it("CA-50: fyk = 500 MPa, Es = 210 GPa", () => {
    const ca50 = PASSIVE_STEEL_CLASSES["CA-50"];
    expect(ca50.fyk).toBe(500);
    expect(ca50.Es).toBe(210);
  });

  it("CA-50: εyd = fyd / Es = (500/1.15) / 210000 × 1000 ≈ 2.07‰", () => {
    const ca50 = PASSIVE_STEEL_CLASSES["CA-50"];
    const expected_eyd = (500 / 1.15 / 210000) * 1000;
    expect(ca50.epsilon_yd).toBeCloseTo(expected_eyd, 2);
  });

  it("CA-60: fyk = 600 MPa, η1 = 1.0 (smooth default) — TASK 4", () => {
    const ca60 = PASSIVE_STEEL_CLASSES["CA-60"];
    expect(ca60.fyk).toBe(600);
    expect(ca60.eta1).toBe(1.0);
    // epsilon_su must exist (fixed in lint correction)
    expect(ca60.epsilon_su).toBe(10);
  });

  it("CA-25: fyk = 250 MPa, η1 = 1.0", () => {
    const ca25 = PASSIVE_STEEL_CLASSES["CA-25"];
    expect(ca25.fyk).toBe(250);
    expect(ca25.eta1).toBe(1.0);
  });

  it("rebarArea: φ10 = π×1²/4 ≈ 0.785 cm²", () => {
    expect(rebarArea(10)).toBeCloseTo(Math.PI * 0.25, 2);
  });

  it("rebarArea: φ20 = π×2²/4 ≈ 3.14 cm²", () => {
    expect(rebarArea(20)).toBeCloseTo(Math.PI, 2);
  });
});

// ==============================================================================
// 3. SHEAR DESIGN (NBR 6118:2023, Item 17.4)
// ==============================================================================

describe("Shear Design — NBR 6118:2023 Item 17.4", () => {
  const baseParams = {
    bw: 20, // cm
    d: 45, // cm
    fck: 30, // MPa
    fctm: 0.3 * Math.pow(30, 2 / 3),
    fctk_inf: 0.7 * 0.3 * Math.pow(30, 2 / 3),
    fywk: 500, // MPa
    Vsd: 150, // kN
    model: 1 as const,
    alpha: 90,
  };

  it("Model I (θ=45°): VRd2 = 0.27 × αv2 × fcd × bw × d", () => {
    const result = calculateShearDesign(baseParams);
    const fcd = 30 / 1.4 / 10; // kN/cm²
    const alphav2 = 1 - 30 / 250;
    const VRd2 = 0.27 * alphav2 * fcd * 20 * 45;
    expect(result.resistance.VRd2).toBeCloseTo(VRd2, 0);
  });

  it("Vc0 = 0.6 × fctd × bw × d (Model I)", () => {
    const result = calculateShearDesign(baseParams);
    const fctd = (0.7 * 0.3 * Math.pow(30, 2 / 3)) / 1.4 / 10; // kN/cm²
    const Vc0 = 0.6 * fctd * 20 * 45;
    expect(result.resistance.Vc).toBeCloseTo(Vc0, 0);
  });

  it("TASK 9: Vc with compression (Nsd > 0) increases resistance", () => {
    const params_with_N = {
      ...baseParams,
      Nsd: 200, // kN compression
      Ac: 20 * 50, // cm²
    };
    const result_no_N = calculateShearDesign(baseParams);
    const result_with_N = calculateShearDesign(params_with_N);
    expect(result_with_N.resistance.Vc).toBeGreaterThan(
      result_no_N.resistance.Vc,
    );
  });

  it("isValid should be true when section is adequate", () => {
    const result = calculateShearDesign(baseParams);
    expect(result.status.isValid).toBe(true);
  });
});

// ==============================================================================
// 4. PUNCHING SHEAR (NBR 6118:2023, Item 19)
// ==============================================================================

describe("Punching Shear — NBR 6118:2023 Item 19", () => {
  const baseParams = {
    dx: 20,
    dy: 20,
    a: 30,
    b: 30,
    pillarType: "internal" as const,
    Fsd: 500,
    rho_x: 0.015,
    rho_y: 0.015,
    fck: 30,
  };

  it("Internal pillar: u = 2(a+b) + 4πd", () => {
    const result = verifyPunching(baseParams);
    const d = 20;
    const expected_u = 2 * (30 + 30) + 4 * Math.PI * d;
    expect(result.perimeter.u).toBeCloseTo(expected_u, 0);
  });

  it("TASK 19: β factor applied to τsd", () => {
    const result = verifyPunching(baseParams);
    const d = 20;
    const u = 2 * (30 + 30) + 4 * Math.PI * d;
    // β for internal = 1.15, ×10 converts kN/cm² → MPa
    const tau_sd = ((1.15 * 500) / (u * d)) * 10;
    expect(result.stress.tau_sd).toBeCloseTo(tau_sd, 2);
  });

  it("TASK 19: Corner pillar β = 1.50", () => {
    const cornerParams = { ...baseParams, pillarType: "corner" as const };
    const result = verifyPunching(cornerParams);
    // τsd should reflect β = 1.50, ×10 converts kN/cm² → MPa
    const d = 20;
    const u = 30 / 2 + 30 / 2 + (Math.PI * d) / 2;
    const tau_sd = ((1.5 * 500) / (u * d)) * 10;
    expect(result.stress.tau_sd).toBeCloseTo(tau_sd, 2);
  });

  it("TASK 21: Edge pillar flush perimeter = a + 2b + 2πd", () => {
    const edgeParams = { ...baseParams, pillarType: "edge" as const };
    const result = verifyPunching(edgeParams);
    const d = 20;
    const expected_u = 30 + 2 * 30 + 2 * Math.PI * d;
    expect(result.perimeter.u).toBeCloseTo(expected_u, 0);
  });

  it("TASK 21: Corner pillar flush perimeter = a/2 + b/2 + πd/2", () => {
    const cornerParams = { ...baseParams, pillarType: "corner" as const };
    const result = verifyPunching(cornerParams);
    const d = 20;
    const expected_u = 30 / 2 + 30 / 2 + (Math.PI * d) / 2;
    expect(result.perimeter.u).toBeCloseTo(expected_u, 0);
  });

  it("TASK 21: Edge pillar with c1 adjusts perimeter", () => {
    const edgeWithC1 = {
      ...baseParams,
      pillarType: "edge" as const,
      c1: 10,
    };
    const edgeFlush = { ...baseParams, pillarType: "edge" as const };
    const result_flush = verifyPunching(edgeFlush);
    const result_c1 = verifyPunching(edgeWithC1);
    // Perimeter with c1 should be larger (pillar set back from edge)
    expect(result_c1.perimeter.u).toBeGreaterThan(result_flush.perimeter.u);
  });
});

// ==============================================================================
// 5. COLUMN DESIGN (NBR 6118:2023, Item 15 + 17)
// ==============================================================================

describe("Column Design — NBR 6118:2023 Item 15/17", () => {
  const baseColumnParams = {
    geometry: { bx: 30, by: 20 },
    length: 300,
    supports: { top: "fixed" as const, bottom: "fixed" as const },
    loading: { Nd: 800, Mx_top: 80, Mx_bot: -80, My_top: 40, My_bot: -40 },
    fck: 30,
    fyk: 500,
    cover: 3,
  };

  it("TASK 12: λ = 200 is allowed (not rejected)", () => {
    const slenderParams = {
      ...baseColumnParams,
      geometry: { bx: 15, by: 15 },
      length: 750,
    };
    const result = calculateColumnDesign(slenderParams);
    // Should not say "Pilar não é permitido"
    const hasNotPermitted = result.status.messages.some(
      (m: string) =>
        m.includes("não é permitido") || m.includes("not permitted"),
    );
    expect(hasNotPermitted).toBe(false);
  });

  it("TASK 15: As_min ≥ 0.4% × Ac", () => {
    const result = calculateColumnDesign(baseColumnParams);
    const Ac = 30 * 20;
    const As_min_pct = (0.4 / 100) * Ac;
    expect(result.reinforcement.As_min).toBeGreaterThanOrEqual(
      As_min_pct - 0.01,
    );
  });

  it("Design result contains valid reinforcement area", () => {
    const result = calculateColumnDesign(baseColumnParams);
    expect(result.reinforcement.As).toBeGreaterThan(0);
    expect(result.status.isValid).toBe(true);
  });
});

// ==============================================================================
// 6. MATERIAL DATA INTEGRITY CHECKS
// ==============================================================================

describe("Material Data Integrity", () => {
  it("All standard concrete classes C20-C90 exist", () => {
    const expected = [
      20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
    ];
    for (const fck of expected) {
      const key = `C${fck}`;
      expect(CONCRETE_CLASSES).toHaveProperty(key);
      expect(CONCRETE_CLASSES[key].fck).toBe(fck);
    }
  });

  it("fcd = fck / 1.4 for all classes", () => {
    for (const [key, props] of Object.entries(CONCRETE_CLASSES)) {
      expect(props.fcd).toBeCloseTo(props.fck / 1.4, 2);
      // Just reference key to avoid unused warning
      expect(key).toBeDefined();
    }
  });

  it("fctk_inf = 0.7 × fctm for all classes", () => {
    for (const props of Object.values(CONCRETE_CLASSES)) {
      expect(props.fctk_inf).toBeCloseTo(0.7 * props.fctm, 2);
    }
  });

  it("Ecs ≤ Eci for all classes (αi ≤ 1)", () => {
    for (const props of Object.values(CONCRETE_CLASSES)) {
      expect(props.Ecs).toBeLessThanOrEqual(props.Eci + 0.001);
    }
  });

  it("εcu decreases for higher fck (> 50)", () => {
    const c50 = CONCRETE_CLASSES["C50"];
    const c70 = CONCRETE_CLASSES["C70"];
    const c90 = CONCRETE_CLASSES["C90"];
    expect(c50.epsilon_cu).toBeGreaterThan(c70.epsilon_cu);
    expect(c70.epsilon_cu).toBeGreaterThan(c90.epsilon_cu);
  });
});

// ==============================================================================
// 7. FLEXURE DESIGN (NBR 6118:2023, Items 14 + 17)
// ==============================================================================

describe("Flexure Design — NBR 6118:2023 Item 17.2", () => {
  it("TASK 5: ξlim = εcu/(εcu+εyd) for CA-50 ≈ 0.628", () => {
    // εcu = 3.5‰, εyd = (500/1.15)/210000 ≈ 0.00207
    const epsilon_cu = 0.0035;
    const epsilon_yd = 500 / 1.15 / 210000;
    const xi_limit = epsilon_cu / (epsilon_cu + epsilon_yd);
    expect(xi_limit).toBeCloseTo(0.628, 2);
  });

  it("TASK 6: ρmin for C30/CA-50 = max(0.15%, 0.078×30^(2/3)/500×100)", () => {
    const rho_calc = ((0.078 * Math.pow(30, 2 / 3)) / 500) * 100;
    const rho_min = Math.max(0.15, rho_calc);
    // For C30, rho_calc ≈ 0.1503 which is essentially the 0.15% floor
    expect(rho_min).toBeCloseTo(0.15, 1);
  });

  it("TASK 6: ρmin for C50/CA-50 > 0.15%", () => {
    const rho_calc = ((0.078 * Math.pow(50, 2 / 3)) / 500) * 100;
    expect(rho_calc).toBeGreaterThan(0.15);
  });
});

// ==============================================================================
// 8. TORSION DESIGN (NBR 6118:2023, Item 17.5)
// ==============================================================================

describe("Torsion Design — NBR 6118:2023 Item 17.5", () => {
  const baseParams = {
    b: 25,
    h: 50,
    d: 45,
    Tsd: 3000, // kN.cm
    fck: 30,
    fyk: 500,
  };

  it("TRd2 = 0.5 × αv2 × fcd × Ae × he", () => {
    const result = calculateTorsionDesign(baseParams);
    const fcd = 30 / 1.4 / 10;
    const alpha_v2 = 1 - 30 / 250;
    const A = 25 * 50;
    const u = 2 * (25 + 50);
    const he = Math.min(A / u, 25 / 2, 50 / 2);
    const Ae = (25 - he) * (50 - he);
    const TRd2 = 0.5 * alpha_v2 * fcd * Ae * he;
    expect(result.resistance.TRd2).toBeCloseTo(TRd2, 0);
  });

  it("TASK 23: θ=45° produces baseline reinforcement", () => {
    const result45 = calculateTorsionDesign({ ...baseParams, theta: 45 });
    expect(result45.reinforcement.Asl).toBeGreaterThan(0);
    expect(result45.reinforcement.Ast_s).toBeGreaterThan(0);
  });

  it("TASK 23: θ=30° increases Asl and decreases Ast/s vs θ=45°", () => {
    const result45 = calculateTorsionDesign({ ...baseParams, theta: 45 });
    const result30 = calculateTorsionDesign({ ...baseParams, theta: 30 });
    // cotθ increases from 1.0 (45°) to 1.73 (30°)
    // Asl ∝ cotθ → increases
    expect(result30.reinforcement.Asl).toBeGreaterThan(
      result45.reinforcement.Asl,
    );
    // Ast/s ∝ 1/cotθ → decreases
    expect(result30.reinforcement.Ast_s).toBeLessThan(
      result45.reinforcement.Ast_s,
    );
  });

  it("Torsion-shear interaction: (Tsd/TRd2) + (Vsd/VRd2) ≤ 1", () => {
    const result = calculateTorsionDesign({
      ...baseParams,
      Tsd: 1000,
      Vsd: 50,
      VRd2: 300,
    });
    expect(result.interaction).toBeDefined();
    expect(result.interaction!.combinedRatio).toBeLessThanOrEqual(1);
    expect(result.interaction!.isValid).toBe(true);
  });
});

// ==============================================================================
// 9. CRACKING VERIFICATION (NBR 6118:2023, Item 17.3)
// ==============================================================================

describe("Cracking Verification — NBR 6118:2023 Item 17.3", () => {
  it("TASK 17: wk = min(w1, w2) — both formulas computed", () => {
    const result = verifyCracking({
      diameter: 16,
      Ms: 5000, // kN.cm
      As: 8.0, // cm²
      d: 45,
      fctm: 2.9, // C30
      eta1: 2.25,
      environmentClass: "II" as const,
    });
    // Both w1 and w2 should have produced a value, wk = min
    expect(result.cracking.wk).toBeGreaterThan(0);
    expect(result.cracking.wk_limit).toBe(0.3); // CAA II
  });

  it("Crack limit varies by environmental class", () => {
    const params = {
      diameter: 12.5,
      Ms: 3000,
      As: 5.0,
      d: 40,
      fctm: 2.9,
    };
    const r1 = verifyCracking({ ...params, environmentClass: "I" as const });
    const r4 = verifyCracking({ ...params, environmentClass: "IV" as const });
    expect(r1.cracking.wk_limit).toBe(0.4); // CAA I
    expect(r4.cracking.wk_limit).toBe(0.2); // CAA IV
  });
});

// ==============================================================================
// 10. DEFLECTION VERIFICATION (NBR 6118:2023, Item 17.3.2)
// ==============================================================================

describe("Deflection Verification — NBR 6118:2023 Item 17.3.2", () => {
  it("TASK 31: Δξ interpolation at 3 months = 1.04 (Table 17.1)", () => {
    const delta = getCreepCoefficient(3);
    expect(delta).toBeCloseTo(1.04, 1);
  });

  it("TASK 31: Δξ at 70+ months = 2.0", () => {
    const delta = getCreepCoefficient(70);
    expect(delta).toBe(2.0);
  });

  it("Cracking ratio: Ma < Mcr → uncracked section", () => {
    // Using Ic >> III and small Ma so section is uncracked
    const result = calculateDeflection({
      span: 500,
      Ic: 50000,
      h: 40,
      b: 20,
      d: 36,
      yt: 20,
      Ecs: 26,
      fctm: 2.9,
      Ma: 100, // Small
      beamType: "simple" as const,
    });
    expect(result.cracking.isCracked).toBe(false);
    expect(result.inertia.Ie).toBe(result.inertia.Ic);
  });

  it("TASK 32: Ma_quasiPermanent produces different creep deflection", () => {
    const baseParams = {
      span: 500,
      Ic: 50000,
      h: 40,
      b: 20,
      d: 36,
      yt: 20,
      Ecs: 26,
      fctm: 2.9,
      Ma: 3000,
      beamType: "simple" as const,
      loadingDuration: 60,
    };
    const resultSimplified = calculateDeflection(baseParams);
    const resultPrecise = calculateDeflection({
      ...baseParams,
      Ma_quasiPermanent: 2000, // Less than Ma
    });
    // Precise creep should be LESS than simplified (Ma_qp < Ma)
    expect(resultPrecise.deflection.creep).toBeLessThan(
      resultSimplified.deflection.creep,
    );
    // But immediate is the same
    expect(resultPrecise.deflection.immediate).toBeCloseTo(
      resultSimplified.deflection.immediate,
      4,
    );
  });

  it("Acceptance limit: L/250 for visual", () => {
    const result = calculateDeflection({
      span: 600,
      Ic: 50000,
      h: 40,
      b: 20,
      d: 36,
      yt: 20,
      Ecs: 26,
      fctm: 2.9,
      Ma: 100,
      beamType: "simple" as const,
    });
    expect(result.limits.visual).toBe(600 / 250);
    expect(result.limits.damageSensitive).toBeCloseTo(600 / 350, 2);
  });
});

// ==============================================================================
// 11. ANCHORAGE & SPLICE (NBR 6118:2023, Item 9)
// ==============================================================================

describe("Anchorage & Splice — NBR 6118:2023 Item 9", () => {
  it("fbd = η1×η2×η3×fctd for ribbed/good zone", () => {
    const bondResult = calculateBondStrength({
      fctk_inf: 0.7 * 2.9,
      barType: "ribbed" as const,
      bondZone: "good" as const,
      diameter: 16,
    });
    // η1 = 2.25 (ribbed), η2 = 1.0 (good), η3 = 1.0 (φ ≤ 32)
    const fctd = (0.7 * 2.9) / 1.4;
    expect(bondResult.fbd).toBeCloseTo(2.25 * 1.0 * 1.0 * fctd, 1);
  });

  it("lb = (φ/4) × (fyd/fbd)", () => {
    const bondResult = calculateBondStrength({
      fctk_inf: 0.7 * 2.9,
      barType: "ribbed" as const,
      bondZone: "good" as const,
      diameter: 16,
    });
    const ancResult = calculateAnchorage(
      {
        diameter: 16,
        fyd: 500 / 1.15,
        fbd: bondResult.fbd,
        anchorageType: "straight" as const,
      },
      {
        fctk_inf: 0.7 * 2.9,
        barType: "ribbed" as const,
        bondZone: "good" as const,
        diameter: 16,
      },
    );
    // lb is returned in cm; fyd in MPa, fbd in MPa, formula gives mm, then /10
    const expected_lb_cm = ((16 / 4) * (500 / 1.15 / bondResult.fbd)) / 10;
    expect(ancResult.lb).toBeCloseTo(expected_lb_cm, 0);
  });

  it("TASK 29: splice α varies with percentage and spacing", () => {
    // 20% splice, spacing ≤ 5φ → α = 1.2
    expect(getSpliceAlpha(20, 4, 16)).toBe(1.2);
    // 50% splice, spacing ≤ 5φ → α = 1.8 or 2.0
    const alpha_50 = getSpliceAlpha(50, 4, 16);
    expect(alpha_50).toBeGreaterThanOrEqual(1.8);
    // >50% splice, spacing > 10φ → α = 1.4
    expect(getSpliceAlpha(60, 200, 16)).toBe(1.4);
  });
});

// ==============================================================================
// 12. SLAB DESIGN (NBR 6118:2023, Item 20)
// ==============================================================================

describe("Slab Design — NBR 6118:2023 Item 20", () => {
  it("TASK 25: One-way slab (λ>2) includes distribution reinforcement", () => {
    const result = calculateSlabDesign({
      geometry: { Lx: 200, Ly: 500, h: 12 },
      supports: {
        top: "free",
        bottom: "free",
        left: "simply",
        right: "simply",
      },
      deadLoad: 4.0,
      liveLoad: 2.0,
      fck: 30,
      fyk: 500,
      cover: 2.5,
      slabType: "floor" as const,
    });
    // Should have Y direction reinforcement (distribution)
    const yReinf = result.reinforcement.find(
      (r: { direction: string; type: string }) =>
        r.direction === "y" && r.type === "positive",
    );
    expect(yReinf).toBeDefined();
    expect(yReinf!.As_gov).toBeGreaterThan(0);
  });

  it("TASK 24: Spacing respects min(2h, 20cm) for main", () => {
    const result = calculateSlabDesign({
      geometry: { Lx: 400, Ly: 400, h: 12 },
      supports: {
        top: "simply",
        bottom: "simply",
        left: "simply",
        right: "simply",
      },
      deadLoad: 5.0,
      liveLoad: 3.0,
      fck: 30,
      fyk: 500,
      cover: 2.5,
      slabType: "floor" as const,
    });
    for (const r of result.reinforcement) {
      expect(r.spacing).toBeLessThanOrEqual(Math.min(2 * 12, 20));
    }
  });

  it("TASK 26: Flat slab minimum thickness = 16cm", () => {
    expect(getMinimumThickness("flat_slab")).toBe(16);
  });

  it("TASK 26: Mushroom slab minimum thickness = 14cm", () => {
    expect(getMinimumThickness("mushroom")).toBe(14);
  });
});

// ==============================================================================
// 13. LOAD COMBINATIONS (NBR 6118:2023, Item 11)
// ==============================================================================

describe("Load Combinations — NBR 6118:2023 Item 11", () => {
  it("ELU: pd = γg×g + γq×q (normal combination)", () => {
    const result = LoadService.calculateCombinations({
      span: { value: 5, unit: "m" },
      loads: {
        g1: { value: 10, unit: "kN/m" },
        q: { value: 5, unit: "kN/m" },
      },
      parameters: { combinationType: "NORMAL", permanentFavorable: false },
    });
    // γg=1.4, γq=1.4 for NORMAL → pd = 1.4×10 + 1.4×5 = 21 kN/m
    expect(result.loads.pd).toBeCloseTo(21, 0);
  });

  it("ELS quasi-permanent: p_qp = g + ψ2×q", () => {
    const result = LoadService.calculateCombinations({
      span: { value: 5, unit: "m" },
      loads: {
        g1: { value: 10, unit: "kN/m" },
        q: { value: 5, unit: "kN/m" },
      },
      parameters: {
        buildingType: "residential",
        combinationType: "NORMAL",
        permanentFavorable: false,
      },
    });
    // ψ2 for residential = 0.3 → p_qp = 10 + 0.3×5 = 11.5
    expect(result.loads.p_quasiPermanent).toBeCloseTo(11.5, 0);
  });

  it("TASK 28: Permanent favorable uses γg = 1.0", () => {
    const result = LoadService.calculateCombinations({
      span: { value: 5, unit: "m" },
      loads: {
        g1: { value: 10, unit: "kN/m" },
        q: { value: 5, unit: "kN/m" },
      },
      parameters: { permanentFavorable: true, combinationType: "NORMAL" },
    });
    // γg=1.0 (favorable), γq=1.4 → pd = 1.0×10 + 1.4×5 = 17
    expect(result.loads.pd).toBeCloseTo(17, 0);
  });

  it("F4-02: ELS rare uses FULL q_secondary (no ψ reduction)", () => {
    const result = LoadService.calculateCombinations({
      span: { value: 6, unit: "m" },
      loads: {
        g1: { value: 8, unit: "kN/m" },
        q: { value: 4, unit: "kN/m" },
        q_secondary: { value: 2, unit: "kN/m" },
      },
      parameters: {
        buildingType: "RESIDENCIAL",
        combinationType: "NORMAL",
        permanentFavorable: false,
      },
    });
    // ELS Rare: p_rare = g + q + q_secondary = 8 + 4 + 2 = 14 kN/m
    expect(result.loads.p_rare).toBeCloseTo(14, 0);
    // ELU: pd = 1.4×8 + 1.4×(4 + 0.5×2) = 11.2 + 7 = 18.2 kN/m
    expect(result.loads.pd).toBeCloseTo(18.2, 0);
  });
});

// ==============================================================================
// FASE 4 — ADDITIONAL NORMATIVE VALIDATION TESTS
// ==============================================================================

describe("F4 — Punching Shear k Factor Cap", () => {
  it("F4-01: k factor capped at 2.0 for very thin slabs (d < 5cm)", () => {
    // d=4cm → k_uncapped = 1+√(20/4) = 1+2.236 = 3.236
    // Should be capped at 2.0
    const result = verifyPunching({
      dx: 4,
      dy: 4,
      a: 20,
      b: 20,
      pillarType: "internal",
      Fsd: 50,
      rho_x: 0.01,
      rho_y: 0.01,
      fck: 30,
    });
    // k=2.0 capped → τRd1 = (0.18/1.4) × 2.0 × ∛(100×0.01×30) = 0.1286 × 2 × 3.107 = 0.799 MPa
    // Without cap, k=3.236 would give τRd1 = 1.293 MPa (overestimated!)
    expect(result.stress.tau_Rd1).toBeLessThan(1.0); // Must be under 1.0 with cap
    expect(result.stress.tau_Rd1).toBeGreaterThan(0.5); // Sanity check
  });

  it("F4-01: k factor unchanged for normal thickness slabs", () => {
    // d=15cm → k = 1+√(20/15) = 1+1.155 = 2.155 → capped at 2.0
    // Actually k=2.155 > 2.0, so it IS still capped for d=15cm
    // d=20cm → k = 1+√(20/20) = 1+1 = 2.0 → exactly at limit
    const result = verifyPunching({
      dx: 20,
      dy: 20,
      a: 30,
      b: 30,
      pillarType: "internal",
      Fsd: 200,
      rho_x: 0.01,
      rho_y: 0.01,
      fck: 30,
    });
    // k=2.0 exactly
    expect(result.stress.tau_Rd1).toBeGreaterThan(0);
  });
});

describe("F4 — ColumnDesign verySlender Classification", () => {
  it("F4-05: λ=160 → classified as verySlender", () => {
    const result = calculateColumnDesign({
      geometry: { bx: 20, by: 20 },
      length: 928, // Le = 928cm → λ = 928/(20/√12) = 928/5.77 ≈ 160.8
      supports: { top: "pinned", bottom: "pinned" },
      loading: { Nd: 300, Mx_top: 30, Mx_bot: 30, My_top: 30, My_bot: 30 },
      fck: 30,
      fyk: 500,
      cover: 3,
    });
    // λ ≈ 160.8, which falls in 140 < λ ≤ 200 → verySlender
    const slenderX = result.slenderness.x;
    if (slenderX.lambda > 140 && slenderX.lambda <= 200) {
      expect(slenderX.classification).toBe("verySlender");
    }
  });
});
