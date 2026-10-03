"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  projects,
  folders as foldersApi,
  ApiError,
  type ProjectDetail,
  type FolderWithAssets,
  type ProjectStatus,
  type AssetSummary,
} from "@/lib/api";
import { patterns, projectStatusStyles } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";
import FileGrid from "@/components/file-grid";
import AssetUploadModal from "@/components/asset-upload-modal";

// ─── Transiciones disponibles por rol ────────────────────────────────────────

type TransitionDef = { to: ProjectStatus; label: string };

const TRANSITIONS: Record<ProjectStatus, TransitionDef[]> = {
  DRAFT:             [{ to: "IN_REVIEW",         label: "Enviar a revisión"    }],
  IN_REVIEW:         [{ to: "APPROVED",           label: "Aprobar"              },
                      { to: "CHANGES_REQUESTED",  label: "Solicitar cambios"    }],
  CHANGES_REQUESTED: [{ to: "IN_REVIEW",          label: "Re-enviar a revisión" }],
  APPROVED:          [{ to: "DELIVERED",          label: "Marcar como entregado"}],
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// ─── Status change button ─────────────────────────────────────────────────────

function StatusButton({
  status,
  projectId,
  onUpdated,
}: {
  status:    ProjectStatus;
  projectId: string;
  onUpdated: (newStatus: ProjectStatus) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const transitions = TRANSITIONS[status];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (transitions.length === 0) return null;

  async function applyTransition(to: ProjectStatus) {
    setLoading(true);
    setOpen(false);
    try {
      await projects.updateStatus(projectId, to);
      onUpdated(to);
      toast.success("Estado actualizado");
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
        <ChevronRightIcon className="w-3 h-3 rotate-90" />
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 top-full mt-1.5 z-20 min-w-[200px]",
          "bg-surface-700 border border-white/[0.08] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          "overflow-hidden py-1"
        )}>
          {transitions.map((t) => (
            <button
              key={t.to}
              onClick={() => applyTransition(t.to)}
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

// ─── New folder inline ────────────────────────────────────────────────────────

function NewFolderInline({
  projectId,
  onCreated,
  onCancel,
}: {
  projectId: string;
  onCreated: (folder: FolderWithAssets) => void;
  onCancel:  () => void;
}) {
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const folder = await foldersApi.create(projectId, name.trim());
      onCreated({ ...folder, assets: [] });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "Ya existe una carpeta con ese nombre"
          : "No se pudo crear la carpeta"
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-brand-500/20 bg-brand-500/[0.04]"
    >
      <FolderIcon className="w-4 h-4 text-warning-400 shrink-0" />
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        placeholder="Nombre de la carpeta"
        className={cn(
          patterns.input,
          "flex-1 max-w-xs py-1 text-sm h-auto"
        )}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className={cn(
          patterns.btnPrimary,
          "text-xs py-1.5 px-3",
          (loading || !name.trim()) && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? "Creando…" : "Crear"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={cn(patterns.btnGhost, "text-xs py-1.5 px-2")}
      >
        Cancelar
      </button>
      {error && <span className="text-xs text-error-400">{error}</span>}
    </form>
  );
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-3 bg-white/[0.06] rounded w-24 mb-8" />
      <div className="h-7 bg-white/[0.08] rounded w-64 mb-2" />
      <div className="h-3 bg-white/[0.05] rounded w-40 mb-10" />
      <div className="h-px bg-white/[0.05] mb-6" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/[0.04] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 mb-8">
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Proyectos
      </Link>
      <div className="py-14 text-center">
        <p className="text-sm text-error-400">{message}</p>
        <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [project,       setProject]       = useState<ProjectDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload,    setShowUpload]    = useState(false);

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

  function handleFolderCreated(folder: FolderWithAssets) {
    setProject((prev) =>
      prev ? { ...prev, folders: [...prev.folders, folder] } : null
    );
    setShowNewFolder(false);
  }

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

  function handleStatusUpdated(newStatus: ProjectStatus) {
    setProject((prev) => (prev ? { ...prev, status: newStatus } : null));
  }

  if (loading)           return <LoadingState />;
  if (error || !project) return <ErrorState message={error ?? "Proyecto no encontrado"} />;

  const totalAssets =
    project.assets.length +
    project.folders.reduce((sum, f) => sum + f.assets.length, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 transition-colors duration-150 mb-6"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Proyectos
      </Link>

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-ink-950 leading-tight truncate">
              {project.name}
            </h1>
            <span className={cn(patterns.badge, projectStatusStyles[project.status].className, "text-xs px-2 py-0.5")}>
              {projectStatusStyles[project.status].label}
            </span>
          </div>

          <p className={cn(patterns.metaInline, "mt-1.5")}>
            <span>{project.client.user.name}</span>
            {project.editors.length > 0 && (
              <>
                <span>·</span>
                <span>{project.editors.map((e) => e.user.name).join(", ")}</span>
              </>
            )}
            <span>·</span>
            <span>{formatRelative(project.createdAt)}</span>
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
            onUpdated={handleStatusUpdated}
          />
        </div>
      </div>

      {/* ── Archivos ───────────────────────────────────────────────────────── */}
      <div className={patterns.sectionGap}>

        {/* Barra de acciones */}
        <div className="flex items-center justify-between mb-4">
          <p className={patterns.sectionLabel}>Archivos del proyecto</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className={cn(patterns.btnGhost, "text-xs gap-1.5 px-2 py-1 h-auto")}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Agregar archivo
            </button>
            {!showNewFolder && (
              <button
                onClick={() => setShowNewFolder(true)}
                className={cn(patterns.btnGhost, "text-xs gap-1.5 px-2 py-1 h-auto")}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Nueva carpeta
              </button>
            )}
          </div>
        </div>

        {/* Form creación inline */}
        {showNewFolder && (
          <div className="mb-5">
            <NewFolderInline
              projectId={project.id}
              onCreated={handleFolderCreated}
              onCancel={() => setShowNewFolder(false)}
            />
          </div>
        )}

        {/* Grid */}
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
