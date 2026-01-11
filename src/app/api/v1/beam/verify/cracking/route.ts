/**
 * Cracking Verification API Route
 *
 * POST /api/v1/beam/verify/cracking
 *
 * Verifies crack width (wk) for serviceability limit state.
 *
 * @example
 * {
 *   "diameter": 16,
 *   "materials": { "concrete": "C25" },
 *   "loading": { "ms": { "value": 25, "unit": "kN.m" } },
 *   "reinforcement": { "As": 4.02, "d": 45 },
 *   "environment": { "class": "II" }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { CrackingVerificationSchema } from "@/lib/schemas/cracking.schema";
import { CrackingService } from "@/services/cracking.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = CrackingVerificationSchema.parse(body);

    // Verify cracking
    const result = CrackingService.verify(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de verificação inválidos",
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
    endpoint: "/api/v1/beam/verify/cracking",
    method: "POST",
    description: "Verifica abertura de fissuras (wk) conforme NBR 6118:2023",
    formula: "wk = (3 × φ × σsi²) / (12.5 × η1 × Es × fctm)",
    limits: {
      "CAA I (Rural)": "wk ≤ 0.4mm",
      "CAA II (Urbana)": "wk ≤ 0.3mm",
      "CAA III (Marinha)": "wk ≤ 0.3mm",
      "CAA IV (Industrial)": "wk ≤ 0.2mm",
    },
    example: {
      diameter: 16,
      materials: { concrete: "C25" },
      loading: { ms: { value: 25, unit: "kN.m" } },
      reinforcement: { As: 4.02, d: 45 },
      environment: { class: "II" },
    },
    outputs: {
      stress: {
        sigma_si: "Tensão na armadura (MPa)",
      },
      cracking: {
        wk: "Abertura de fissura (mm)",
        wk_limit: "Limite (mm)",
      },
      spacing: {
        s_max: "Espaçamento máximo (cm)",
      },
    },
  });
}
