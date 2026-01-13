/**
 * Payload Builder Factory
 * Centralized payload construction for all modules
 */

import { ModuleKey, DEFAULTS } from "./types";

export function buildPayload(
  moduleKey: ModuleKey,
  formData: Record<string, unknown>
): Record<string, unknown> {
  switch (moduleKey) {
    case "section":
      return buildSectionPayload(formData);
    case "beam-flexure":
      return buildFlexurePayload(formData);
    case "beam-shear":
      return buildShearPayload(formData);
    case "beam-torsion":
      return buildTorsionPayload(formData);
    case "column":
      return buildColumnPayload(formData);
    case "slab":
      return buildSlabPayload(formData);
    case "punching":
      return buildPunchingPayload(formData);
    case "deflection":
      return buildDeflectionPayload(formData);
    case "cracking":
      return buildCrackingPayload(formData);
    case "anchorage":
      return buildAnchoragePayload(formData);
    default:
      return formData;
  }
}

function buildSectionPayload(formData: Record<string, unknown>) {
  const type = (formData.type as string) || "rectangular";
  const { rectangular, T, I } = DEFAULTS.section;

  if (type === "rectangular") {
    return {
      type,
      width: formData.width || rectangular.width,
      height: formData.height || rectangular.height,
    };
  } else if (type === "T") {
    return {
      type,
      bf: formData.bf || T.bf,
      hf: formData.hf || T.hf,
      bw: formData.bw || T.bw,
      h: formData.h || T.h,
    };
  } else {
    return {
      type,
      bf: formData.bf || I.bf,
      hf: formData.hf || I.hf,
      bw: formData.bw || I.bw,
      h: formData.h || I.h,
      bi: formData.bi || I.bi,
      hi: formData.hi || I.hi,
    };
  }
}

function buildFlexurePayload(formData: Record<string, unknown>) {
  const { rectangular } = DEFAULTS.section;
  const { flexure, materials } = DEFAULTS;

  return {
    section: {
      type: "rectangular",
      width: formData.width || rectangular.width,
      height: formData.height || rectangular.height,
    },
    materials: {
      concrete: formData.concrete || materials.concrete,
      steel: formData.steel || materials.steel,
    },
    loading: {
      mk: { value: formData.mk || flexure.mk, unit: "kN.m" },
    },
    parameters: {
      concreteCover: formData.cover || flexure.cover,
    },
  };
}

function buildShearPayload(formData: Record<string, unknown>) {
  const { rectangular } = DEFAULTS.section;
  const { shear, materials } = DEFAULTS;

  return {
    section: {
      type: "rectangular",
      width: formData.width || rectangular.width,
      height: formData.height || rectangular.height,
    },
    materials: {
      concrete: formData.concrete || materials.concrete,
      stirrupSteel: formData.steel || materials.steel,
    },
    loading: { vsd: formData.vsd || shear.vsd },
    parameters: {
      d: formData.d || shear.d,
      model: parseInt(formData.model as string) || shear.model,
    },
  };
}

function buildTorsionPayload(formData: Record<string, unknown>) {
  const { rectangular } = DEFAULTS.section;
  const { torsion, materials } = DEFAULTS;

  return {
    section: {
      type: "rectangular",
      width: formData.width || rectangular.width,
      height: formData.height || rectangular.height,
    },
    materials: {
      concrete: formData.concrete || materials.concrete,
      steel: formData.steel || materials.steel,
    },
    loading: {
      tsd: { value: formData.tsd || torsion.tsd, unit: "kN.m" },
      vsd: formData.vsd ? { value: formData.vsd, unit: "kN" } : undefined,
      vrd2: formData.vrd2 || undefined,
    },
  };
}

function buildColumnPayload(formData: Record<string, unknown>) {
  const { column, materials } = DEFAULTS;

  return {
    geometry: {
      bx: formData.bx || column.bx,
      by: formData.by || column.by,
    },
    length: formData.length || column.length,
    materials: {
      concrete: formData.concrete || "C30",
      steel: formData.steel || materials.steel,
    },
    loading: {
      nd: formData.nd || column.nd,
      mx_top: formData.mx_top || column.mx_top,
    },
  };
}

function buildSlabPayload(formData: Record<string, unknown>) {
  const { slab, materials } = DEFAULTS;

  return {
    geometry: {
      Lx: formData.Lx || slab.Lx,
      Ly: formData.Ly || slab.Ly,
      h: formData.h || slab.h,
    },
    materials: { concrete: formData.concrete || materials.concrete },
    loading: {
      dead: formData.dead || slab.dead,
      live: formData.live || slab.live,
    },
  };
}

function buildPunchingPayload(formData: Record<string, unknown>) {
  const { punching } = DEFAULTS;

  return {
    slab: { h: formData.h || punching.h },
    pillar: {
      a: formData.a || punching.a,
      b: formData.b || punching.b,
      type: formData.pillarType || "internal",
    },
    materials: { concrete: formData.concrete || "C30" },
    loading: { fsd: formData.fsd || punching.fsd },
    reinforcement: {
      rho_x: formData.rho_x || punching.rho,
      rho_y: formData.rho_y || punching.rho,
    },
  };
}

function buildDeflectionPayload(formData: Record<string, unknown>) {
  const { rectangular } = DEFAULTS.section;
  const { deflection, materials } = DEFAULTS;

  return {
    section: {
      type: "rectangular",
      width: formData.width || rectangular.width,
      height: formData.height || rectangular.height,
    },
    materials: { concrete: formData.concrete || materials.concrete },
    loading: {
      ma: { value: formData.mk || deflection.mk, unit: "kN.m" },
      span: { value: formData.span || deflection.span, unit: "cm" },
    },
    parameters: {
      beamType: "simple",
      As: formData.as || deflection.As,
    },
  };
}

function buildCrackingPayload(formData: Record<string, unknown>) {
  const { rectangular } = DEFAULTS.section;
  const { cracking, materials } = DEFAULTS;

  return {
    diameter: formData.diameter || cracking.diameter,
    section: {
      type: "rectangular",
      width: formData.width || rectangular.width,
      height: formData.height || rectangular.height,
    },
    materials: { concrete: formData.concrete || materials.concrete },
    loading: {
      ms: { value: formData.ms || cracking.ms, unit: "kN.m" },
    },
    reinforcement: { As: formData.as || cracking.As },
    environment: { class: formData.caa || cracking.caa },
  };
}

function buildAnchoragePayload(formData: Record<string, unknown>) {
  const { anchorage, materials } = DEFAULTS;

  return {
    diameter: formData.diameter || anchorage.diameter,
    materials: {
      concrete: formData.concrete || materials.concrete,
      steel: formData.steel || materials.steel,
    },
    configuration: {
      barType: "ribbed",
      bondZone: formData.bondZone || anchorage.bondZone,
      anchorageType: formData.anchorageType || anchorage.anchorageType,
    },
  };
}
