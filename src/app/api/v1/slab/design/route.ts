/**
 * Slab Design API Route
 *
 * POST /api/v1/slab/design
 *
 * Designs reinforcement for reinforced concrete slabs.
 *
 * @example
 * {
 *   "geometry": { "Lx": 400, "Ly": 500, "h": 12 },
 *   "supports": { "top": "simply", "bottom": "simply", "left": "fixed", "right": "simply" },
 *   "materials": { "concrete": "C25", "steel": "CA-50" },
 *   "loading": { "dead": 5, "live": 2 },
 *   "parameters": { "cover": 2.5, "slabType": "floor" }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { SlabDesignSchema } from "@/lib/schemas/slab.schema";
import { SlabService } from "@/services/slab.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = SlabDesignSchema.parse(body);

    // Design slab
    const result = SlabService.design(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados da laje inválidos",
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
    endpoint: "/api/v1/slab/design",
    method: "POST",
    description: "Dimensiona lajes de concreto armado conforme NBR 6118:2023",
    classification: {
      "λ ≤ 2": "Armada em duas direções (tabelas de Bares)",
      "λ > 2": "Armada em uma direção",
    },
    supportCases: {
      "1": "4 bordas apoiadas (AAAA)",
      "2": "1 borda curta engastada",
      "3": "1 borda longa engastada",
      "4": "2 bordas curtas opostas engastadas",
      "5": "2 bordas longas opostas engastadas",
      "6": "2 bordas adjacentes engastadas",
      "9": "4 bordas engastadas",
    },
    formulas: {
      Mx: "μx × p × Lx²",
      My: "μy × p × Lx²",
    },
    example: {
      geometry: { Lx: 400, Ly: 500, h: 12 },
      supports: {
        top: "simply",
        bottom: "simply",
        left: "fixed",
        right: "simply",
      },
      materials: { concrete: "C25", steel: "CA-50" },
      loading: { dead: 5, live: 2 },
      parameters: { cover: 2.5, slabType: "floor" },
    },
    outputs: {
      classification: "Tipo (uma/duas direções) e caso de vinculação",
      coefficients: "Coeficientes μx, μy de Bares",
      moments: "Momentos Mx, My (kN.m/m)",
      reinforcement: "As (cm²/m), diâmetro, espaçamento",
    },
  });
}
