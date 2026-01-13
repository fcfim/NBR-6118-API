"use client";

import { useState } from "react";
import { ChartsPanel } from "@/components/charts/ChartsPanel";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Calculator,
  Layers,
  LayoutList,
  Columns3,
  Grid2x2,
  Anchor,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Types
interface CalculationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

type ModuleKey =
  | "section"
  | "beam-flexure"
  | "beam-shear"
  | "beam-torsion"
  | "column"
  | "slab"
  | "anchorage"
  | "deflection"
  | "cracking"
  | "punching";

const MODULES: {
  key: ModuleKey;
  name: string;
  icon: React.ReactNode;
  endpoint: string;
  category: string;
}[] = [
  {
    key: "section",
    name: "Propriedades de Seções",
    icon: <Layers className="w-4 h-4" />,
    endpoint: "/api/v1/section/properties",
    category: "Básico",
  },
  {
    key: "beam-flexure",
    name: "Flexão de Vigas",
    icon: <LayoutList className="w-4 h-4" />,
    endpoint: "/api/v1/beam/design/reinforced-concrete/longitudinal",
    category: "Vigas ELU",
  },
  {
    key: "beam-shear",
    name: "Cisalhamento de Vigas",
    icon: <LayoutList className="w-4 h-4" />,
    endpoint: "/api/v1/beam/design/shear",
    category: "Vigas ELU",
  },
  {
    key: "beam-torsion",
    name: "Torção de Vigas",
    icon: <LayoutList className="w-4 h-4" />,
    endpoint: "/api/v1/beam/design/torsion",
    category: "Vigas ELU",
  },
  {
    key: "deflection",
    name: "Verificação de Flechas",
    icon: <LayoutList className="w-4 h-4" />,
    endpoint: "/api/v1/beam/verify/deflection",
    category: "Vigas ELS",
  },
  {
    key: "cracking",
    name: "Verificação de Fissuração",
    icon: <LayoutList className="w-4 h-4" />,
    endpoint: "/api/v1/beam/verify/cracking",
    category: "Vigas ELS",
  },
  {
    key: "column",
    name: "Dimensionamento de Pilares",
    icon: <Columns3 className="w-4 h-4" />,
    endpoint: "/api/v1/column/design",
    category: "Pilares",
  },
  {
    key: "slab",
    name: "Dimensionamento de Lajes",
    icon: <Grid2x2 className="w-4 h-4" />,
    endpoint: "/api/v1/slab/design",
    category: "Lajes",
  },
  {
    key: "punching",
    name: "Verificação de Punção",
    icon: <Grid2x2 className="w-4 h-4" />,
    endpoint: "/api/v1/slab/verify/punching",
    category: "Lajes",
  },
  {
    key: "anchorage",
    name: "Ancoragem e Emendas",
    icon: <Anchor className="w-4 h-4" />,
    endpoint: "/api/v1/detailing/anchorage",
    category: "Detalhamento",
  },
];

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("section");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async (data: Record<string, unknown>) => {
    const selectedModule = MODULES.find((m) => m.key === activeModule);
    if (!selectedModule) return;

    setIsCalculating(true);
    setResult(null);

    try {
      const response = await fetch(selectedModule.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      setResult({ success: json.success, data: json.data, error: json.error });
    } catch {
      setResult({ success: false, error: "Erro de conexão com o servidor" });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Module Selection */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Módulos</h2>
              </div>
              <nav className="p-2">
                {Object.entries(
                  MODULES.reduce((acc, m) => {
                    if (!acc[m.category]) acc[m.category] = [];
                    acc[m.category].push(m);
                    return acc;
                  }, {} as Record<string, typeof MODULES>)
                ).map(([category, modules]) => (
                  <div key={category} className="mb-3">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-1">
                      {category}
                    </p>
                    {modules.map((module) => (
                      <button
                        key={module.key}
                        onClick={() => {
                          setActiveModule(module.key);
                          setResult(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          activeModule === module.key
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {module.icon}
                        <span className="flex-1">{module.name}</span>
                        {activeModule === module.key && (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Input Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="font-semibold text-slate-900">
                    {MODULES.find((m) => m.key === activeModule)?.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Parâmetros de entrada
                  </p>
                </div>
                <div className="p-4">
                  <ModuleForm
                    moduleKey={activeModule}
                    onCalculate={handleCalculate}
                    isCalculating={isCalculating}
                  />
                </div>
              </div>

              {/* Results Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="font-semibold text-slate-900">Resultados</h2>
                  <p className="text-sm text-slate-500">Saída do cálculo</p>
                </div>
                <div className="p-4">
                  <ResultsPanel result={result} isCalculating={isCalculating} />
                </div>
              </div>
            </div>

            {/* Charts Panel - below the two columns */}
            <ChartsPanel result={result} activeModule={activeModule} />
          </main>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Module Form Component
function ModuleForm({
  moduleKey,
  onCalculate,
  isCalculating,
}: {
  moduleKey: ModuleKey;
  onCalculate: (data: Record<string, unknown>) => void;
  isCalculating: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(buildPayload(moduleKey, formData));
  };

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderFormFields(moduleKey, formData, updateField)}

      <button
        type="submit"
        disabled={isCalculating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isCalculating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Calculando...
          </>
        ) : (
          <>
            <Calculator className="w-4 h-4" />
            Calcular
          </>
        )}
      </button>
    </form>
  );
}

// Input Field Component
function InputField({
  label,
  name,
  value,
  onChange,
  unit,
  type = "number",
  placeholder = "0.00",
}: {
  label: string;
  name: string;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  unit?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{" "}
        {unit && <span className="text-slate-400 font-normal">({unit})</span>}
      </label>
      <input
        type={type}
        step="any"
        value={(value as string) || ""}
        onChange={(e) =>
          onChange(
            name,
            type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
          )
        }
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
    </div>
  );
}

// Select Field Component
function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select
        value={(value as string) || options[0]?.value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Render form fields based on module
function renderFormFields(
  moduleKey: ModuleKey,
  formData: Record<string, unknown>,
  updateField: (key: string, value: unknown) => void
) {
  switch (moduleKey) {
    case "section": {
      const sectionType = (formData.type as string) || "rectangular";
      return (
        <div className="space-y-4">
          <SelectField
            label="Tipo de Seção"
            name="type"
            value={formData.type}
            onChange={updateField}
            options={[
              { value: "rectangular", label: "Retangular" },
              { value: "T", label: "T (Viga T)" },
              { value: "I", label: "I (Duplo T)" },
            ]}
          />

          {/* Rectangular Section Fields */}
          {sectionType === "rectangular" && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Dimensões
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Largura (b)"
                  name="width"
                  value={formData.width}
                  onChange={updateField}
                  unit="cm"
                />
                <InputField
                  label="Altura (h)"
                  name="height"
                  value={formData.height}
                  onChange={updateField}
                  unit="cm"
                />
              </div>
            </div>
          )}

          {/* T-Section Fields */}
          {sectionType === "T" && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-2">
                  Mesa (Flange)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Largura mesa (bf)"
                    name="bf"
                    value={formData.bf}
                    onChange={updateField}
                    unit="cm"
                  />
                  <InputField
                    label="Altura mesa (hf)"
                    name="hf"
                    value={formData.hf}
                    onChange={updateField}
                    unit="cm"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Alma (Web)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Largura alma (bw)"
                    name="bw"
                    value={formData.bw}
                    onChange={updateField}
                    unit="cm"
                  />
                  <InputField
                    label="Altura total (h)"
                    name="h"
                    value={formData.h}
                    onChange={updateField}
                    unit="cm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* I-Section Fields */}
          {sectionType === "I" && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-2">
                  Mesa Superior
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Largura (bf)"
                    name="bf"
                    value={formData.bf}
                    onChange={updateField}
                    unit="cm"
                  />
                  <InputField
                    label="Altura (hf)"
                    name="hf"
                    value={formData.hf}
                    onChange={updateField}
                    unit="cm"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-2">Alma</p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Largura (bw)"
                    name="bw"
                    value={formData.bw}
                    onChange={updateField}
                    unit="cm"
                  />
                  <InputField
                    label="Altura total (h)"
                    name="h"
                    value={formData.h}
                    onChange={updateField}
                    unit="cm"
                  />
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-700 mb-2">
                  Mesa Inferior
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Largura (bi)"
                    name="bi"
                    value={formData.bi}
                    onChange={updateField}
                    unit="cm"
                  />
                  <InputField
                    label="Altura (hi)"
                    name="hi"
                    value={formData.hi}
                    onChange={updateField}
                    unit="cm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    case "beam-flexure":
      return (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Seção</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Largura"
                name="width"
                value={formData.width}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="Altura"
                name="height"
                value={formData.height}
                onChange={updateField}
                unit="cm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Concreto"
              name="concrete"
              value={formData.concrete}
              onChange={updateField}
              options={[
                { value: "C20", label: "C20" },
                { value: "C25", label: "C25" },
                { value: "C30", label: "C30" },
                { value: "C35", label: "C35" },
                { value: "C40", label: "C40" },
              ]}
            />
            <SelectField
              label="Aço"
              name="steel"
              value={formData.steel}
              onChange={updateField}
              options={[
                { value: "CA-50", label: "CA-50" },
                { value: "CA-60", label: "CA-60" },
              ]}
            />
          </div>
          <InputField
            label="Momento Fletor"
            name="mk"
            value={formData.mk}
            onChange={updateField}
            unit="kN.m"
          />
          <InputField
            label="Cobrimento"
            name="cover"
            value={formData.cover}
            onChange={updateField}
            unit="cm"
          />
        </div>
      );

    case "beam-shear":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Largura (bw)"
              name="width"
              value={formData.width}
              onChange={updateField}
              unit="cm"
            />
            <InputField
              label="Altura (h)"
              name="height"
              value={formData.height}
              onChange={updateField}
              unit="cm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Concreto"
              name="concrete"
              value={formData.concrete}
              onChange={updateField}
              options={[
                { value: "C25", label: "C25" },
                { value: "C30", label: "C30" },
              ]}
            />
            <SelectField
              label="Aço Estribo"
              name="steel"
              value={formData.steel}
              onChange={updateField}
              options={[
                { value: "CA-50", label: "CA-50" },
                { value: "CA-60", label: "CA-60" },
              ]}
            />
          </div>
          <InputField
            label="Força Cortante (Vsd)"
            name="vsd"
            value={formData.vsd}
            onChange={updateField}
            unit="kN"
          />
          <InputField
            label="Altura útil (d)"
            name="d"
            value={formData.d}
            onChange={updateField}
            unit="cm"
          />
          <SelectField
            label="Modelo de Cálculo"
            name="model"
            value={formData.model}
            onChange={updateField}
            options={[
              { value: "1", label: "Modelo I (θ=45°)" },
              { value: "2", label: "Modelo II (θ variável)" },
            ]}
          />
        </div>
      );

    case "column":
      return (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Geometria</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Dim. X (bx)"
                name="bx"
                value={formData.bx}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="Dim. Y (by)"
                name="by"
                value={formData.by}
                onChange={updateField}
                unit="cm"
              />
            </div>
          </div>
          <InputField
            label="Comprimento"
            name="length"
            value={formData.length}
            onChange={updateField}
            unit="cm"
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Concreto"
              name="concrete"
              value={formData.concrete}
              onChange={updateField}
              options={[
                { value: "C25", label: "C25" },
                { value: "C30", label: "C30" },
                { value: "C35", label: "C35" },
              ]}
            />
            <SelectField
              label="Aço"
              name="steel"
              value={formData.steel}
              onChange={updateField}
              options={[{ value: "CA-50", label: "CA-50" }]}
            />
          </div>
          <InputField
            label="Força Normal (Nd)"
            name="nd"
            value={formData.nd}
            onChange={updateField}
            unit="kN"
          />
          <InputField
            label="Momento X Topo"
            name="mx_top"
            value={formData.mx_top}
            onChange={updateField}
            unit="kN.cm"
          />
        </div>
      );

    case "slab":
      return (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Geometria</p>
            <div className="grid grid-cols-3 gap-3">
              <InputField
                label="Lx"
                name="Lx"
                value={formData.Lx}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="Ly"
                name="Ly"
                value={formData.Ly}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="h"
                name="h"
                value={formData.h}
                onChange={updateField}
                unit="cm"
              />
            </div>
          </div>
          <SelectField
            label="Concreto"
            name="concrete"
            value={formData.concrete}
            onChange={updateField}
            options={[
              { value: "C25", label: "C25" },
              { value: "C30", label: "C30" },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Carga Permanente"
              name="dead"
              value={formData.dead}
              onChange={updateField}
              unit="kN/m²"
            />
            <InputField
              label="Carga Acidental"
              name="live"
              value={formData.live}
              onChange={updateField}
              unit="kN/m²"
            />
          </div>
        </div>
      );

    case "anchorage":
      return (
        <div className="space-y-4">
          <InputField
            label="Diâmetro da Barra"
            name="diameter"
            value={formData.diameter}
            onChange={updateField}
            unit="mm"
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Concreto"
              name="concrete"
              value={formData.concrete}
              onChange={updateField}
              options={[
                { value: "C25", label: "C25" },
                { value: "C30", label: "C30" },
              ]}
            />
            <SelectField
              label="Aço"
              name="steel"
              value={formData.steel}
              onChange={updateField}
              options={[{ value: "CA-50", label: "CA-50" }]}
            />
          </div>
          <SelectField
            label="Tipo de Ancoragem"
            name="anchorageType"
            value={formData.anchorageType}
            onChange={updateField}
            options={[
              { value: "straight", label: "Reta" },
              { value: "hook_90", label: "Gancho 90°" },
              { value: "hook_180", label: "Gancho 180°" },
            ]}
          />
          <SelectField
            label="Zona de Aderência"
            name="bondZone"
            value={formData.bondZone}
            onChange={updateField}
            options={[
              { value: "good", label: "Boa" },
              { value: "poor", label: "Má" },
            ]}
          />
        </div>
      );

    case "beam-torsion":
      return (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Seção</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Largura (bw)"
                name="width"
                value={formData.width}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="Altura (h)"
                name="height"
                value={formData.height}
                onChange={updateField}
                unit="cm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Concreto"
              name="concrete"
              value={formData.concrete}
              onChange={updateField}
              options={[
                { value: "C25", label: "C25" },
                { value: "C30", label: "C30" },
                { value: "C35", label: "C35" },
              ]}
            />
            <SelectField
              label="Aço"
              name="steel"
              value={formData.steel}
              onChange={updateField}
              options={[
                { value: "CA-50", label: "CA-50" },
                { value: "CA-60", label: "CA-60" },
              ]}
            />
          </div>
          <InputField
            label="Momento de Torção (Tsd)"
            name="tsd"
            value={formData.tsd}
            onChange={updateField}
            unit="kN.m"
          />
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-700 mb-2">
              Interação Torção-Cisalhamento (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Força Cortante (Vsd)"
                name="vsd"
                value={formData.vsd}
                onChange={updateField}
                unit="kN"
              />
              <InputField
                label="VRd2 do Cisalhamento"
                name="vrd2"
                value={formData.vrd2}
                onChange={updateField}
                unit="kN"
              />
            </div>
          </div>
        </div>
      );

    case "punching":
      return (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Laje</p>
            <InputField
              label="Espessura (h)"
              name="h"
              value={formData.h}
              onChange={updateField}
              unit="cm"
            />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Pilar</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Dimensão a"
                name="a"
                value={formData.a}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="Dimensão b"
                name="b"
                value={formData.b}
                onChange={updateField}
                unit="cm"
              />
            </div>
            <div className="mt-3">
              <SelectField
                label="Posição do Pilar"
                name="pillarType"
                value={formData.pillarType}
                onChange={updateField}
                options={[
                  { value: "internal", label: "Interno" },
                  { value: "edge", label: "Borda" },
                  { value: "corner", label: "Canto" },
                ]}
              />
            </div>
          </div>
          <SelectField
            label="Concreto"
            name="concrete"
            value={formData.concrete}
            onChange={updateField}
            options={[
              { value: "C25", label: "C25" },
              { value: "C30", label: "C30" },
              { value: "C35", label: "C35" },
            ]}
          />
          <InputField
            label="Força de Punção (Fsd)"
            name="fsd"
            value={formData.fsd}
            onChange={updateField}
            unit="kN"
          />
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Taxas de Armadura
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="ρx"
                name="rho_x"
                value={formData.rho_x}
                onChange={updateField}
                placeholder="0.005"
              />
              <InputField
                label="ρy"
                name="rho_y"
                value={formData.rho_y}
                onChange={updateField}
                placeholder="0.005"
              />
            </div>
          </div>
        </div>
      );

    case "deflection":
      return (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Seção</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Largura (bw)"
                name="width"
                value={formData.width}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="Altura (h)"
                name="height"
                value={formData.height}
                onChange={updateField}
                unit="cm"
              />
            </div>
          </div>
          <SelectField
            label="Concreto"
            name="concrete"
            value={formData.concrete}
            onChange={updateField}
            options={[
              { value: "C25", label: "C25" },
              { value: "C30", label: "C30" },
            ]}
          />
          <InputField
            label="Vão (L)"
            name="span"
            value={formData.span}
            onChange={updateField}
            unit="cm"
          />
          <InputField
            label="Momento Característico (Mk)"
            name="mk"
            value={formData.mk}
            onChange={updateField}
            unit="kN.m"
          />
          <InputField
            label="Área de Aço (As)"
            name="as"
            value={formData.as}
            onChange={updateField}
            unit="cm²"
          />
        </div>
      );

    case "cracking":
      return (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Seção</p>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Largura (bw)"
                name="width"
                value={formData.width}
                onChange={updateField}
                unit="cm"
              />
              <InputField
                label="Altura (h)"
                name="height"
                value={formData.height}
                onChange={updateField}
                unit="cm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Diâmetro da Barra"
              name="diameter"
              value={formData.diameter}
              onChange={updateField}
              unit="mm"
            />
            <InputField
              label="Área de Aço (As)"
              name="as"
              value={formData.as}
              onChange={updateField}
              unit="cm²"
            />
          </div>
          <SelectField
            label="Concreto"
            name="concrete"
            value={formData.concrete}
            onChange={updateField}
            options={[
              { value: "C25", label: "C25" },
              { value: "C30", label: "C30" },
            ]}
          />
          <InputField
            label="Momento de Serviço (Ms)"
            name="ms"
            value={formData.ms}
            onChange={updateField}
            unit="kN.m"
          />
          <SelectField
            label="Classe de Agressividade"
            name="caa"
            value={formData.caa}
            onChange={updateField}
            options={[
              { value: "I", label: "CAA I - Fraca" },
              { value: "II", label: "CAA II - Moderada" },
              { value: "III", label: "CAA III - Forte" },
              { value: "IV", label: "CAA IV - Muito Forte" },
            ]}
          />
        </div>
      );

    default:
      return (
        <div className="text-center text-slate-500 py-8">
          <p>Formulário em desenvolvimento</p>
        </div>
      );
  }
}

// Build API payload
function buildPayload(
  moduleKey: ModuleKey,
  formData: Record<string, unknown>
): Record<string, unknown> {
  switch (moduleKey) {
    case "section": {
      const type = (formData.type as string) || "rectangular";
      if (type === "rectangular") {
        return {
          type,
          width: formData.width || 20,
          height: formData.height || 50,
        };
      } else if (type === "T") {
        return {
          type,
          bf: formData.bf || 60,
          hf: formData.hf || 12,
          bw: formData.bw || 20,
          h: formData.h || 50,
        };
      } else {
        // I-Section
        return {
          type,
          bf: formData.bf || 60,
          hf: formData.hf || 12,
          bw: formData.bw || 20,
          h: formData.h || 60,
          bi: formData.bi || 60,
          hi: formData.hi || 12,
        };
      }
    }
    case "beam-flexure":
      return {
        section: {
          type: "rectangular",
          width: formData.width || 20,
          height: formData.height || 50,
        },
        materials: {
          concrete: formData.concrete || "C25",
          steel: formData.steel || "CA-50",
        },
        loading: { mk: { value: formData.mk || 45, unit: "kN.m" } },
        parameters: { concreteCover: formData.cover || 2.5 },
      };
    case "beam-shear":
      return {
        section: {
          type: "rectangular",
          width: formData.width || 20,
          height: formData.height || 50,
        },
        materials: {
          concrete: formData.concrete || "C25",
          stirrupSteel: formData.steel || "CA-50",
        },
        loading: { vsd: formData.vsd || 80 },
        parameters: {
          d: formData.d || 45,
          model: parseInt(formData.model as string) || 1,
        },
      };
    case "column":
      return {
        geometry: { bx: formData.bx || 20, by: formData.by || 40 },
        length: formData.length || 300,
        materials: {
          concrete: formData.concrete || "C30",
          steel: formData.steel || "CA-50",
        },
        loading: { nd: formData.nd || 1200, mx_top: formData.mx_top || 0 },
      };
    case "slab":
      return {
        geometry: {
          Lx: formData.Lx || 400,
          Ly: formData.Ly || 500,
          h: formData.h || 12,
        },
        materials: { concrete: formData.concrete || "C25" },
        loading: { dead: formData.dead || 5, live: formData.live || 2 },
      };
    case "anchorage":
      return {
        diameter: formData.diameter || 16,
        materials: {
          concrete: formData.concrete || "C25",
          steel: formData.steel || "CA-50",
        },
        configuration: {
          barType: "ribbed",
          bondZone: formData.bondZone || "good",
          anchorageType: formData.anchorageType || "straight",
        },
      };
    case "beam-torsion":
      return {
        section: {
          type: "rectangular",
          width: formData.width || 20,
          height: formData.height || 50,
        },
        materials: {
          concrete: formData.concrete || "C25",
          steel: formData.steel || "CA-50",
        },
        loading: {
          tsd: { value: formData.tsd || 15, unit: "kN.m" },
          vsd: formData.vsd ? { value: formData.vsd, unit: "kN" } : undefined,
          vrd2: formData.vrd2 || undefined,
        },
      };
    case "punching":
      return {
        slab: { h: formData.h || 20 },
        pillar: {
          a: formData.a || 30,
          b: formData.b || 30,
          type: formData.pillarType || "internal",
        },
        materials: { concrete: formData.concrete || "C30" },
        loading: { fsd: formData.fsd || 500 },
        reinforcement: {
          rho_x: formData.rho_x || 0.005,
          rho_y: formData.rho_y || 0.005,
        },
      };
    case "deflection":
      return {
        section: {
          type: "rectangular",
          width: formData.width || 20,
          height: formData.height || 50,
        },
        materials: { concrete: formData.concrete || "C25" },
        loading: {
          ma: { value: formData.mk || 45, unit: "kN.m" },
          span: { value: formData.span || 500, unit: "cm" },
        },
        parameters: {
          beamType: "simple",
          As: formData.as || 5,
        },
      };
    case "cracking":
      return {
        diameter: formData.diameter || 16,
        section: {
          type: "rectangular",
          width: formData.width || 20,
          height: formData.height || 50,
        },
        materials: { concrete: formData.concrete || "C25" },
        loading: { ms: { value: formData.ms || 30, unit: "kN.m" } },
        reinforcement: {
          As: formData.as || 5,
        },
        environment: { class: formData.caa || "II" },
      };
    default:
      return formData;
  }
}

// Results Panel Component
function ResultsPanel({
  result,
  isCalculating,
}: {
  result: CalculationResult | null;
  isCalculating: boolean;
}) {
  if (isCalculating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p>Processando cálculo...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
        <Calculator className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Aguardando cálculo</p>
        <p className="text-sm">Preencha os campos e clique em Calcular</p>
      </div>
    );
  }

  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-red-700">Erro no cálculo</p>
        <p className="text-sm text-red-600 mt-1">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        <p className="font-medium text-emerald-700">
          Cálculo realizado com sucesso
        </p>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-auto">
        <pre className="text-xs text-slate-700 whitespace-pre-wrap">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
