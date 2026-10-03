"use client";

/**
 * Componentes compartidos para las vistas de detalle de proyecto.
 * Usados por editor/projects/[id] y client/projects/[id].
 * El admin/projects/[id] tiene su propia copia inline (legacy).
 */

import Link from "next/link";
import type { AssetSummary, FolderWithAssets } from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────────────────────

export function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375Z" />
    </svg>
  );
}

export function MusicalNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
    </svg>
  );
}

export function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

export function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function AssetIcon({
  mediaType,
  className,
}: {
  mediaType: AssetSummary["mediaType"];
  className?: string;
}) {
  if (mediaType === "AUDIO") return <MusicalNoteIcon className={className} />;
  if (mediaType === "IMAGE") return <PhotoIcon className={className} />;
  return <FilmIcon className={className} />;
}

export function assetIconColor(mediaType: AssetSummary["mediaType"]): string {
  if (mediaType === "AUDIO") return "text-info-400";
  if (mediaType === "IMAGE") return "text-success-400";
  return "text-brand-400";
}

// ─── AssetRow ─────────────────────────────────────────────────────────────────

export function AssetRow({
  asset,
  indent = false,
  href,
}: {
  asset:   AssetSummary;
  indent?: boolean;
  href?:   string;
}) {
  const typeBadgeClass =
    asset.type === "EDITED"
      ? "bg-brand-500/10 text-brand-400"
      : "bg-ink-500/10 text-ink-500";

  const inner = (
    <>
      <AssetIcon
        mediaType={asset.mediaType}
        className={cn("w-4 h-4 shrink-0", assetIconColor(asset.mediaType))}
      />

      <span className="flex-1 text-sm text-ink-950 truncate min-w-0">
        {asset.name}
      </span>

      <span className={cn(patterns.badge, typeBadgeClass, "shrink-0")}>
        {asset.type === "EDITED" ? "Editado" : "RAW"}
      </span>

      <span className="text-xs text-ink-500 w-24 truncate hidden sm:block shrink-0">
        {asset.uploadedBy.name}
      </span>

      {asset._count.comments > 0 && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-ink-500 shrink-0">
          <ChatBubbleIcon className="w-3.5 h-3.5" />
          {asset._count.comments}
        </span>
      )}

      <span className="text-xs text-ink-500 w-16 text-right hidden md:block shrink-0 whitespace-nowrap">
        {formatRelative(asset.createdAt)}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(patterns.listRow, "gap-3", indent && "pl-8")}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn(patterns.listRow, "gap-3", indent && "pl-8")}>
      {inner}
    </div>
  );
}

// ─── FolderRow ────────────────────────────────────────────────────────────────

export function FolderRow({
  folder,
  expanded,
  onToggle,
  assetBasePath,
}: {
  folder:         FolderWithAssets;
  expanded:       boolean;
  onToggle:       () => void;
  assetBasePath?: string;
}) {
  const count = folder.assets.length;

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 py-3 px-4",
          "border-b border-white/[0.05] hover:bg-white/[0.02]",
          "transition-colors duration-150 text-left"
        )}
      >
        <FolderIcon className="w-4 h-4 text-warning-400 shrink-0" />
        <span className="flex-1 text-sm font-medium text-ink-950 truncate">
          {folder.name}
        </span>
        <span className={cn(patterns.metaInline, "shrink-0")}>
          {count === 0 ? "vacía" : `${count} ${count === 1 ? "archivo" : "archivos"}`}
        </span>
        <span className="text-xs text-ink-500 hidden sm:block shrink-0 whitespace-nowrap">
          {formatRelative(folder.createdAt)}
        </span>
        <ChevronRightIcon
          className={cn(
            "w-3.5 h-3.5 text-ink-500 shrink-0 transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
      </button>

      {expanded && (
        <div>
          {count === 0 ? (
            <div className="pl-8 py-3 border-b border-white/[0.05]">
              <p className="text-xs text-ink-500">Esta carpeta está vacía.</p>
            </div>
          ) : (
            folder.assets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                indent
                href={assetBasePath ? `${assetBasePath}/${asset.id}` : undefined}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── ProjectLoadingSkeleton ───────────────────────────────────────────────────

export function ProjectLoadingSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-pulse">
      <div className="h-3 bg-white/[0.06] rounded w-24 mb-8" />
      <div className="h-7 bg-white/[0.08] rounded w-64 mb-2" />
      <div className="h-3 bg-white/[0.05] rounded w-40 mb-10" />
      <div className="h-px bg-white/[0.05] mb-4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04]"
        >
          <div className="w-4 h-4 bg-white/[0.06] rounded shrink-0" />
          <div className="flex-1 h-3.5 bg-white/[0.06] rounded" />
          <div className="w-16 h-4 bg-white/[0.05] rounded" />
        </div>
      ))}
    </div>
  );
}
