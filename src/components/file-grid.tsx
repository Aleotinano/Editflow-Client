"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { folders as foldersApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { patterns } from "@/lib/tokens";
import type { AssetSummary, FolderWithAssets } from "@/lib/api";
import AssetViewer from "@/components/asset-viewer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") ?? "";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FolderColorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <path d="M6 10C6 7.79 7.79 6 10 6H19.17C20.23 6 21.25 6.42 22 7.17L25.17 10.34C25.92 11.09 26.94 11.5 28 11.5H38C40.21 11.5 42 13.29 42 15.5V38C42 40.21 40.21 42 38 42H10C7.79 42 6 40.21 6 38V10Z"
        fill="currentColor" />
    </svg>
  );
}

function PlayCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
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

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  );
}

// ─── Audio waveform ───────────────────────────────────────────────────────────

function AudioWaveform() {
  const bars = [3, 6, 9, 5, 7, 11, 4, 8, 6, 9, 5, 7, 10, 4, 6, 8, 5, 9, 6, 4];
  return (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[2px] bg-info-400/60 rounded-full"
          style={{
            height: `${h * 3}px`,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Media thumbnail ──────────────────────────────────────────────────────────

function MediaPreview({ asset }: { asset: AssetSummary }) {
  const [imgError, setImgError] = useState(false);
  const streamUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"}/assets/${asset.id}/stream?token=${getToken()}`;

  if (asset.mediaType === "IMAGE" && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={streamUrl}
        alt={asset.name}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  if (asset.mediaType === "AUDIO") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2
        bg-gradient-to-br from-info-500/10 to-surface-700">
        <MusicalNoteIcon className="w-6 h-6 text-info-400" />
        <AudioWaveform />
      </div>
    );
  }

  // VIDEO (default)
  return (
    <div className="w-full h-full flex items-center justify-center
      bg-gradient-to-br from-brand-500/10 to-surface-700">
      <PlayCircleIcon className="w-10 h-10 text-brand-400/70" />
    </div>
  );
}

// ─── Media Card ───────────────────────────────────────────────────────────────

function MediaCard({
  asset,
  onDoubleClick,
}: {
  asset:         AssetSummary;
  onDoubleClick: () => void;
}) {
  const clickTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeBadge    = asset.type === "EDITED"
    ? "bg-brand-500/15 text-brand-400"
    : "bg-ink-500/10 text-ink-500";

  function handleClick() {
    if (clickTimer.current) {
      // Segunda pulsación → doble clic
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onDoubleClick();
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        // Un solo clic: podría seleccionar, por ahora abre también
        onDoubleClick();
      }, 250);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(patterns.card, "overflow-hidden group/card")}
      title={`Doble clic para previsualizar ${asset.name}`}
    >
      {/* Preview area */}
      <div className="aspect-video w-full overflow-hidden bg-surface-700 relative">
        <MediaPreview asset={asset} />

        {/* Comment count badge */}
        {asset._count.comments > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1
            bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <ChatBubbleIcon className="w-3 h-3 text-white/70" />
            <span className="text-[10px] text-white/70 tabular-nums">
              {asset._count.comments}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-ink-950 truncate leading-tight">
          {asset.name}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            typeBadge
          )}>
            {asset.type === "EDITED" ? "Editado" : "RAW"}
          </span>
          <span className="text-[10px] text-ink-500 truncate">
            {asset.uploadedBy.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Folder Card ──────────────────────────────────────────────────────────────

function FolderCard({
  folder,
  onRenamed,
}: {
  folder:    FolderWithAssets;
  onRenamed: (id: string, newName: string) => void;
}) {
  const [renaming,  setRenaming]  = useState(false);
  const [value,     setValue]     = useState(folder.name);
  const [saving,    setSaving]    = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const count                     = folder.assets.length;

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === folder.name) {
      setValue(folder.name);
      setRenaming(false);
      return;
    }
    setSaving(true);
    try {
      await foldersApi.rename(folder.id, trimmed);
      onRenamed(folder.id, trimmed);
      setRenaming(false);
    } catch {
      toast.error("No se pudo renombrar la carpeta");
      setValue(folder.name);
      setRenaming(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn(
      "bg-surface-800 border border-white/[0.06] rounded-xl",
      "hover:border-white/[0.12] hover:bg-surface-700",
      "transition-all duration-200 select-none",
      "flex flex-col items-center justify-between gap-0 p-4 aspect-square",
      "group/folder"
    )}>
      {/* Icono */}
      <div className="flex-1 flex items-center justify-center">
        <FolderColorIcon className="w-14 h-14 text-warning-400/80 drop-shadow-sm" />
      </div>

      {/* Nombre + rename */}
      <div className="w-full">
        {renaming ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") { setValue(folder.name); setRenaming(false); }
              }}
              onBlur={save}
              disabled={saving}
              className="flex-1 min-w-0 text-xs text-ink-950 bg-surface-600 border border-brand-500/40
                rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); setValue(folder.name); setRenaming(false); }}
              className="p-1 text-ink-500 hover:text-error-400"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-1">
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-950 truncate leading-tight">
                {folder.name}
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                {count === 0 ? "vacía" : `${count} ${count === 1 ? "archivo" : "archivos"}`}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              className="opacity-0 group-hover/folder:opacity-100 transition-opacity p-1
                text-ink-500 hover:text-ink-950 shrink-0"
              title="Renombrar"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Media Modal ──────────────────────────────────────────────────────────────

