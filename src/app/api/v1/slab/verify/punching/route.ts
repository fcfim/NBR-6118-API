/**
 * Punching Shear Verification API Route
 *
 * POST /api/v1/slab/verify/punching
 *
 * Verifies punching shear for flat slabs per NBR 6118:2023.
 *
 * @example
 * {
 *   "slab": { "h": 20 },
 *   "pillar": { "a": 30, "b": 30, "type": "internal" },
 *   "materials": { "concrete": "C30" },
 *   "loading": { "fsd": 500 }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { PunchingVerificationSchema } from "@/lib/schemas/punching.schema";
import { PunchingService } from "@/services/punching.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = PunchingVerificationSchema.parse(body);

    // Verify punching
    const result = PunchingService.verify(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de punção inválidos",
          details: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Erro interno de cálculo";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/slab/verify/punching",
    method: "POST",
    description:
      "Verifica punção em lajes lisas conforme NBR 6118:2023 Seção 19",
    formulas: {
      tau_sd: "Fsd / (u × d) - Tensão atuante",
      tau_Rd1: "0.13 × (1 + √(20/d)) × ∛(100 × ρ × fck) - Sem armadura",
      tau_Rd2: "0.27 × αv2 × fcd - Limite diagonal",
    },
    perimeters: {
      internal: "u = 2(a+b) + 4πd",
      edge: "u = a + 2b + πd",
      corner: "u = a + b + πd/2",
    },
    verification: {
      "τsd ≤ τRd1": "Dispensa armadura de punção",
      "τRd1 < τsd ≤ τRd2": "Necessária armadura de punção",
      "τsd > τRd2": "Inadequado - aumentar espessura ou capitel",
    },
    example: {
      slab: { h: 20 },
      pillar: { a: 30, b: 30, type: "internal" },
      materials: { concrete: "C30" },
      loading: { fsd: 500 },
      reinforcement: { rho_x: 0.005, rho_y: 0.005 },
    },
  });
}
