/**
 * EditFlow — Design System Tokens & Patterns v2
 *
 * Filosofía: cards sobre listas, jerarquía visual fuerte,
 * nav con pill highlight (no borde izquierdo).
 */

// ─── Colores (referencia semántica) ──────────────────────────────────────────

export const colors = {
  brand:       "brand-500",
  brandHover:  "brand-600",
  brandText:   "brand-400",
  bgApp:       "surface-950",
  bgPanel:     "surface-800",
  bgElevated:  "surface-700",
  textPrimary:   "ink-950",
  textSecondary: "ink-700",
  textMuted:     "ink-500",
  textDisabled:  "ink-300",
} as const;

// ─── Patrones ─────────────────────────────────────────────────────────────────

export const patterns = {

  // ── Navegación ───────────────────────────────────────────────────────────

  /** Item inactivo — sin borde, hover sutil */
  navItem:
    "flex items-center gap-3 py-2 px-3 text-sm rounded-lg " +
    "text-ink-500 hover:text-ink-950 hover:bg-white/[0.05] " +
    "transition-all duration-150",

  /** Item activo — pill con fondo elevado */
  navItemActive:
    "flex items-center gap-3 py-2 px-3 text-sm rounded-lg " +
    "bg-white/[0.07] text-ink-950 font-medium",

  // ── Cards ─────────────────────────────────────────────────────────────────

  /** Card base — fondo elevado, borde sutil, esquinas xl */
  card:
    "bg-surface-800 border border-white/[0.06] rounded-xl " +
    "hover:border-white/[0.12] hover:bg-surface-700 " +
    "transition-all duration-200 cursor-pointer select-none",

  /** Card de carpeta — más alto, centrado */
  cardFolder:
    "bg-surface-800 border border-white/[0.06] rounded-xl " +
    "hover:border-brand-500/30 hover:bg-surface-700 " +
    "transition-all duration-200 cursor-pointer select-none " +
    "flex flex-col items-center justify-center gap-2 p-4 aspect-square",

  // ── Lista (legacy para vistas no rediseñadas) ─────────────────────────────

  listRow:
    "flex items-center py-3 px-4 border-b border-white/[0.05] " +
    "hover:bg-white/[0.02] transition-colors duration-150 cursor-default",

  // ── Secciones ─────────────────────────────────────────────────────────────

  sectionGap:   "pt-6 mt-6 border-t border-white/[0.06]",
  sectionLabel: "text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500 mb-3",

  // ── Panel ─────────────────────────────────────────────────────────────────

  panel:     "bg-surface-800 border border-white/[0.06] rounded-xl p-5",
  panelFlat: "bg-surface-800/50 rounded-xl p-5",

  // ── Formularios ───────────────────────────────────────────────────────────

  input:
    "w-full bg-surface-700 border border-white/[0.08] rounded-lg px-3 py-2 " +
    "text-sm text-ink-950 placeholder:text-ink-500 " +
    "focus:outline-none focus:ring-1 focus:ring-brand-500/40 focus:border-brand-500/40 " +
    "transition-all duration-150",

  label: "block text-sm font-medium text-ink-700 mb-1.5",

  // ── Botones ───────────────────────────────────────────────────────────────

  btnPrimary:
    "inline-flex items-center justify-center gap-2 " +
    "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 " +
    "text-white text-sm font-medium rounded-lg px-4 py-2 " +
    "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500/50",

  btnSecondary:
    "inline-flex items-center justify-center gap-2 " +
    "bg-surface-700 hover:bg-surface-600 " +
    "text-ink-700 hover:text-ink-950 text-sm font-medium rounded-lg px-4 py-2 " +
    "border border-white/[0.08] " +
    "transition-colors duration-150",

  btnGhost:
    "inline-flex items-center justify-center gap-2 " +
    "text-ink-700 hover:text-ink-950 hover:bg-white/[0.05] " +
    "text-sm font-medium rounded-lg px-3 py-2 " +
    "transition-colors duration-150",

  btnDanger:
    "inline-flex items-center justify-center gap-2 " +
    "bg-error-500/10 hover:bg-error-500/20 " +
    "text-error-400 text-sm font-medium rounded-lg px-4 py-2 " +
    "border border-error-500/20 " +
    "transition-colors duration-150",

  // ── Badges ────────────────────────────────────────────────────────────────

  badge:     "inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded-md",
  metaInline: "text-xs text-ink-500 flex items-center gap-1.5",

} as const;

// ─── Status colors ────────────────────────────────────────────────────────────

export const projectStatusStyles: Record<
  "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "DELIVERED",
  { label: string; className: string }
> = {
  DRAFT:             { label: "Borrador",           className: "bg-ink-500/10 text-ink-500" },
  IN_REVIEW:         { label: "En revisión",         className: "bg-info-500/10 text-info-400" },
  CHANGES_REQUESTED: { label: "Cambios solicitados", className: "bg-warning-500/10 text-warning-400" },
  APPROVED:          { label: "Aprobado",            className: "bg-success-500/10 text-success-400" },
  DELIVERED:         { label: "Entregado",           className: "bg-brand-500/10 text-brand-400" },
};

export const projectTierStyles: Record<
  "BASICA" | "SIMPLE" | "PRO",
  { label: string; className: string }
> = {
  BASICA: { label: "Básica",  className: "bg-ink-500/10 text-ink-400"     },
  SIMPLE: { label: "Simple",  className: "bg-info-500/10 text-info-400"   },
  PRO:    { label: "Pro",     className: "bg-brand-500/10 text-brand-400" },
};

export const videoTypeStyles = {
  RAW:    { label: "RAW",     className: "bg-ink-500/10 text-ink-500"     },
  EDITED: { label: "Editado", className: "bg-brand-500/10 text-brand-400" },
} as const;

export const publicationStatusStyles = {
  PENDING:   { label: "Pendiente", className: "bg-warning-500/10 text-warning-400" },
  PUBLISHED: { label: "Publicado", className: "bg-success-500/10 text-success-400" },
  FAILED:    { label: "Fallido",   className: "bg-error-500/10 text-error-400"     },
} as const;
