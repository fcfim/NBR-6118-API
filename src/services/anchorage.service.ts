/**
 * Anchorage Service
 */

import { AnchorageInput } from "@/lib/schemas/anchorage.schema";
import { MaterialService } from "./material.service";
import {
  calculateFullAnchorage,
  FullAnchorageResult,
  FullAnchorageParams,
} from "@/core/detailing/AnchorageCalculation";

export class AnchorageService {
  /**
   * Calculate anchorage and splice from validated input
   */
  static calculate(input: AnchorageInput): FullAnchorageResult {
    // Get material properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );
    const steel = MaterialService.getPassiveSteelProperties(
      input.materials.steel
    );

    // Build params
    const params: FullAnchorageParams = {
      diameter: input.diameter,
      fyk: steel.fyk,
      fctk_inf: concrete.fctk_inf,
      barType: input.configuration.barType,
      bondZone: input.configuration.bondZone,
      anchorageType: input.configuration.anchorageType,
      As_calc: input.areaOptimization?.As_calc,
      As_ef: input.areaOptimization?.As_ef,
      splicePercentage: input.splice?.percentage,
      barSpacing: input.splice?.spacing,
    };

    return calculateFullAnchorage(params);
  }
}
