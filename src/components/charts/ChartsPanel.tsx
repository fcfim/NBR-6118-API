"use client";

import React from "react";
import { SectionVisualizer } from "@/components/sections/SectionVisualizer";
import { StrainDiagram } from "@/components/charts/StrainDiagram";
import { PunchingDiagram } from "@/components/charts/PunchingDiagram";

interface ChartsPanelProps {
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  } | null;
  activeModule: string;
}

export function ChartsPanel({ result, activeModule }: ChartsPanelProps) {
  if (!result?.success || !result.data) {
    return null;
  }

  const data = result.data as Record<string, unknown>;
  const points = data?.points as Array<{ x: number; y: number }> | undefined;
  const properties = data?.properties as Record<string, number> | undefined;
  const parameters = data?.parameters as Record<string, unknown> | undefined;
  const inputs = data?.inputs as Record<string, unknown> | undefined;
  const perimeter = data?.perimeter as Record<string, unknown> | undefined;
  const stress = data?.stress as Record<string, number> | undefined;

  // Determine which charts to show based on module and data
  const showSectionVisualizer: boolean =
    activeModule === "section" && Array.isArray(points) && points.length > 0;
  const showStrainDiagram: boolean =
    activeModule === "beam-flexure" && parameters?.xi != null;
  const showPunchingDiagram: boolean =
    activeModule === "punching" && !!perimeter && !!inputs?.pillarType;
  const showShearDiagram: boolean =
    activeModule === "beam-shear" && !!data?.stirrups;
  const showDeflectionDiagram: boolean =
    activeModule === "deflection" && !!data?.deflection;
  const showCrackingDiagram: boolean =
    activeModule === "cracking" && !!data?.cracking;
  const showColumnDiagram: boolean =
    activeModule === "column" && !!data?.slenderness;

  // If no charts to show, return null
  if (
    !showSectionVisualizer &&
    !showStrainDiagram &&
    !showPunchingDiagram &&
    !showShearDiagram &&
    !showDeflectionDiagram &&
    !showCrackingDiagram &&
    !showColumnDiagram
  ) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-slate-900">Visualização Gráfica</h2>
        <p className="text-sm text-slate-500">
          Diagramas e representações visuais
        </p>
      </div>

      <div className="p-8">
        <div className="flex flex-wrap justify-center gap-8">
          {/* Section Visualizer */}
          {showSectionVisualizer && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[400px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Geometria da Seção
              </p>
              <div className="flex justify-center">
                <SectionVisualizer
                  points={points!}
                  centroid={
                    properties?.xc !== undefined && properties?.yc !== undefined
                      ? { x: properties.xc, y: properties.yc }
                      : undefined
                  }
                  width={380}
                  height={320}
                  showGrid={true}
                  showDimensions={true}
                />
              </div>
            </div>
          )}

          {/* Strain Diagram - Flexure */}
          {showStrainDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[480px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Diagrama de Deformações
              </p>
              <div className="flex justify-center">
                <StrainDiagram
                  x={Number(parameters?.x) || 10}
                  d={Number(inputs?.d) || 45}
                  h={Number(inputs?.h) || 50}
                  b={Number(inputs?.b) || 20}
                  xi={Number(parameters?.xi) || 0.4}
                  domain={String(parameters?.domain || "2")}
                  width={450}
                  height={320}
                />
              </div>
            </div>
          )}

          {/* Punching Diagram */}
          {showPunchingDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[420px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Perímetros de Punção
              </p>
              <div className="flex justify-center">
                <PunchingDiagram
                  a={(inputs as Record<string, number>).a}
                  b={(inputs as Record<string, number>).b}
                  d={(perimeter as Record<string, number>).d}
                  u={(perimeter as Record<string, number>).u}
                  pillarType={
                    (inputs as Record<string, string>).pillarType as
                      | "internal"
                      | "edge"
                      | "corner"
                  }
                  description={
                    (perimeter as Record<string, string>).description
                  }
                  tau_sd={stress?.tau_sd}
                  tau_Rd1={stress?.tau_Rd1}
                  width={400}
                  height={340}
                />
              </div>
            </div>
          )}

          {/* Shear Truss Diagram */}
          {showShearDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[480px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Treliça de Mörsch (Modelo I)
              </p>
              <div className="flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 400 160"
                  className="w-full max-w-[420px] h-auto"
                  fill="none"
                >
                  {/* Beam outline */}
                  <rect
                    x="20"
                    y="20"
                    width="360"
                    height="120"
                    fill="#f1f5f9"
                    stroke="#64748b"
                    strokeWidth="2"
                  />

                  {/* Top chord (compressed concrete) */}
                  <line
                    x1="20"
                    y1="35"
                    x2="380"
                    y2="35"
                    stroke="#3b82f6"
                    strokeWidth="4"
                  />
                  <text x="390" y="40" fontSize="10" fill="#3b82f6">
                    Rc
                  </text>

                  {/* Bottom chord (steel reinforcement) */}
                  <line
                    x1="20"
                    y1="125"
                    x2="380"
                    y2="125"
                    stroke="#ef4444"
                    strokeWidth="4"
                  />
                  <text x="390" y="130" fontSize="10" fill="#ef4444">
                    Rs
                  </text>

                  {/* Diagonal struts (concrete) - 45° */}
                  {[60, 120, 180, 240, 300].map((x, i) => (
                    <line
                      key={`strut-${i}`}
                      x1={x}
                      y1="35"
                      x2={x + 50}
                      y2="125"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="5,3"
                    />
                  ))}

                  {/* Vertical stirrups */}
                  {[80, 140, 200, 260, 320].map((x, i) => (
                    <g key={`stirrup-${i}`}>
                      <line
                        x1={x}
                        y1="35"
                        x2={x}
                        y2="125"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                      <circle cx={x} cy="35" r="4" fill="#10b981" />
                      <circle cx={x} cy="125" r="4" fill="#10b981" />
                    </g>
                  ))}

                  {/* Load arrows */}
                  <polygon points="200,5 195,15 205,15" fill="#1e293b" />
                  <line
                    x1="200"
                    y1="15"
                    x2="200"
                    y2="0"
                    stroke="#1e293b"
                    strokeWidth="2"
                  />
                  <text x="210" y="12" fontSize="10" fill="#1e293b">
                    Vsd
                  </text>

                  {/* Angle annotation */}
                  <path
                    d="M 240,125 L 260,125 A 20,20 0 0 0 250,110"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <text x="265" y="115" fontSize="9" fill="#64748b">
                    θ=45°
                  </text>
                </svg>

                <div className="flex gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500 rounded"></div>
                    <span className="text-slate-600">Banzo comprimido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-500 rounded"></div>
                    <span className="text-slate-600">Banzo tracionado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-emerald-500 rounded"></div>
                    <span className="text-slate-600">Estribos</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mt-3">
                  Vsd ={" "}
                  {(
                    (data.inputs as Record<string, unknown>)?.Vsd as number
                  )?.toFixed(1) || "?"}{" "}
                  kN
                </p>
              </div>
            </div>
          )}

          {/* Deflection Curve */}
          {showDeflectionDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[480px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Curva de Flecha
              </p>
              <div className="flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 400 140"
                  className="w-full max-w-[420px] h-auto"
                  fill="none"
                >
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={`grid-${i}`}
                      x1={50 + i * 75}
                      y1="30"
                      x2={50 + i * 75}
                      y2="110"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Supports */}
                  <polygon points="50,50 60,70 40,70" fill="#64748b" />
                  <polygon points="350,50 360,70 340,70" fill="#64748b" />
                  <line
                    x1="30"
                    y1="70"
                    x2="70"
                    y2="70"
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                  <line
                    x1="330"
                    y1="70"
                    x2="370"
                    y2="70"
                    stroke="#64748b"
                    strokeWidth="2"
                  />

                  {/* Original beam (undeformed) */}
                  <line
                    x1="50"
                    y1="50"
                    x2="350"
                    y2="50"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="8,4"
                  />

                  {/* Deflected beam (curved) */}
                  <path
                    d="M 50,50 C 100,50 150,90 200,95 C 250,90 300,50 350,50"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    fill="none"
                  />

                  {/* Max deflection point */}
                  <circle cx="200" cy="95" r="5" fill="#ef4444" />

                  {/* Deflection arrow */}
                  <line
                    x1="200"
                    y1="50"
                    x2="200"
                    y2="90"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <polygon points="200,95 195,85 205,85" fill="#ef4444" />

                  {/* Deflection value */}
                  <text
                    x="210"
                    y="75"
                    fontSize="12"
                    fill="#ef4444"
                    fontWeight="bold"
                  >
                    f ={" "}
                    {(
                      (data.deflection as Record<string, unknown>)
                        ?.total as number
                    )?.toFixed(2) || "?"}{" "}
                    cm
                  </text>

                  {/* Span dimension */}
                  <line
                    x1="50"
                    y1="120"
                    x2="350"
                    y2="120"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <line
                    x1="50"
                    y1="115"
                    x2="50"
                    y2="125"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <line
                    x1="350"
                    y1="115"
                    x2="350"
                    y2="125"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <text x="190" y="135" fontSize="10" fill="#64748b">
                    L = vão
                  </text>
                </svg>

                <div className="flex gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-slate-400 border-dashed"></div>
                    <span className="text-slate-600">Posição inicial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500 rounded"></div>
                    <span className="text-slate-600">Viga deformada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-slate-600">Flecha máxima</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cracking Width Diagram */}
          {showCrackingDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[420px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Verificação de Fissuração
              </p>
              <div className="flex flex-col items-center justify-center">
                {((): React.ReactElement => {
                  const cracking = data.cracking as Record<string, unknown>;
                  const wk = (cracking?.wk as number) || 0;
                  const wk_limit = (cracking?.wk_limit as number) || 0.3;
                  const stressData = data.stress as Record<string, number>;
                  const sigma_si = stressData?.sigma_si || 0;
                  const isValid = wk <= wk_limit;
                  const ratio = Math.min(wk / wk_limit, 1.5);

                  return (
                    <>
                      <svg
                        viewBox="0 0 380 180"
                        className="w-full max-w-[400px] h-auto"
                        fill="none"
                      >
                        {/* Background */}
                        <rect
                          x="20"
                          y="20"
                          width="340"
                          height="140"
                          fill="#f8fafc"
                          rx="8"
                        />

                        {/* Bar chart - wk_limit */}
                        <rect
                          x="60"
                          y="50"
                          width="80"
                          height="80"
                          fill="#e2e8f0"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          rx="4"
                        />
                        <text
                          x="100"
                          y="145"
                          fontSize="10"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          wk,lim
                        </text>
                        <text
                          x="100"
                          y="45"
                          fontSize="11"
                          fill="#64748b"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {wk_limit.toFixed(2)} mm
                        </text>

                        {/* Bar chart - wk calculated */}
                        <rect
                          x="180"
                          y={50 + (1 - ratio) * 80}
                          width="80"
                          height={ratio * 80}
                          fill={isValid ? "#22c55e" : "#ef4444"}
                          stroke={isValid ? "#16a34a" : "#dc2626"}
                          strokeWidth="2"
                          rx="4"
                        />
                        <text
                          x="220"
                          y="145"
                          fontSize="10"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          wk
                        </text>
                        <text
                          x="220"
                          y={45 + (1 - ratio) * 80}
                          fontSize="11"
                          fill={isValid ? "#16a34a" : "#dc2626"}
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {wk.toFixed(3)} mm
                        </text>

                        {/* Status indicator */}
                        <circle
                          cx="320"
                          cy="90"
                          r="25"
                          fill={isValid ? "#dcfce7" : "#fee2e2"}
                          stroke={isValid ? "#22c55e" : "#ef4444"}
                          strokeWidth="3"
                        />
                        <text x="320" y="96" fontSize="18" textAnchor="middle">
                          {isValid ? "✓" : "✗"}
                        </text>
                      </svg>

                      <div className="flex gap-6 mt-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-200 border border-slate-400 rounded"></div>
                          <span className="text-slate-600">
                            Limite ({wk_limit} mm)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded ${
                              isValid ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-slate-600">Calculado</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 mt-3">
                        σsi = {sigma_si.toFixed(1)} MPa | Taxa ={" "}
                        {(ratio * 100).toFixed(0)}%
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Column Section Diagram */}
          {showColumnDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[420px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Seção do Pilar e Esbeltez
              </p>
              <div className="flex flex-col items-center justify-center">
                {((): React.ReactElement => {
                  const geometry = data.geometry as Record<string, number>;
                  const slenderness = data.slenderness as Record<
                    string,
                    unknown
                  >;
                  const bx = geometry?.bx || 20;
                  const by = geometry?.by || 40;
                  const slendX = slenderness?.x as Record<string, unknown>;
                  const slendY = slenderness?.y as Record<string, unknown>;
                  const lambdaX = (slendX?.lambda as number) || 0;
                  const lambdaY = (slendY?.lambda as number) || 0;
                  const classX = (slendX?.classification as string) || "short";
                  const classY = (slendY?.classification as string) || "short";

                  // Scale for visualization (max 150px)
                  const maxDim = Math.max(bx, by);
                  const scale = 120 / maxDim;
                  const w = bx * scale;
                  const h = by * scale;

                  const getClassColor = (cls: string) => {
                    switch (cls) {
                      case "short":
                        return "#22c55e";
                      case "medium":
                        return "#eab308";
                      case "slender":
                        return "#f97316";
                      case "notPermitted":
                        return "#ef4444";
                      default:
                        return "#64748b";
                    }
                  };

                  const getClassLabel = (cls: string) => {
                    switch (cls) {
                      case "short":
                        return "Curto";
                      case "medium":
                        return "Médio";
                      case "slender":
                        return "Esbelto";
                      case "notPermitted":
                        return "Não permitido";
                      default:
                        return cls;
                    }
                  };

                  return (
                    <>
                      <svg
                        viewBox="0 0 380 200"
                        className="w-full max-w-[400px] h-auto"
                        fill="none"
                      >
                        {/* Column cross-section */}
                        <rect
                          x={100 - w / 2}
                          y={100 - h / 2}
                          width={w}
                          height={h}
                          fill="#e2e8f0"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          rx="2"
                        />

                        {/* Corner reinforcement dots */}
                        {[
                          [100 - w / 2 + 10, 100 - h / 2 + 10],
                          [100 + w / 2 - 10, 100 - h / 2 + 10],
                          [100 - w / 2 + 10, 100 + h / 2 - 10],
                          [100 + w / 2 - 10, 100 + h / 2 - 10],
                        ].map(([cx, cy], i) => (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r="5"
                            fill="#ef4444"
                          />
                        ))}

                        {/* Dimension lines */}
                        <line
                          x1={100 - w / 2}
                          y1="175"
                          x2={100 + w / 2}
                          y2="175"
                          stroke="#64748b"
                          strokeWidth="1"
                        />
                        <line
                          x1={100 - w / 2}
                          y1="170"
                          x2={100 - w / 2}
                          y2="180"
                          stroke="#64748b"
                          strokeWidth="1"
                        />
                        <line
                          x1={100 + w / 2}
                          y1="170"
                          x2={100 + w / 2}
                          y2="180"
                          stroke="#64748b"
                          strokeWidth="1"
                        />
                        <text
                          x="100"
                          y="190"
                          fontSize="10"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          bx = {bx} cm
                        </text>

                        <line
                          x1="25"
                          y1={100 - h / 2}
                          x2="25"
                          y2={100 + h / 2}
                          stroke="#64748b"
                          strokeWidth="1"
                        />
                        <line
                          x1="20"
                          y1={100 - h / 2}
                          x2="30"
                          y2={100 - h / 2}
                          stroke="#64748b"
                          strokeWidth="1"
                        />
                        <line
                          x1="20"
                          y1={100 + h / 2}
                          x2="30"
                          y2={100 + h / 2}
                          stroke="#64748b"
                          strokeWidth="1"
                        />
                        <text
                          x="10"
                          y="105"
                          fontSize="10"
                          fill="#64748b"
                          textAnchor="middle"
                          transform="rotate(-90, 10, 105)"
                        >
                          by = {by} cm
                        </text>

                        {/* Slenderness info boxes */}
                        <rect
                          x="220"
                          y="40"
                          width="140"
                          height="50"
                          fill="white"
                          stroke={getClassColor(classX)}
                          strokeWidth="2"
                          rx="6"
                        />
                        <text
                          x="290"
                          y="60"
                          fontSize="11"
                          fill="#1e293b"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          λx = {lambdaX.toFixed(1)}
                        </text>
                        <text
                          x="290"
                          y="78"
                          fontSize="10"
                          fill={getClassColor(classX)}
                          textAnchor="middle"
                        >
                          {getClassLabel(classX)}
                        </text>

                        <rect
                          x="220"
                          y="110"
                          width="140"
                          height="50"
                          fill="white"
                          stroke={getClassColor(classY)}
                          strokeWidth="2"
                          rx="6"
                        />
                        <text
                          x="290"
                          y="130"
                          fontSize="11"
                          fill="#1e293b"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          λy = {lambdaY.toFixed(1)}
                        </text>
                        <text
                          x="290"
                          y="148"
                          fontSize="10"
                          fill={getClassColor(classY)}
                          textAnchor="middle"
                        >
                          {getClassLabel(classY)}
                        </text>
                      </svg>

                      <div className="flex gap-4 mt-4 text-xs flex-wrap justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-slate-600">Curto (λ≤40)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-slate-600">
                            Médio (40&lt;λ≤90)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-slate-600">
                            Esbelto (90&lt;λ≤140)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-slate-600">
                            Não permitido (λ&gt;140)
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartsPanel;
