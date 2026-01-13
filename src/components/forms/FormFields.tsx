"use client";

/**
 * Shared Form Components
 * Reusable input fields for calculation forms
 */

interface InputFieldProps {
  label: string;
  name: string;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  unit?: string;
  type?: string;
  placeholder?: string;
}

export function InputField({
  label,
  name,
  value,
  onChange,
  unit,
  type = "number",
  placeholder = "0.00",
}: InputFieldProps) {
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

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  options: SelectOption[];
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: SelectFieldProps) {
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

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "warning";
}

export function FormSection({
  title,
  children,
  variant = "default",
}: FormSectionProps) {
  const bgClasses = {
    default: "bg-slate-50 border-slate-200",
    primary: "bg-blue-50 border-blue-200",
    warning: "bg-amber-50 border-amber-200",
  };

  const titleClasses = {
    default: "text-slate-700",
    primary: "text-blue-700",
    warning: "text-amber-700",
  };

  return (
    <div className={`p-3 border rounded-lg ${bgClasses[variant]}`}>
      <p className={`text-sm font-medium mb-2 ${titleClasses[variant]}`}>
        {title}
      </p>
      {children}
    </div>
  );
}

// Common Select Options
export const CONCRETE_OPTIONS = [
  { value: "C20", label: "C20" },
  { value: "C25", label: "C25" },
  { value: "C30", label: "C30" },
  { value: "C35", label: "C35" },
  { value: "C40", label: "C40" },
  { value: "C45", label: "C45" },
  { value: "C50", label: "C50" },
];

export const STEEL_OPTIONS = [
  { value: "CA-50", label: "CA-50" },
  { value: "CA-60", label: "CA-60" },
];

export const CAA_OPTIONS = [
  { value: "I", label: "CAA I - Fraca" },
  { value: "II", label: "CAA II - Moderada" },
  { value: "III", label: "CAA III - Forte" },
  { value: "IV", label: "CAA IV - Muito Forte" },
];

export const SHEAR_MODEL_OPTIONS = [
  { value: "1", label: "Modelo I (θ=45°)" },
  { value: "2", label: "Modelo II (θ variável)" },
];

export const PILLAR_TYPE_OPTIONS = [
  { value: "internal", label: "Interno" },
  { value: "edge", label: "Borda" },
  { value: "corner", label: "Canto" },
];

export const SECTION_TYPE_OPTIONS = [
  { value: "rectangular", label: "Retangular" },
  { value: "T", label: "T (Viga T)" },
  { value: "I", label: "I (Duplo T)" },
];

export const BOND_ZONE_OPTIONS = [
  { value: "good", label: "Boa aderência" },
  { value: "poor", label: "Má aderência" },
];

export const ANCHORAGE_TYPE_OPTIONS = [
  { value: "straight", label: "Reta" },
  { value: "hook", label: "Com gancho" },
  { value: "loop", label: "Com laço" },
];
