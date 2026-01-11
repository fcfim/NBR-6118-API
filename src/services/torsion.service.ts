/**
 * Torsion Design Service
 */

import { TorsionDesignInput } from "@/lib/schemas/torsion.schema";
import { SectionService } from "./section.service";
import { MaterialService } from "./material.service";
import {
  calculateTorsionDesign,
  TorsionDesignResult,
  TorsionDesignParams,
} from "@/core/design/TorsionDesign";

export class TorsionService {
  /**
   * Design torsion reinforcement from validated input
   */
  static design(input: TorsionDesignInput): TorsionDesignResult {
    // Get section properties
    const sectionResult = SectionService.calculateProperties(input.section);

    // Get dimensions from section - use width and height from input as fallback
    const sectionInput = input.section as { width?: number; height?: number };
    const b = sectionInput.width ?? 20;
    const h = sectionInput.height ?? 50;

    // Get material properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );
    const steel = MaterialService.getPassiveSteelProperties(
      input.materials.steel
    );

    // Calculate effective depth
    const cover = input.parameters?.cover ?? 2.5;
    const d = input.parameters?.d ?? h - cover - 1;

    // Build params
    const params: TorsionDesignParams = {
      b,
      h,
      d,
      Tsd: input.loading.tsd,
      Vsd: input.loading.vsd,
      VRd2: input.loading.vrd2,
      fck: concrete.fck,
      fyk: steel.fyk,
    };

    return calculateTorsionDesign(params);
  }
}
