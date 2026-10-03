"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  projects,
  ApiError,
  BATCH_SIZES,
  TIER_CONFIG,
  type ProjectTier,
  type BatchSize,
} from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// ─── Descripción de cada tanda ────────────────────────────────────────────────

const BATCH_CONFIG: Record<BatchSize, { label: string; description: string }> = {
  5:  { label: "5 videos",  description: "Tanda pequeña — ideal para probar"     },
  10: { label: "10 videos", description: "Tanda estándar — la más popular"       },
  20: { label: "20 videos", description: "Tanda completa — mejor precio por video" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientNewProjectPage() {
  const router = useRouter();

  const [name,       setName]       = useState("");
  const [batchSize,  setBatchSize]  = useState<BatchSize | undefined>();
  const [tier,       setTier]       = useState<ProjectTier | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !batchSize || !tier) return;
    setSubmitting(true);
    setError(null);
    try {
      // clientId se omite — el backend lo deriva del token JWT
      const project = await projects.create({
        name:      name.trim(),
        batchSize,
        tier,
      });
      router.push(`/client/projects/${project.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo crear el proyecto"
      );
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && !!batchSize && !!tier && !submitting;

  return (
    <div className="p-8 max-w-xl mx-auto">

      {/* Encabezado */}
      <div className="mb-8">
        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors mb-5"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          Mis proyectos
        </Link>
        <p className={patterns.sectionLabel}>Cliente</p>
        <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">
          Nuevo proyecto
        </h1>
        <p className="text-sm text-ink-500 mt-1.5">
          Elegí la tanda y el nivel de edición. El equipo comenzará ni bien confirmes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* Nombre */}
        <div>
          <label htmlFor="name" className={patterns.label}>
            Nombre del proyecto
          </label>
          <input
            ref={nameRef}
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Contenido junio 2026"
            className={patterns.input}
            maxLength={120}
            autoFocus
            required
          />
        </div>

        {/* Tanda */}
        <div>
          <label className={cn(patterns.label, "mb-3")}>
            Tanda de videos
            <span className="text-error-400 ml-1">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {BATCH_SIZES.map((size) => {
              const cfg    = BATCH_CONFIG[size];
              const active = batchSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setBatchSize(size)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-lg border text-left transition-all duration-150",
                    active
                      ? "bg-brand-500/10 border-brand-500/25"
                      : "border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.02]"
                  )}
                >
                  {/* Radio circle */}
                  <span className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                    active ? "border-brand-400" : "border-ink-500"
                  )}>
                    {active && <span className="w-2 h-2 rounded-full bg-brand-400" />}
                  </span>

                  <div className="flex-1">
                    <span className={cn(
                      "text-sm font-semibold",
                      active ? "text-brand-400" : "text-ink-950"
                    )}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-ink-500 ml-2">{cfg.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nivel de edición */}
        <div>
          <label className={cn(patterns.label, "mb-3")}>
            Nivel de edición
            <span className="text-error-400 ml-1">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {(Object.entries(TIER_CONFIG) as [ProjectTier, typeof TIER_CONFIG[ProjectTier]][]).map(
              ([key, cfg]) => {
                const active = tier === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTier(key)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-lg border text-left transition-all duration-150",
                      active
                        ? "bg-brand-500/10 border-brand-500/25"
                        : "border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.02]"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                      active ? "border-brand-400" : "border-ink-500"
                    )}>
                      {active && <span className="w-2 h-2 rounded-full bg-brand-400" />}
                    </span>

                    <div className="flex-1">
                      <span className={cn(
                        "text-sm font-semibold",
                        active ? "text-brand-400" : "text-ink-950"
                      )}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-ink-500 ml-2">{cfg.description}</span>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Resumen */}
        {batchSize && tier && (
          <div className="rounded-lg border border-brand-500/15 bg-brand-500/[0.05] px-4 py-3.5">
            <p className="text-sm font-medium text-ink-950 mb-0.5">Resumen del pedido</p>
            <p className="text-xs text-ink-500">
              <span className="text-ink-700">{batchSize} videos</span>
              {" · "}
              <span className="text-ink-700">Nivel {TIER_CONFIG[tier].label}</span>
              {" · "}
              <span>Se creará la carpeta &ldquo;Listos - Core&rdquo; automáticamente</span>
            </p>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-error-400">{error}</p>}

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              patterns.btnPrimary,
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {submitting ? <><Spinner />Creando…</> : "Confirmar proyecto"}
          </button>
          <Link href="/client" className={patterns.btnSecondary}>
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  );
}

// ─── Micro ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" aria-hidden />
  );
}