function MediaModal({
  projectId,
  assetId,
  onClose,
}: {
  projectId: string;
  assetId:   string;
  onClose:   () => void;
}) {
  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-6xl h-[85vh] bg-surface-900 rounded-2xl overflow-hidden
        border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.8)]
        flex flex-col">

        {/* Close button */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center
              text-white/70 hover:text-white hover:bg-black/70 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <AssetViewer
          projectId={projectId}
          assetId={assetId}
          backHref="#"
          backLabel="Cerrar"
        />
      </div>
    </div>
  );
}

// ─── File Grid ────────────────────────────────────────────────────────────────

export interface FileGridProps {
  projectId:  string;
  folders:    FolderWithAssets[];
  rootAssets: AssetSummary[];
  onFolderRenamed?: (id: string, name: string) => void;
}

export default function FileGrid({
  projectId,
  folders,
  rootAssets,
  onFolderRenamed,
}: FileGridProps) {
  const [modalAssetId, setModalAssetId] = useState<string | null>(null);

  const handleRenamed = useCallback((id: string, name: string) => {
    onFolderRenamed?.(id, name);
  }, [onFolderRenamed]);

  const isEmpty = folders.length === 0 && rootAssets.length === 0;

  if (isEmpty) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800 border border-white/[0.06]
          flex items-center justify-center">
          <FolderColorIcon className="w-8 h-8 text-ink-300/50" />
        </div>
        <p className="text-sm font-medium text-ink-500">Sin archivos todavía</p>
        <p className="text-xs text-ink-300 mt-1">
          Los archivos aparecerán aquí cuando el editor los suba.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Grid */}
      <div className="space-y-8">

        {/* Carpetas */}
        {folders.length > 0 && (
          <div>
            <p className={patterns.sectionLabel}>Carpetas</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onRenamed={handleRenamed}
                />
              ))}
            </div>

            {/* Assets dentro de cada carpeta (grid expandido) */}
            {folders.map((folder) =>
              folder.assets.length > 0 ? (
                <div key={`assets-${folder.id}`} className="mt-5">
                  <p className="text-xs text-ink-500 mb-3 flex items-center gap-2">
                    <FolderColorIcon className="w-3.5 h-3.5 text-warning-400/70" />
                    {folder.name}
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                    {folder.assets.map((asset) => (
                      <MediaCard
                        key={asset.id}
                        asset={asset}
                        onDoubleClick={() => setModalAssetId(asset.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Archivos raíz */}
        {rootAssets.length > 0 && (
          <div>
            <p className={patterns.sectionLabel}>
              {folders.length > 0 ? "Sin carpeta" : "Archivos"}
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {rootAssets.map((asset) => (
                <MediaCard
                  key={asset.id}
                  asset={asset}
                  onDoubleClick={() => setModalAssetId(asset.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal player */}
      {modalAssetId && (
        <MediaModal
          projectId={projectId}
          assetId={modalAssetId}
          onClose={() => setModalAssetId(null)}
        />
      )}
    </>
  );
}
