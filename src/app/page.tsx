import { patterns, projectStatusStyles, videoTypeStyles } from "@/lib/tokens";

/**
 * Página temporal — preview del design system.
 * Se reemplaza por el login una vez establecida la base.
 */
export default function DesignSystemPreview() {
  return (
    <div className="min-h-full p-10 max-w-2xl mx-auto space-y-12">

      {/* Header */}
      <div>
        <p className={patterns.sectionLabel}>EditFlow</p>
        <h1 className="text-2xl font-semibold text-ink-950 mt-1">Design System</h1>
        <p className="text-sm text-ink-500 mt-1">
          Preview de tokens, colores y patrones de UI.
        </p>
      </div>

      {/* Colores brand */}
      <section>
        <p className={patterns.sectionLabel}>Brand — Naranja</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[50,100,200,300,400,500,600,700,800,900].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-md"
                style={{ background: `var(--color-brand-${n})` }}
              />
              <span className="text-[10px] text-ink-500">{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Superficie */}
      <section className={patterns.sectionGap}>
        <p className={patterns.sectionLabel}>Superficie</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[500,600,700,800,900,950].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-md border border-white/10"
                style={{ background: `var(--color-surface-${n})` }}
              />
              <span className="text-[10px] text-ink-500">{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tipografía */}
      <section className={patterns.sectionGap}>
        <p className={patterns.sectionLabel}>Tipografía</p>
        <div className="mt-3 space-y-3">
          <p className="text-2xl font-semibold text-ink-950">Display — Títulos de página</p>
          <p className="text-base text-ink-900">Body — Contenido principal, legible y limpio</p>
          <p className="text-sm text-ink-700">Secondary — Descripciones, datos de soporte</p>
          <p className="text-xs text-ink-500">Caption — Timestamps, metadata, etiquetas</p>
        </div>
      </section>

      {/* Botones */}
      <section className={patterns.sectionGap}>
        <p className={patterns.sectionLabel}>Botones</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className={patterns.btnPrimary}>Acción principal</button>
          <button className={patterns.btnSecondary}>Secundario</button>
          <button className={patterns.btnGhost}>Ghost</button>
          <button className={patterns.btnDanger}>Eliminar</button>
        </div>
      </section>

      {/* Inputs */}
      <section className={patterns.sectionGap}>
        <p className={patterns.sectionLabel}>Inputs</p>
        <div className="mt-3 max-w-sm space-y-3">
          <div>
            <label className={patterns.label}>Email</label>
            <input className={patterns.input} type="email" placeholder="editor@editflow.com" />
          </div>
          <div>
            <label className={patterns.label}>Nombre del proyecto</label>
            <input className={patterns.input} type="text" placeholder="Campaña verano 2025" />
          </div>
        </div>
      </section>

      {/* Lista sin cajas */}
      <section className={patterns.sectionGap}>
        <p className={patterns.sectionLabel}>Lista — sin cajas</p>
        <p className="text-xs text-ink-500 mb-3 mt-1">
          Separación por líneas finas y hover, no por bordes de card.
        </p>
        <div>
          {["Campaña verano 2025", "Reels marzo — MarcaX", "Video corporativo Q1"].map((name, i) => (
            <div key={i} className={patterns.listRow}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-950 truncate">{name}</p>
                <p className={`${patterns.metaInline} mt-0.5`}>
                  <span>hace 2 días</span>
                  <span>·</span>
                  <span>3 videos</span>
                </p>
              </div>
              <span className={`${patterns.badge} ${projectStatusStyles.IN_REVIEW.className}`}>
                {projectStatusStyles.IN_REVIEW.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Status badges */}
      <section className={patterns.sectionGap}>
        <p className={patterns.sectionLabel}>Status — Proyecto</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.values(projectStatusStyles).map(({ label, className }) => (
            <span key={label} className={`${patterns.badge} ${className}`}>{label}</span>
          ))}
        </div>
        <p className={`${patterns.sectionLabel} mt-4`}>Status — Video</p>
        <div className="flex gap-2 mt-2">
          {Object.values(videoTypeStyles).map(({ label, className }) => (
            <span key={label} className={`${patterns.badge} ${className}`}>{label}</span>
          ))}
        </div>
      </section>

      {/* Panel — con criterio */}
      <section className={patterns.sectionGap}>
        <p className={patterns.sectionLabel}>Panel — usar con criterio</p>
        <p className="text-xs text-ink-500 mb-3 mt-1">
          Solo cuando el contenido genuinamente necesita estar agrupado.
        </p>
        <div className={patterns.panel}>
          <p className="text-sm font-medium text-ink-950">Drive conectado</p>
          <p className="text-xs text-ink-500 mt-1">Carpeta: /EditFlow/Clientes/MarcaX</p>
        </div>
      </section>

    </div>
  );
}
