/**
 * Cracking Verification Service
 */

import { CrackingVerificationInput } from "@/lib/schemas/cracking.schema";
import { SectionService } from "./section.service";
import { MaterialService } from "./material.service";
import {
  verifyCracking,
  CrackingResult,
  CrackingParams,
} from "@/core/verification/CrackingVerification";

/**
 * Normalize moment to kN.cm
 */
function normalizeMoment(input: { value: number; unit: string }): number {
  const factors: Record<string, number> = {
    "kN.cm": 1,
    "kN.m": 100,
    "tf.m": 980.665,
    "kgf.m": 0.980665,
  };
  return input.value * (factors[input.unit] || 1);
}

export class CrackingService {
  /**
   * Verify cracking from validated input
   */
  static verify(input: CrackingVerificationInput): CrackingResult {
    // Get concrete properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );

    // Get effective depth
    let d: number;
    if (input.reinforcement.d) {
      d = input.reinforcement.d;
    } else if (input.section) {
      const sectionResult = SectionService.calculateProperties(input.section);
      d = sectionResult.properties.h - 4; // approximate
    } else {
      throw new Error("Forneça altura útil (d) ou geometria da seção");
    }

    // Normalize moment
    const Ms = normalizeMoment(input.loading.ms);

    // Build params
    const params: CrackingParams = {
      diameter: input.diameter,
      Ms,
      As: input.reinforcement.As,
      d,
      fctm: concrete.fctm,
      environmentClass: input.environment.class,
    };

    return verifyCracking(params);
  }
}
