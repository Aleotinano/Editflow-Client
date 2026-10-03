"use client";

import type { TikTokPost } from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// ─── Mes ──────────────────────────────────────────────────────────────────────

export function monthOf(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonth(): string {
  return monthOf(new Date());
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MonthPicker({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const isCurrent = value === currentMonth();
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-surface-800 p-0.5">
      <button
        onClick={() => onChange(shiftMonth(value, -1))}
        className="px-2 py-1 rounded-md text-ink-500 hover:text-ink-950 hover:bg-white/[0.05] text-sm"
        aria-label="Mes anterior"
      >
        ‹
      </button>
      <span className="text-xs font-medium text-ink-950 min-w-[120px] text-center tabular-nums">
        {monthLabel(value)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(value, 1))}
        disabled={isCurrent}
        className="px-2 py-1 rounded-md text-ink-500 hover:text-ink-950 hover:bg-white/[0.05] text-sm
          disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Mes siguiente"
      >
        ›
      </button>
    </div>
  );
}

// ─── Progreso de la tanda ─────────────────────────────────────────────────────

export function QuotaBar({ count, target, size = "md" }: { count: number; target: number | null; size?: "sm" | "md" }) {
  const pct  = target ? Math.min(100, Math.round((count / target) * 100)) : 0;
  const done = target !== null && count >= target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-semibold tabular-nums text-ink-950", size === "md" ? "text-2xl" : "text-sm")}>
          {count}
          {target !== null && <span className="text-ink-500 font-normal">/{target}</span>}
        </span>
        <span className={cn("text-[11px] tabular-nums", done ? "text-success-400" : "text-ink-500")}>
          {target === null ? "Sin objetivo" : done ? "Completa" : `${pct}%`}
        </span>
      </div>
      <div className={cn("w-full rounded-full bg-white/[0.06] overflow-hidden", size === "md" ? "h-2" : "h-1.5")}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", done ? "bg-success-400" : "bg-brand-500")}
          style={{ width: `${target ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}

// ─── Tarjeta de video ─────────────────────────────────────────────────────────

export function TikTokThumb({ src, className }: { src: string | null; className?: string }) {
  return (
    <div className={cn("relative bg-surface-700 overflow-hidden", className)}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
    </div>
  );
}

export function TikTokPostCard({
  post,
  showEditor,
  onDelete,
}: {
  post:        TikTokPost;
  showEditor?: boolean;
  onDelete?:   (post: TikTokPost) => void;
}) {
  const removed = post.status === "REMOVED";
  return (
    <div className={cn(patterns.card, "overflow-hidden cursor-default group", removed && "opacity-60")}>
      <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
        <TikTokThumb src={post.thumbnailUrl} className="aspect-[9/16] max-h-64 w-full" />
      </a>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-950 truncate">@{post.account.username}</span>
          {removed && (
            <span className={cn(patterns.badge, "bg-error-500/10 text-error-400 shrink-0")}>Caído</span>
          )}
        </div>
        {post.title && <p className="text-[11px] text-ink-500 line-clamp-2">{post.title}</p>}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-ink-500 truncate">
            {new Date(post.postedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
            {showEditor && ` · ${post.editor.name}`}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(post)}
              className="text-[11px] text-ink-500 hover:text-error-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
