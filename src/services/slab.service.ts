/**
 * Slab Design Service
 */

import { SlabDesignInput } from "@/lib/schemas/slab.schema";
import { MaterialService } from "./material.service";
import {
  calculateSlabDesign,
  SlabDesignResult,
  SlabDesignParams,
} from "@/core/design/SlabDesign";

export class SlabService {
  /**
   * Design slab from validated input
   */
  static design(input: SlabDesignInput): SlabDesignResult {
    // Get material properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );
    const steel = MaterialService.getPassiveSteelProperties(
      input.materials.steel
    );

    // Build params
    const params: SlabDesignParams = {
      geometry: input.geometry,
      supports: input.supports,
      deadLoad: input.loading.dead,
      liveLoad: input.loading.live,
      gamma_f: input.parameters.gamma_f,
      fck: concrete.fck,
      fyk: steel.fyk,
      cover: input.parameters.cover,
      slabType: input.parameters.slabType,
    };

    return calculateSlabDesign(params);
  }
}
