"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  projects,
  ApiError,
  type ProjectDetail,
  type ProjectStatus,
  type AssetSummary,
} from "@/lib/api";
import { patterns, projectStatusStyles } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";
import { ProjectLoadingSkeleton } from "@/components/project-assets";
import FileGrid from "@/components/file-grid";
import AssetUploadModal from "@/components/asset-upload-modal";

// ─── Transiciones disponibles para el editor ─────────────────────────────────

type TransitionDef = { to: ProjectStatus; label: string };

const TRANSITIONS: Record<ProjectStatus, TransitionDef[]> = {
  DRAFT:             [{ to: "IN_REVIEW",        label: "Enviar a revisión"     }],
  IN_REVIEW:         [],   // acción del cliente
  CHANGES_REQUESTED: [{ to: "IN_REVIEW",        label: "Re-enviar a revisión"  }],
  APPROVED:          [{ to: "DELIVERED",        label: "Marcar como entregado" }],
  DELIVERED:         [],
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ─── StatusButton ─────────────────────────────────────────────────────────────

function StatusButton({
  status,
  projectId,
  onUpdated,
}: {
  status:    ProjectStatus;
  projectId: string;
  onUpdated: (s: ProjectStatus) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const transitions = TRANSITIONS[status];

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  if (transitions.length === 0) return null;

  async function apply(to: ProjectStatus) {
    setLoading(true);
    setOpen(false);
    try {
      await projects.updateStatus(projectId, to);
      onUpdated(to);
      const labels: Partial<Record<ProjectStatus, string>> = {
        IN_REVIEW: "Proyecto enviado a revisión",
        DELIVERED: "Proyecto marcado como entregado",
      };
      toast.success(labels[to] ?? "Estado actualizado");
    } catch {
      toast.error("No se pudo actualizar el estado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={cn(
          patterns.btnSecondary,
          "text-xs py-1.5 px-3 gap-1.5",
          loading && "opacity-60 cursor-not-allowed"
        )}
      >
        {loading ? "Actualizando…" : "Cambiar estado"}
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 top-full mt-1.5 z-20 min-w-[210px]",
          "bg-surface-700 border border-white/[0.08] rounded-lg",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden py-1"
        )}>
          {transitions.map((t) => (
            <button
              key={t.to}
              onClick={() => apply(t.to)}
              className="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:text-ink-950 hover:bg-white/[0.04] transition-colors duration-100"
            >
              {t.label}
              <span className={cn(
                "ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded",
                projectStatusStyles[t.to].className
              )}>
                {projectStatusStyles[t.to].label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icons extra ─────────────────────────────────────────────────────────────

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

// ─── Banners de contexto ──────────────────────────────────────────────────────

function ContextBanner({ status }: { status: ProjectStatus }) {
  if (status === "IN_REVIEW") {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-info-500/[0.07] border border-info-500/20 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-info-400 shrink-0" />
        <p className="text-sm text-info-300">
          Proyecto enviado a revisión. Esperando respuesta del cliente.
        </p>
      </div>
    );
  }
  if (status === "CHANGES_REQUESTED") {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-500/[0.07] border border-warning-500/20 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-warning-400 shrink-0 animate-pulse" />
        <p className="text-sm text-warning-300">
          El cliente solicitó cambios. Revisá los comentarios y re-enviá a revisión cuando estés listo.
        </p>
      </div>
    );
  }
  if (status === "APPROVED") {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-success-500/[0.07] border border-success-500/20 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-success-400 shrink-0" />
        <p className="text-sm text-success-300">
          Proyecto aprobado por el cliente. Podés marcarlo como entregado cuando estés listo.
        </p>
      </div>
    );
  }
  return null;
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/editor" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 mb-8">
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Mis proyectos
      </Link>
      <div className="py-14 text-center">
        <p className="text-sm text-error-400">{message}</p>
        <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditorProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [project,     setProject]     = useState<ProjectDetail | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showUpload,  setShowUpload]  = useState(false);

  useEffect(() => {
    if (!id) return;
    projects
      .getById(id)
      .then(setProject)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el proyecto")
      )
      .finally(() => setLoading(false));
  }, [id]);

  function handleFolderRenamed(folderId: string, newName: string) {
    setProject((prev) =>
      prev
        ? { ...prev, folders: prev.folders.map((f) => f.id === folderId ? { ...f, name: newName } : f) }
        : null
    );
  }

  function handleAssetCreated(asset: AssetSummary) {
    setProject((prev) => {
      if (!prev) return null;
      if (asset.folderId) {
        return {
          ...prev,
          folders: prev.folders.map((f) =>
            f.id === asset.folderId ? { ...f, assets: [...f.assets, asset] } : f
          ),
        };
      }
      return { ...prev, assets: [...prev.assets, asset] };
    });
    setShowUpload(false);
  }

  if (loading)           return <ProjectLoadingSkeleton />;
  if (error || !project) return <ErrorState message={error ?? "Proyecto no encontrado"} />;

  const totalAssets =
    project.assets.length +
    project.folders.reduce((sum, f) => sum + f.assets.length, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <Link
        href="/editor"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 transition-colors duration-150 mb-6"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Mis proyectos
      </Link>

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-ink-950 leading-tight truncate">
              {project.name}
            </h1>
            <span className={cn(
              patterns.badge,
              projectStatusStyles[project.status].className,
              "text-xs px-2 py-0.5"
            )}>
              {projectStatusStyles[project.status].label}
            </span>
          </div>

          <p className={cn(patterns.metaInline, "mt-1.5")}>
            <span>{project.client.user.name}</span>
            <span>·</span>
            <span>{formatRelative(project.updatedAt)}</span>
            {totalAssets > 0 && (
              <>
                <span>·</span>
                <span>{totalAssets} {totalAssets === 1 ? "archivo" : "archivos"}</span>
              </>
            )}
          </p>
        </div>

        <div className="shrink-0">
          <StatusButton
            status={project.status}
            projectId={project.id}
            onUpdated={(s) => setProject((p) => p ? { ...p, status: s } : null)}
          />
        </div>
      </div>

      {/* Banner contextual según estado */}
      <ContextBanner status={project.status} />

      {/* Grid de archivos */}
      <div className={patterns.sectionGap}>
        <div className="flex items-center justify-between mb-4">
          <p className={patterns.sectionLabel}>Archivos del proyecto</p>
          <button
            onClick={() => setShowUpload(true)}
            className={cn(patterns.btnGhost, "text-xs gap-1.5 px-2 py-1 h-auto")}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar archivo
          </button>
        </div>
        <FileGrid
          projectId={project.id}
          folders={project.folders}
          rootAssets={project.assets}
          onFolderRenamed={handleFolderRenamed}
        />
      </div>

      {/* Modal subida */}
      {showUpload && (
        <AssetUploadModal
          projectId={project.id}
          folders={project.folders}
          onCreated={handleAssetCreated}
          onClose={() => setShowUpload(false)}
        />
      )}

    </div>
  );
}
