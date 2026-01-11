"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SectionType = "rectangular" | "T" | "I";

interface SectionFormData {
  type: SectionType;
  // Rectangular
  width?: number;
  height?: number;
  // T-section
  bf?: number;
  hf?: number;
  bw?: number;
  h?: number;
  // I-section (additional)
  bi?: number;
  hi?: number;
}

interface SectionFormProps {
  onSubmit: (data: SectionFormData) => void;
  isLoading?: boolean;
}

export function SectionForm({ onSubmit, isLoading = false }: SectionFormProps) {
  const [sectionType, setSectionType] = useState<SectionType>("rectangular");
  const [formData, setFormData] = useState<Partial<SectionFormData>>({
    width: 20,
    height: 50,
    bf: 60,
    hf: 12,
    bw: 20,
    h: 50,
    bi: 60,
    hi: 12,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: SectionFormData = { type: sectionType };

    if (sectionType === "rectangular") {
      data.width = formData.width;
      data.height = formData.height;
    } else if (sectionType === "T") {
      data.bf = formData.bf;
      data.hf = formData.hf;
      data.bw = formData.bw;
      data.h = formData.h;
    } else if (sectionType === "I") {
      data.bf = formData.bf;
      data.hf = formData.hf;
      data.bw = formData.bw;
      data.h = formData.h;
      data.bi = formData.bi;
      data.hi = formData.hi;
    }

    onSubmit(data);
  };

  const updateField = (field: keyof SectionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geometria da Seção</CardTitle>
        <CardDescription>
          Defina as dimensões da seção transversal (em cm)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="sectionType">Tipo de Seção</Label>
            <Select
              value={sectionType}
              onValueChange={(v) => setSectionType(v as SectionType)}
            >
              <SelectTrigger id="sectionType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Retangular</SelectItem>
                <SelectItem value="T">Seção T</SelectItem>
                <SelectItem value="I">Seção I</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rectangular Section Fields */}
          {sectionType === "rectangular" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Largura (b)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={formData.width || ""}
                  onChange={(e) => updateField("width", e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (h)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height || ""}
                  onChange={(e) => updateField("height", e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>
          )}

          {/* T-Section Fields */}
          {sectionType === "T" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bf">Largura da Mesa (bf)</Label>
                <Input
                  id="bf"
                  type="number"
                  step="0.1"
                  value={formData.bf || ""}
                  onChange={(e) => updateField("bf", e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hf">Altura da Mesa (hf)</Label>
                <Input
                  id="hf"
                  type="number"
                  step="0.1"
                  value={formData.hf || ""}
                  onChange={(e) => updateField("hf", e.target.value)}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bw">Largura da Alma (bw)</Label>
                <Input
                  id="bw"
                  type="number"
                  step="0.1"
                  value={formData.bw || ""}
                  onChange={(e) => updateField("bw", e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="h">Altura Total (h)</Label>
                <Input
                  id="h"
                  type="number"
                  step="0.1"
                  value={formData.h || ""}
                  onChange={(e) => updateField("h", e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>
          )}

          {/* I-Section Fields */}
          {sectionType === "I" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bf">Mesa Superior (bf)</Label>
                <Input
                  id="bf"
                  type="number"
                  step="0.1"
                  value={formData.bf || ""}
                  onChange={(e) => updateField("bf", e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hf">Altura Mesa Sup. (hf)</Label>
                <Input
                  id="hf"
                  type="number"
                  step="0.1"
                  value={formData.hf || ""}
                  onChange={(e) => updateField("hf", e.target.value)}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bw">Largura Alma (bw)</Label>
                <Input
                  id="bw"
                  type="number"
                  step="0.1"
                  value={formData.bw || ""}
                  onChange={(e) => updateField("bw", e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="h">Altura Total (h)</Label>
                <Input
                  id="h"
                  type="number"
                  step="0.1"
                  value={formData.h || ""}
                  onChange={(e) => updateField("h", e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bi">Mesa Inferior (bi)</Label>
                <Input
                  id="bi"
                  type="number"
                  step="0.1"
                  value={formData.bi || ""}
                  onChange={(e) => updateField("bi", e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hi">Altura Mesa Inf. (hi)</Label>
                <Input
                  id="hi"
                  type="number"
                  step="0.1"
                  value={formData.hi || ""}
                  onChange={(e) => updateField("hi", e.target.value)}
                  placeholder="12"
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Calculando..." : "Calcular Propriedades"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SectionForm;
