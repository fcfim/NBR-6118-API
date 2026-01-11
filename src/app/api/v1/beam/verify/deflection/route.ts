/**
 * Deflection Verification API Route
 *
 * POST /api/v1/beam/verify/deflection
 *
 * Verifies beam deflection for serviceability limit state (ELS).
 *
 * @example
 * {
 *   "section": { "type": "rectangular", "width": 20, "height": 50 },
 *   "materials": { "concrete": "C25" },
 *   "loading": { "ma": { "value": 30, "unit": "kN.m" }, "span": { "value": 5, "unit": "m" } },
 *   "parameters": { "beamType": "simple" }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { DeflectionVerificationSchema } from "@/lib/schemas/deflection.schema";
import { DeflectionService } from "@/services/deflection.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = DeflectionVerificationSchema.parse(body);

    // Calculate deflection verification
    const result = DeflectionService.verifyDeflection(validatedData);

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
    endpoint: "/api/v1/beam/verify/deflection",
    method: "POST",
    description: "Verifica flechas em vigas conforme NBR 6118:2023 (ELS)",
    limits: {
      "L/250": "Aceitabilidade visual",
      "L/350": "Danos a elementos sensíveis",
      "L/500": "Danos a elementos muito rígidos",
    },
    example: {
      section: {
        type: "rectangular",
        width: 20,
        height: 50,
      },
      materials: {
        concrete: "C25",
      },
      loading: {
        ma: { value: 30, unit: "kN.m" },
        span: { value: 5, unit: "m" },
      },
      parameters: {
        beamType: "simple",
        loadingDuration: 60,
      },
    },
    outputs: {
      cracking: {
        Mcr: "Momento de fissuração (kN.cm)",
        isCracked: "Seção fissurada?",
      },
      inertia: {
        Ie: "Inércia equivalente (cm⁴)",
      },
      deflection: {
        immediate: "Flecha imediata (cm)",
        creep: "Flecha diferida (cm)",
        total: "Flecha total (cm)",
      },
    },
  });
}
