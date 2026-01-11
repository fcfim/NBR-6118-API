/**
 * Shear Design Service
 *
 * Orchestrates shear design calculations using core logic and static data.
 */

import { ShearDesignInput } from "@/lib/schemas/shear.schema";
import { SectionService } from "./section.service";
import { MaterialService } from "./material.service";
import {
  calculateShearDesign,
  ShearDesignResult,
  ShearDesignParams,
} from "@/core/design/ShearDesign";

/**
 * Normalize shear force to kN
 */
function normalizeShearForce(input: { value: number; unit: string }): number {
  const factors: Record<string, number> = {
    kN: 1,
    tf: 9.80665,
    kgf: 0.00980665,
  };
  return input.value * (factors[input.unit] || 1);
}

/**
 * Calculate effective depth from section height and cover
 */
function calculateEffectiveDepth(
  h: number,
  params: { d?: number; concreteCover?: number }
): number {
  if (params.d !== undefined) {
    return params.d;
  }

  // Estimate: d = h - cover - stirrup(0.5cm) - mainBar/2(0.8cm)
  const cover = params.concreteCover || 2.5;
  return h - cover - 0.5 - 0.8;
}

export class ShearService {
  /**
   * Calculate shear design from validated input
   */
  static calculateShear(input: ShearDesignInput): ShearDesignResult {
    // Get section dimensions
    const bw = SectionService.getWebWidth(input.section);
    const h = SectionService.getSectionHeight(input.section);

    // Calculate effective depth
    const d = calculateEffectiveDepth(h, input.parameters);

    // Get material properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );
    const steel = MaterialService.getPassiveSteelProperties(
      input.materials.stirrupSteel
    );

    // Normalize shear force
    const Vsd = normalizeShearForce(input.loading.vsd);

    // Build core calculation params
    const params: ShearDesignParams = {
      bw,
      d,
      fck: concrete.fck,
      fctm: concrete.fctm,
      fctk_inf: concrete.fctk_inf,
      fywk: steel.fyk,
      Vsd,
      model: input.parameters.model as 1 | 2,
      theta: input.parameters.theta,
      alpha: input.parameters.alpha,
    };

    // Execute core calculation
    return calculateShearDesign(params);
  }

  /**
   * Quick check if section can resist shear without detailed calculation
   */
  static quickCheck(
    bw: number,
    d: number,
    fck: number,
    Vsd: number
  ): { canResist: boolean; VRd2: number; utilization: number } {
    // Quick VRd2 estimate using Model I
    const alpha_v2 = 1 - fck / 250;
    const fcd = fck / 1.4 / 10; // kN/cm²
    const VRd2 = 0.27 * alpha_v2 * fcd * bw * d;

    return {
      canResist: Vsd <= VRd2,
      VRd2,
      utilization: Vsd / VRd2,
    };
  }
}
