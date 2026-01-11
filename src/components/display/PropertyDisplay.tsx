"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PropertyDisplayProps {
  title: string;
  description?: string;
  properties: Record<
    string,
    { value: number | string; unit?: string; label: string }
  >;
  className?: string;
}

export function PropertyDisplay({
  title,
  description,
  properties,
  className = "",
}: PropertyDisplayProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {Object.entries(properties).map(([key, prop], index) => (
            <React.Fragment key={key}>
              {index > 0 && <Separator className="my-1" />}
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">
                  {prop.label}
                </span>
                <span className="font-mono font-medium">
                  {typeof prop.value === "number"
                    ? prop.value.toFixed(2)
                    : prop.value}
                  {prop.unit && (
                    <span className="text-muted-foreground ml-1 text-sm">
                      {prop.unit}
                    </span>
                  )}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SectionPropertiesDisplayProps {
  properties: {
    area: number;
    Ix: number;
    Iy: number;
    Wx_inf: number;
    Wx_sup: number;
    Wy: number;
    xc: number;
    yc: number;
    h: number;
    b: number;
    ix: number;
    iy: number;
  };
  className?: string;
}

export function SectionPropertiesDisplay({
  properties,
  className = "",
}: SectionPropertiesDisplayProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      <PropertyDisplay
        title="Propriedades Geométricas"
        properties={{
          area: { value: properties.area, unit: "cm²", label: "Área (A)" },
          h: { value: properties.h, unit: "cm", label: "Altura (h)" },
          b: { value: properties.b, unit: "cm", label: "Largura (b)" },
          xc: { value: properties.xc, unit: "cm", label: "Centroide (xc)" },
          yc: { value: properties.yc, unit: "cm", label: "Centroide (yc)" },
        }}
      />
      <PropertyDisplay
        title="Momentos de Inércia"
        properties={{
          Ix: { value: properties.Ix, unit: "cm⁴", label: "Inércia (Ix)" },
          Iy: { value: properties.Iy, unit: "cm⁴", label: "Inércia (Iy)" },
          Wx_inf: {
            value: properties.Wx_inf,
            unit: "cm³",
            label: "Módulo (Wx,inf)",
          },
          Wx_sup: {
            value: properties.Wx_sup,
            unit: "cm³",
            label: "Módulo (Wx,sup)",
          },
          ix: {
            value: properties.ix,
            unit: "cm",
            label: "Raio de Giração (ix)",
          },
          iy: {
            value: properties.iy,
            unit: "cm",
            label: "Raio de Giração (iy)",
          },
        }}
      />
    </div>
  );
}

export default PropertyDisplay;
