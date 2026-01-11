/**
 * Punching Shear Service
 */

import { PunchingVerificationInput } from "@/lib/schemas/punching.schema";
import { MaterialService } from "./material.service";
import {
  verifyPunching,
  PunchingResult,
  PunchingParams,
} from "@/core/verification/PunchingShear";

export class PunchingService {
  /**
   * Verify punching shear from validated input
   */
  static verify(input: PunchingVerificationInput): PunchingResult {
    // Get concrete properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );

    // Calculate effective depths if not provided
    const cover = 2.5; // default cover
    const barDia = 1.0; // assumed bar diameter in cm
    const dx = input.slab.dx ?? input.slab.h - cover - barDia / 2;
    const dy = input.slab.dy ?? input.slab.h - cover - barDia - barDia / 2;

    // Build params
    const params: PunchingParams = {
      dx,
      dy,
      a: input.pillar.a,
      b: input.pillar.b,
      pillarType: input.pillar.type,
      Fsd: input.loading.fsd,
      rho_x: input.reinforcement.rho_x,
      rho_y: input.reinforcement.rho_y,
      fck: concrete.fck,
    };

    return verifyPunching(params);
  }
}
