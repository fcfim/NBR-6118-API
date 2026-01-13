/**
 * Form Field Types and Payload Interfaces
 * Strongly typed interfaces for form data and API payloads
 */

export type ModuleKey =
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

// Section Types
export interface RectangularSection {
  type: "rectangular";
  width: number;
  height: number;
}

export interface TSection {
  type: "T";
  bf: number;
  hf: number;
  bw: number;
  h: number;
}

export interface ISection {
  type: "I";
  bf: number;
  hf: number;
  bw: number;
  h: number;
  bi: number;
  hi: number;
}

export type SectionPayload = RectangularSection | TSection | ISection;

// Common Material Types
export interface MaterialsPayload {
  concrete: string;
  steel?: string;
  stirrupSteel?: string;
}

// Module-specific Payloads
export interface FlexurePayload {
  section: RectangularSection;
  materials: MaterialsPayload;
  loading: { mk: { value: number; unit: string } };
  parameters: { concreteCover: number };
}

export interface ShearPayload {
  section: RectangularSection;
  materials: { concrete: string; stirrupSteel: string };
  loading: { vsd: number };
  parameters: { d: number; model: number };
}

export interface TorsionPayload {
  section: RectangularSection;
  materials: MaterialsPayload;
  loading: {
    tsd: { value: number; unit: string };
    vsd?: { value: number; unit: string };
    vrd2?: number;
  };
}

export interface ColumnPayload {
  geometry: { bx: number; by: number };
  length: number;
  materials: MaterialsPayload;
  loading: { nd: number; mx_top: number };
}

export interface SlabPayload {
  geometry: { Lx: number; Ly: number; h: number };
  materials: { concrete: string };
  loading: { dead: number; live: number };
}

export interface PunchingPayload {
  slab: { h: number };
  pillar: { a: number; b: number; type: string };
  materials: { concrete: string };
  loading: { fsd: number };
  reinforcement: { rho_x: number; rho_y: number };
}

export interface DeflectionPayload {
  section: RectangularSection;
  materials: { concrete: string };
  loading: {
    ma: { value: number; unit: string };
    span: { value: number; unit: string };
  };
  parameters: { beamType: string; As: number };
}

export interface CrackingPayload {
  diameter: number;
  section: RectangularSection;
  materials: { concrete: string };
  loading: { ms: { value: number; unit: string } };
  reinforcement: { As: number };
  environment: { class: string };
}

export interface AnchoragePayload {
  diameter: number;
  materials: MaterialsPayload;
  configuration: {
    barType: string;
    bondZone: string;
    anchorageType: string;
  };
}

// Default Values for Realistic Engineering Scenarios
export const DEFAULTS = {
  // Section
  section: {
    rectangular: { width: 20, height: 50 },
    T: { bf: 60, hf: 12, bw: 20, h: 50 },
    I: { bf: 60, hf: 12, bw: 20, h: 60, bi: 60, hi: 12 },
  },
  // Materials
  materials: {
    concrete: "C25",
    steel: "CA-50",
  },
  // Flexure
  flexure: {
    mk: 80, // kN.m - typical beam moment
    cover: 2.5, // cm
  },
  // Shear
  shear: {
    vsd: 120, // kN - typical shear force
    d: 45, // cm - effective depth
    model: 1,
  },
  // Column
  column: {
    bx: 20,
    by: 40,
    length: 300, // cm
    nd: 800, // kN - normal force
    mx_top: 50, // kN.cm - top moment
  },
  // Slab
  slab: {
    Lx: 400, // cm
    Ly: 500, // cm
    h: 12, // cm
    dead: 4, // kN/m²
    live: 2.5, // kN/m²
  },
  // Torsion
  torsion: {
    tsd: 10, // kN.m
  },
  // Punching
  punching: {
    h: 20, // cm - slab thickness
    a: 30, // cm - pillar dimension
    b: 30, // cm
    fsd: 600, // kN
    rho: 0.005,
  },
  // Deflection
  deflection: {
    mk: 70, // kN.m
    span: 500, // cm
    As: 5, // cm²
  },
  // Cracking
  cracking: {
    diameter: 16, // mm
    ms: 50, // kN.m
    As: 5, // cm²
    caa: "II",
  },
  // Anchorage
  anchorage: {
    diameter: 16,
    bondZone: "good",
    anchorageType: "straight",
  },
} as const;
