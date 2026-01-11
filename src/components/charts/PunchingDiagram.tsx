"use client";

import React from "react";

interface PunchingDiagramProps {
  /** Pillar dimension a (cm) */
  a: number;
  /** Pillar dimension b (cm) */
  b: number;
  /** Effective depth d (cm) */
  d: number;
  /** Critical perimeter u (cm) */
  u: number;
  /** Pillar position type */
  pillarType: "internal" | "edge" | "corner";
  /** Perimeter description */
  description?: string;
  /** Acting stress (MPa) */
  tau_sd?: number;
  /** Resistance stress (MPa) */
  tau_Rd1?: number;
  /** SVG width */
  width?: number;
  /** SVG height */
  height?: number;
  className?: string;
}

/**
 * Punching Perimeter Diagram Component
 *
 * Visualizes critical punching perimeters around a column
 * Shows C (face), C' (2d distance), pillar position
 */
export function PunchingDiagram({
  a,
  b,
  d,
  u,
  pillarType,
  description,
  tau_sd,
  tau_Rd1,
  width = 350,
  height = 300,
  className = "",
}: PunchingDiagramProps) {
  const padding = 30;
  const centerX = width / 2;
  const centerY = height / 2;

  // Scale to fit
  const maxDim = Math.max(a, b) + 4 * d + 20;
  const scale = Math.min(
    (width - 2 * padding) / maxDim,
    (height - 2 * padding - 40) / maxDim
  );

  const pillarW = a * scale;
  const pillarH = b * scale;
  const dist2d = 2 * d * scale;

  // Colors
  const pillarColor = "#475569"; // slate-600
  const perimeterC = "#ef4444"; // red - face perimeter
  const perimeter2d = "#3b82f6"; // blue - 2d perimeter

  // Utility check
  const isOk =
    tau_sd !== undefined && tau_Rd1 !== undefined && tau_sd <= tau_Rd1;
  const needsReinf =
    tau_sd !== undefined && tau_Rd1 !== undefined && tau_sd > tau_Rd1;

  // Adjust position based on pillar type
  let offsetX = 0;
  let offsetY = 0;
  if (pillarType === "edge") {
    offsetY = dist2d / 2;
  } else if (pillarType === "corner") {
    offsetX = dist2d / 2;
    offsetY = dist2d / 2;
  }

  const pillarCenterX = centerX + offsetX;
  const pillarCenterY = centerY + offsetY;

  return (
    <svg
      width={width}
      height={height}
      className={`bg-white rounded-lg border border-slate-200 ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Title */}
      <text
        x={width / 2}
        y={18}
        textAnchor="middle"
        className="text-xs font-medium fill-slate-700"
      >
        Perímetros Críticos de Punção
      </text>
      <text
        x={width / 2}
        y={32}
        textAnchor="middle"
        className="text-[10px] fill-slate-500"
      >
        {pillarType === "internal"
          ? "Pilar Interno"
          : pillarType === "edge"
          ? "Pilar de Borda"
          : "Pilar de Canto"}
      </text>

      {/* Slab representation (background) */}
      <rect
        x={padding}
        y={padding + 20}
        width={width - 2 * padding}
        height={height - 2 * padding - 40}
        className="fill-slate-50 stroke-slate-300"
        strokeWidth="1"
        strokeDasharray="4,4"
      />

      {/* Edge lines for edge/corner pillars */}
      {pillarType === "edge" && (
        <line
          x1={padding}
          y1={pillarCenterY - pillarH / 2 - dist2d}
          x2={width - padding}
          y2={pillarCenterY - pillarH / 2 - dist2d}
          stroke="#64748b"
          strokeWidth="3"
        />
      )}
      {pillarType === "corner" && (
        <>
          <line
            x1={pillarCenterX - pillarW / 2 - dist2d}
            y1={padding + 20}
            x2={pillarCenterX - pillarW / 2 - dist2d}
            y2={height - padding - 20}
            stroke="#64748b"
            strokeWidth="3"
          />
          <line
            x1={padding}
            y1={pillarCenterY - pillarH / 2 - dist2d}
            x2={width - padding}
            y2={pillarCenterY - pillarH / 2 - dist2d}
            stroke="#64748b"
            strokeWidth="3"
          />
        </>
      )}

      {/* Critical perimeter C' at 2d (outer) */}
      {pillarType === "internal" && (
        <>
          {/* Rounded rectangle for internal pillar */}
          <rect
            x={pillarCenterX - pillarW / 2 - dist2d}
            y={pillarCenterY - pillarH / 2 - dist2d}
            width={pillarW + 2 * dist2d}
            height={pillarH + 2 * dist2d}
            rx={dist2d}
            ry={dist2d}
            fill="none"
            stroke={perimeter2d}
            strokeWidth="2"
            strokeDasharray="6,3"
          />
        </>
      )}
      {pillarType === "edge" && (
        <path
          d={`
            M ${pillarCenterX - pillarW / 2 - dist2d} ${
            pillarCenterY - pillarH / 2 - dist2d
          }
            L ${pillarCenterX - pillarW / 2 - dist2d} ${
            pillarCenterY + pillarH / 2
          }
            A ${dist2d} ${dist2d} 0 0 0 ${pillarCenterX - pillarW / 2} ${
            pillarCenterY + pillarH / 2 + dist2d
          }
            L ${pillarCenterX + pillarW / 2} ${
            pillarCenterY + pillarH / 2 + dist2d
          }
            A ${dist2d} ${dist2d} 0 0 0 ${
            pillarCenterX + pillarW / 2 + dist2d
          } ${pillarCenterY + pillarH / 2}
            L ${pillarCenterX + pillarW / 2 + dist2d} ${
            pillarCenterY - pillarH / 2 - dist2d
          }
          `}
          fill="none"
          stroke={perimeter2d}
          strokeWidth="2"
          strokeDasharray="6,3"
        />
      )}
      {pillarType === "corner" && (
        <path
          d={`
            M ${pillarCenterX - pillarW / 2 - dist2d} ${
            pillarCenterY - pillarH / 2 - dist2d
          }
            L ${pillarCenterX - pillarW / 2 - dist2d} ${
            pillarCenterY + pillarH / 2
          }
            A ${dist2d} ${dist2d} 0 0 0 ${pillarCenterX - pillarW / 2} ${
            pillarCenterY + pillarH / 2 + dist2d
          }
            L ${pillarCenterX + pillarW / 2} ${
            pillarCenterY + pillarH / 2 + dist2d
          }
            A ${dist2d} ${dist2d} 0 0 0 ${
            pillarCenterX + pillarW / 2 + dist2d
          } ${pillarCenterY + pillarH / 2}
            L ${pillarCenterX + pillarW / 2 + dist2d} ${
            pillarCenterY - pillarH / 2 - dist2d
          }
          `}
          fill="none"
          stroke={perimeter2d}
          strokeWidth="2"
          strokeDasharray="6,3"
        />
      )}

      {/* Critical perimeter C at face */}
      <rect
        x={pillarCenterX - pillarW / 2}
        y={pillarCenterY - pillarH / 2}
        width={pillarW}
        height={pillarH}
        fill="none"
        stroke={perimeterC}
        strokeWidth="2"
      />

      {/* Pillar (filled) */}
      <rect
        x={pillarCenterX - pillarW / 2}
        y={pillarCenterY - pillarH / 2}
        width={pillarW}
        height={pillarH}
        fill={pillarColor}
        className="opacity-80"
      />

      {/* Pillar cross */}
      <line
        x1={pillarCenterX - pillarW / 2}
        y1={pillarCenterY - pillarH / 2}
        x2={pillarCenterX + pillarW / 2}
        y2={pillarCenterY + pillarH / 2}
        stroke="white"
        strokeWidth="1.5"
      />
      <line
        x1={pillarCenterX + pillarW / 2}
        y1={pillarCenterY - pillarH / 2}
        x2={pillarCenterX - pillarW / 2}
        y2={pillarCenterY + pillarH / 2}
        stroke="white"
        strokeWidth="1.5"
      />

      {/* Dimension annotations */}
      {/* 2d distance */}
      <g
        transform={`translate(${pillarCenterX + pillarW / 2 + 5}, ${
          pillarCenterY - pillarH / 2 - dist2d / 2
        })`}
      >
        <line x1="0" y1="0" x2="20" y2="0" stroke="#3b82f6" strokeWidth="1" />
        <text x="25" y="4" className="text-[9px] fill-blue-600">
          2d = {(2 * d).toFixed(0)} cm
        </text>
      </g>

      {/* Pillar dimensions */}
      <text
        x={pillarCenterX}
        y={pillarCenterY + 4}
        textAnchor="middle"
        className="text-[9px] fill-white font-medium"
      >
        {a}×{b}
      </text>

      {/* Perimeter value */}
      <text
        x={width / 2}
        y={height - 45}
        textAnchor="middle"
        className="text-[10px] fill-blue-600"
      >
        u = {u.toFixed(0)} cm
      </text>

      {/* Legend */}
      <g transform={`translate(${padding}, ${height - 25})`}>
        <rect x="0" y="0" width="12" height="12" fill={pillarColor} />
        <text x="17" y="10" className="text-[9px] fill-slate-600">
          Pilar
        </text>

        <line
          x1="60"
          y1="6"
          x2="80"
          y2="6"
          stroke={perimeterC}
          strokeWidth="2"
        />
        <text x="85" y="10" className="text-[9px] fill-slate-600">
          C (face)
        </text>

        <line
          x1="130"
          y1="6"
          x2="150"
          y2="6"
          stroke={perimeter2d}
          strokeWidth="2"
          strokeDasharray="4,2"
        />
        <text x="155" y="10" className="text-[9px] fill-slate-600">
          C{"'"} (2d)
        </text>

        {/* Status indicator */}
        {tau_sd !== undefined && (
          <g transform="translate(200, 0)">
            <circle
              cx="6"
              cy="6"
              r="5"
              fill={isOk ? "#22c55e" : needsReinf ? "#f59e0b" : "#ef4444"}
            />
            <text x="15" y="10" className="text-[9px] fill-slate-600">
              {isOk ? "OK" : needsReinf ? "⚠️ Arm." : "❌"}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

export default PunchingDiagram;
