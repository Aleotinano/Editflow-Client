"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { assetApi, ApiError } from "@/lib/api";
import type { AssetSummary, FolderWithAssets, MediaType } from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Acepta tanto un File ID crudo como una URL de Google Drive:
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/open?id=FILE_ID
 */
function parseDriveId(raw: string): string {
  const m1 = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return raw.trim();
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375Z" />
    </svg>
  );
}

function MusicalNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
    </svg>
  );
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

// ─── Sub-componente: selector de opción tipo toggle ───────────────────────────

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  value:   T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium",
            "transition-colors duration-150",
            i > 0 && "border-l border-white/[0.08]",
            value === opt.value
              ? "bg-brand-500 text-white"
              : "bg-surface-700 text-ink-500 hover:text-ink-700 hover:bg-surface-600"
          )}
        >
          {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssetUploadModalProps {
  projectId: string;
  folders:   FolderWithAssets[];
  onCreated: (asset: AssetSummary) => void;
  onClose:   () => void;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function AssetUploadModal({
  projectId,
  folders,
  onCreated,
  onClose,
}: AssetUploadModalProps) {
  const [driveInput, setDriveInput] = useState("");
  const [name,       setName]       = useState("");
  const [mediaType,  setMediaType]  = useState<MediaType>("VIDEO");
  const [assetType,  setAssetType]  = useState<"RAW" | "EDITED">("EDITED");
  const [folderId,   setFolderId]   = useState<string>("");   // "" = sin carpeta
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  // Foco automático
  useEffect(() => { firstRef.current?.focus(); }, []);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const driveFileId = parseDriveId(driveInput);
    if (!driveFileId) { setError("Ingresá el File ID o URL de Drive"); return; }
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }

    setSaving(true);
    try {
      const asset = await assetApi.create(projectId, {
        name:        name.trim(),
        driveFileId,
        mediaType,
        type:        assetType,
        folderId:    folderId || undefined,
      });
      toast.success("Archivo agregado", { description: asset.name });
      onCreated(asset);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo agregar el archivo";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const mediaTypeOptions: { value: MediaType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "VIDEO", label: "Video", icon: FilmIcon         },
    { value: "AUDIO", label: "Audio", icon: MusicalNoteIcon  },
    { value: "IMAGE", label: "Imagen", icon: PhotoIcon       },
  ];

  const assetTypeOptions = [
    { value: "EDITED" as const, label: "Editado" },
    { value: "RAW"    as const, label: "RAW"     },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-surface-800 border border-white/[0.08] rounded-2xl
        shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-ink-950">Agregar archivo</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-950 hover:bg-white/[0.05] transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Drive File ID / URL */}
          <div>
            <label className={patterns.label}>
              Google Drive — File ID o URL
            </label>
            <input
              ref={firstRef}
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/… o solo el ID"
              className={patterns.input}
              disabled={saving}
            />
            <p className="mt-1 text-[11px] text-ink-300">
              Pegá la URL del archivo de Drive o solo el ID. El archivo debe estar compartido con el servidor.
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label className={patterns.label}>Nombre del archivo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Episodio 01 - Final"
              className={patterns.input}
              disabled={saving}
            />
          </div>

          {/* Tipo de media */}
          <div>
            <label className={cn(patterns.label, "mb-2")}>Tipo de media</label>
            <ToggleGroup
              options={mediaTypeOptions}
              value={mediaType}
              onChange={setMediaType}
            />
          </div>

          {/* RAW / EDITED */}
          <div>
            <label className={cn(patterns.label, "mb-2")}>Versión</label>
            <ToggleGroup
              options={assetTypeOptions}
              value={assetType}
              onChange={setAssetType}
            />
          </div>

          {/* Carpeta (opcional) */}
          {folders.length > 0 && (
            <div>
              <label className={patterns.label}>Carpeta (opcional)</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                disabled={saving}
                className={cn(
                  patterns.input,
                  "appearance-none cursor-pointer"
                )}
              >
                <option value="">Sin carpeta (raíz)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-error-400 bg-error-500/[0.08] border border-error-500/20
              rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={patterns.btnGhost}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !driveInput.trim() || !name.trim()}
              className={cn(
                patterns.btnPrimary,
                (saving || !driveInput.trim() || !name.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {saving ? "Guardando…" : "Agregar archivo"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
