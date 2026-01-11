/**
 * Torsion Design API Route
 *
 * POST /api/v1/beam/design/torsion
 *
 * Designs torsion reinforcement for beams per NBR 6118:2023.
 *
 * @example
 * {
 *   "section": { "type": "rectangular", "width": 20, "height": 50 },
 *   "materials": { "concrete": "C25", "steel": "CA-50" },
 *   "loading": { "tsd": { "value": 15, "unit": "kN.m" } }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { TorsionDesignSchema } from "@/lib/schemas/torsion.schema";
import { TorsionService } from "@/services/torsion.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = TorsionDesignSchema.parse(body);

    // Design torsion
    const result = TorsionService.design(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de torção inválidos",
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
    endpoint: "/api/v1/beam/design/torsion",
    method: "POST",
    description:
      "Dimensiona armadura de torção conforme NBR 6118:2023 Seção 17.5",
    formulas: {
      TRd2: "0.5 × αv2 × fcd × Ae × he - Resistência limite",
      he: "A / u - Espessura equivalente",
      Ae: "(b - he) × (h - he) - Área envolvida",
      Asl: "Tsd / (2 × Ae × fyd) - Armadura longitudinal",
      "Ast/s": "Tsd / (2 × Ae × fywd) - Armadura transversal",
    },
    interaction: "(Tsd/TRd2) + (Vsd/VRd2) ≤ 1",
    example: {
      section: { type: "rectangular", width: 20, height: 50 },
      materials: { concrete: "C25", steel: "CA-50" },
      loading: {
        tsd: { value: 15, unit: "kN.m" },
        vsd: { value: 80, unit: "kN" },
        vrd2: 250,
      },
      parameters: { d: 45 },
    },
    outputs: {
      section: "Ae, he - Parâmetros da seção equivalente",
      resistance: "TRd2 - Limite de compressão diagonal",
      reinforcement: "Asl (cm²), Ast/s (cm²/m)",
      interaction: "Verificação torção + cisalhamento",
    },
  });
}
