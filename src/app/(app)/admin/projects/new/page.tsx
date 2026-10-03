"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  projects,
  admin,
  ApiError,
  BATCH_SIZES,
  TIER_CONFIG,
  type ClientSummary,
  type ProjectTier,
  type BatchSize,
} from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// ─── Componente de selección tipo pill ───────────────────────────────────────

function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options:     T[];
  value:       T | undefined;
  onChange:    (v: T) => void;
  renderLabel: (v: T) => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium border transition-all duration-150",
            value === opt
              ? "bg-brand-500/15 text-brand-400 border-brand-500/30"
              : "text-ink-500 border-white/[0.08] hover:text-ink-700 hover:border-white/[0.14] hover:bg-white/[0.02]"
          )}
        >
          {renderLabel(opt)}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();

  const [clients,        setClients]        = useState<ClientSummary[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [name,       setName]       = useState("");
  const [clientId,   setClientId]   = useState("");
  const [batchSize,  setBatchSize]  = useState<BatchSize | undefined>();
  const [tier,       setTier]       = useState<ProjectTier | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    admin.clients
      .list()
      .then(setClients)
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientId) return;
    setSubmitting(true);
    setError(null);
    try {
      const project = await projects.create({
        name: name.trim(),
        clientId,
        batchSize,
        tier,
      });
      router.push(`/admin/projects/${project.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo crear el proyecto"
      );
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && clientId !== "" && !submitting;

  return (
    <div className="p-8 max-w-lg mx-auto">

      {/* Encabezado */}
      <div className="mb-8">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors mb-5"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          Proyectos
        </Link>
        <p className={patterns.sectionLabel}>Administración</p>
        <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">
          Nuevo proyecto
        </h1>
        <p className="text-sm text-ink-500 mt-1.5">
          El proyecto se crea en estado Borrador.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Nombre */}
        <div>
          <label htmlFor="name" className={patterns.label}>Nombre del proyecto</label>
          <input
            ref={nameRef}
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Reel Mayo 2026"
            className={patterns.input}
            maxLength={120}
            required
          />
        </div>

        {/* Cliente */}
        <div>
          <label htmlFor="client" className={patterns.label}>Cliente</label>
          <select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={loadingClients}
            required
            className={cn(
              patterns.input,
              "cursor-pointer appearance-none",
              clientId === "" ? "text-ink-500" : "text-ink-950"
            )}
          >
            <option value="" disabled>
              {loadingClients ? "Cargando…" : "Seleccioná un cliente"}
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="text-ink-950">
                {c.name} · {c.type === "COMPANY" ? "Empresa" : "Creador"}
              </option>
            ))}
          </select>
          {!loadingClients && clients.length === 0 && (
            <p className="text-xs text-ink-500 mt-1.5">
              No hay clientes.{" "}
              <Link href="/admin/clients/new" className="text-brand-400 hover:underline">
                Creá uno primero
              </Link>.
            </p>
          )}
        </div>

        {/* ── Plan (opcional) ──────────────────────────────────────────────── */}
        <div className={cn(patterns.sectionGap, "!pt-4 !mt-2")}>
          <p className={patterns.sectionLabel}>Plan (opcional)</p>

          {/* Tanda */}
          <div className="mb-5">
            <label className={patterns.label}>Tanda de videos</label>
            <PillGroup
              options={[...BATCH_SIZES]}
              value={batchSize}
              onChange={setBatchSize}
              renderLabel={(v) => `${v} videos`}
            />
            {batchSize && (
              <p className="text-xs text-ink-500 mt-2 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-brand-400 inline-block" />
                Se creará la carpeta <span className="text-ink-700 font-medium">"Listos - Core"</span> automáticamente
              </p>
            )}
          </div>

          {/* Nivel */}
          <div>
            <label className={patterns.label}>Nivel de edición</label>
            <div className="flex flex-col gap-2">
              {(Object.entries(TIER_CONFIG) as [ProjectTier, typeof TIER_CONFIG[ProjectTier]][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTier(tier === key ? undefined : key)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md text-left border transition-all duration-150",
                      tier === key
                        ? "bg-brand-500/10 border-brand-500/25"
                        : "border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.02]"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                      tier === key ? "border-brand-400 bg-brand-400" : "border-ink-500"
                    )} />
                    <div>
                      <span className={cn(
                        "text-sm font-medium",
                        tier === key ? "text-brand-400" : "text-ink-700"
                      )}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-ink-500 ml-2">{cfg.description}</span>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-error-400">{error}</p>}

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              patterns.btnPrimary,
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {submitting ? (
              <><Spinner />Creando…</>
            ) : (
              "Crear proyecto"
            )}
          </button>
          <Link href="/admin/projects" className={patterns.btnSecondary}>
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
