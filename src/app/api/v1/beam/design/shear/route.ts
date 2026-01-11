/**
 * Shear Design API Route
 *
 * POST /api/v1/beam/design/shear
 *
 * Calculates shear reinforcement (stirrups) for beams per NBR 6118:2023.
 *
 * @example
 * {
 *   "section": { "type": "rectangular", "width": 20, "height": 50 },
 *   "materials": { "concrete": "C25", "stirrupSteel": "CA-50" },
 *   "loading": { "vsd": 85 },
 *   "parameters": { "d": 45, "model": "1" }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { ShearDesignSchema } from "@/lib/schemas/shear.schema";
import { ShearService } from "@/services/shear.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = ShearDesignSchema.parse(body);

    // Calculate shear design
    const result = ShearService.calculateShear(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de cisalhamento inválidos",
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
    endpoint: "/api/v1/beam/design/shear",
    method: "POST",
    description:
      "Dimensiona armadura transversal (estribos) conforme NBR 6118:2023",
    models: {
      "1": "Modelo I - θ = 45° (padrão)",
      "2": "Modelo II - θ variável (30° a 45°)",
    },
    example: {
      section: {
        type: "rectangular",
        width: 20,
        height: 50,
      },
      materials: {
        concrete: "C25",
        stirrupSteel: "CA-50",
      },
      loading: {
        vsd: { value: 85, unit: "kN" },
      },
      parameters: {
        d: 45,
        model: "1",
        stirrupLegs: 2,
      },
    },
    outputs: {
      resistance: {
        VRd2: "Resistência à compressão diagonal (kN)",
        Vc: "Parcela resistida pelo concreto (kN)",
        Vsw: "Parcela a ser resistida pelos estribos (kN)",
      },
      stirrups: {
        asw_s: "Área de aço por metro (cm²/m)",
        s_max: "Espaçamento máximo (cm)",
      },
      detailing: "Sugestões de detalhamento (diâmetro, pernas, espaçamento)",
    },
  });
}
