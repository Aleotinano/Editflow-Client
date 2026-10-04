"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  projects,
  comments as commentsApi,
  ApiError,
  assetStreamUrl,
  type ProjectDetail,
  type AssetSummary,
  type Comment,
} from "@/lib/api";
import { cn, formatRelative } from "@/lib/utils";
import { patterns } from "@/lib/tokens";
import { useAuth } from "@/hooks/use-auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────


function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function findAsset(project: ProjectDetail, assetId: string): AssetSummary | undefined {
  const root = project.assets.find((a) => a.id === assetId);
  if (root) return root;
  for (const folder of project.folders) {
    const found = folder.assets.find((a) => a.id === assetId);
    if (found) return found;
  }
  return undefined;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ViewerSkeleton() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      <div className="h-14 bg-surface-800 border-b border-white/[0.05] flex items-center px-6 gap-4 shrink-0">
        <div className="w-20 h-3 bg-white/[0.06] rounded" />
        <div className="flex-1 h-4 bg-white/[0.05] rounded w-40" />
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 bg-black/60" />
        <div className="w-80 border-l border-white/[0.05] p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-white/[0.06] rounded w-16" />
              <div className="h-4 bg-white/[0.05] rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Comment item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  activeId,
  onSeek,
  onDelete,
}: {
  comment:         Comment;
  currentUserId:   string;
  currentUserRole: string;
  activeId:        string | null;
  onSeek:          (ts: number) => void;
  onDelete:        (id: string) => void;
}) {
  const canDelete =
    comment.user.id === currentUserId || currentUserRole === "ADMIN";
  const isActive = comment.id === activeId;

  return (
    <div
      className={cn(
        "group rounded-lg px-3 py-2.5 transition-colors duration-150",
        isActive
          ? "bg-brand-500/10 border border-brand-500/20"
          : "hover:bg-white/[0.03] border border-transparent"
      )}
    >
      {/* Header: timestamp + autor + acciones */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <button
          onClick={() => onSeek(comment.timestamp)}
          className="flex items-center gap-1.5 group/ts"
        >
          <span className={cn(
            "text-[11px] font-mono font-medium px-1.5 py-0.5 rounded",
            "bg-brand-500/10 text-brand-400 group-hover/ts:bg-brand-500/20 transition-colors"
          )}>
            {formatTime(comment.timestamp)}
          </span>
          <span className="text-[11px] text-ink-500 truncate max-w-[100px]">
            {comment.user.name}
          </span>
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete(comment.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-100
              text-ink-500 hover:text-error-400 p-0.5"
            title="Eliminar"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-ink-700 leading-snug">{comment.text}</p>
    </div>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────

function VideoPlayer({
  assetId,
  mediaType,
  currentTime,
  duration,
  playing,
  commentMarkers,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  onSeek,
  onActiveComment,
}: {
  assetId:         string;
  mediaType:       AssetSummary["mediaType"];
  currentTime:     number;
  duration:        number;
  playing:         boolean;
  commentMarkers:  Array<{ id: string; timestamp: number }>;
  onTimeUpdate:    (t: number) => void;
  onDurationChange:(d: number) => void;
  onPlayPause:     () => void;
  onSeek:          (t: number) => void;
  onActiveComment: (id: string | null) => void;
}) {
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [mediaError, setMediaError] = useState(false);
  const streamUrl = assetStreamUrl(assetId);

  // Sync play/pause
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else         el.pause();
  }, [playing]);

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value);
    if (mediaRef.current) mediaRef.current.currentTime = t;
    onSeek(t);
  }

  function handleMarkerClick(ts: number) {
    if (mediaRef.current) mediaRef.current.currentTime = ts;
    onSeek(ts);
    // Highlight nearest comment
    const nearest = commentMarkers.reduce<typeof commentMarkers[0] | null>((best, m) => {
      if (!best) return m;
      return Math.abs(m.timestamp - ts) < Math.abs(best.timestamp - ts) ? m : best;
    }, null);
    onActiveComment(nearest?.id ?? null);
  }

  const mediaClass = "w-full h-full object-contain bg-black";

  return (
    <div className="flex flex-col h-full bg-black">

      {/* Media area */}
      <div className="flex-1 relative min-h-0 flex items-center justify-center">
        {mediaError ? (
          <div className="flex flex-col items-center gap-3 text-center px-8">
            {mediaType === "AUDIO"
              ? <MusicalNoteIcon className="w-12 h-12 text-ink-600" />
              : <FilmIcon className="w-12 h-12 text-ink-600" />
            }
            <p className="text-sm text-ink-500">No se pudo cargar el archivo.</p>
            <p className="text-xs text-ink-600">Verificá que Google Drive esté configurado.</p>
          </div>
        ) : mediaType === "AUDIO" ? (
          <div className="w-full px-10 flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-800 border border-white/[0.06]
              flex items-center justify-center">
              <MusicalNoteIcon className="w-10 h-10 text-brand-400" />
            </div>
            <audio
              ref={mediaRef}
              src={streamUrl}
              onTimeUpdate={() => onTimeUpdate(mediaRef.current?.currentTime ?? 0)}
              onDurationChange={() => onDurationChange(mediaRef.current?.duration ?? 0)}
              onEnded={() => onPlayPause()}
              onError={() => setMediaError(true)}
              preload="metadata"
            />
          </div>
        ) : mediaType === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streamUrl}
            alt="asset"
            className={mediaClass}
            onError={() => setMediaError(true)}
          />
        ) : (
          <video
            ref={mediaRef}
            src={streamUrl}
            className={mediaClass}
            onTimeUpdate={() => onTimeUpdate(mediaRef.current?.currentTime ?? 0)}
            onDurationChange={() => onDurationChange(mediaRef.current?.duration ?? 0)}
            onEnded={() => onPlayPause()}
            onError={() => setMediaError(true)}
            preload="metadata"
          />
        )}
      </div>

      {/* Controls (solo para video/audio) */}
      {mediaType !== "IMAGE" && (
        <div className="shrink-0 px-5 py-4 bg-surface-950/95 border-t border-white/[0.06]">

          {/* Timeline + markers */}
          <div className="relative mb-3 h-6 flex items-center">
            {/* Track */}
            <div className="w-full h-1 bg-white/[0.08] rounded-full absolute" />

            {/* Progress fill */}
            <div
              className="h-1 bg-brand-500 rounded-full absolute pointer-events-none"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
            />

            {/* Comment markers */}
            {duration > 0 && commentMarkers.map((m) => (
              <button
                key={m.id}
                onClick={() => handleMarkerClick(m.timestamp)}
                title={formatTime(m.timestamp)}
                style={{ left: `${(m.timestamp / duration) * 100}%` }}
                className="absolute w-2.5 h-2.5 -translate-x-1/2 rounded-full
                  bg-warning-400 border-2 border-black z-10
                  hover:scale-125 transition-transform duration-100"
              />
            ))}

            {/* Seek input (invisible, on top) */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full absolute opacity-0 cursor-pointer h-6 z-20"
            />
          </div>

          {/* Play + time */}
          <div className="flex items-center gap-4">
            <button
              onClick={onPlayPause}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                "bg-brand-500 hover:bg-brand-400 transition-colors duration-150",
                "text-white shadow-[0_0_16px_rgba(249,115,22,0.35)]"
              )}
            >
              {playing
                ? <PauseIcon className="w-4 h-4" />
                : <PlayIcon className="w-4 h-4 ml-0.5" />
              }
            </button>

            <span className="text-xs text-ink-500 tabular-nums">
              {formatTime(currentTime)}
              <span className="text-ink-600 mx-1">/</span>
              {formatTime(duration)}
            </span>

            {commentMarkers.length > 0 && (
              <span className="ml-auto text-[11px] text-ink-500">
                {commentMarkers.length} {commentMarkers.length === 1 ? "comentario" : "comentarios"} en timeline
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Comments panel ───────────────────────────────────────────────────────────

function CommentsPanel({
  assetId,
  currentUserId,
  currentUserRole,
  mediaType,
  items,
  activeId,
  onSeek,
  onAdd,
  onDelete,
  getCurrentTime,
}: {
  assetId:          string;
  currentUserId:    string;
  currentUserRole:  string;
  mediaType:        AssetSummary["mediaType"];
  items:            Comment[];
  activeId:         string | null;
  onSeek:           (ts: number) => void;
  onAdd:            (c: Comment) => void;
  onDelete:         (id: string) => void;
  getCurrentTime:   () => number;
}) {
  const [text,       setText]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ts = mediaType === "IMAGE" ? 0 : getCurrentTime();
      const comment = await commentsApi.add(assetId, { text: text.trim(), timestamp: ts });
      onAdd(comment);
      setText("");
    } catch {
      toast.error("No se pudo agregar el comentario");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await commentsApi.delete(commentId);
      onDelete(commentId);
    } catch {
      toast.error("No se pudo eliminar el comentario");
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.05] shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-500">
          Comentarios
          {items.length > 0 && (
            <span className="ml-2 text-ink-600 normal-case font-normal tracking-normal">
              ({items.length})
            </span>
          )}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-500">Sin comentarios.</p>
            <p className="text-xs text-ink-600 mt-0.5">
              {mediaType !== "IMAGE"
                ? "Pausá el video en el momento deseado y escribí tu feedback."
                : "Dejá tu feedback abajo."}
            </p>
          </div>
        ) : (
          items.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              activeId={activeId}
              onSeek={onSeek}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add comment form */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 px-3 py-3 border-t border-white/[0.05] space-y-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
          }}
          placeholder="Escribí un comentario…"
          rows={3}
          className={cn(
            patterns.input,
            "resize-none text-sm leading-relaxed"
          )}
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className={cn(
            patterns.btnPrimary,
            "w-full py-2 text-xs",
            (!text.trim() || submitting) && "opacity-50 cursor-not-allowed"
          )}
        >
          {submitting
            ? "Enviando…"
            : mediaType !== "IMAGE"
              ? `Comentar en ${formatTime(getCurrentTime())}`
              : "Comentar"
          }
        </button>
      </form>
    </div>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────

interface AssetViewerProps {
  projectId: string;
  assetId:   string;
  backHref:  string;
  backLabel: string;
}

export default function AssetViewer({ projectId, assetId, backHref, backLabel }: AssetViewerProps) {
  const { user: currentUser } = useAuth();
  const [project,     setProject]     = useState<ProjectDetail | null>(null);
  const [commentList, setCommentList] = useState<Comment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Player state
  const [playing,      setPlaying]      = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const currentTimeRef = useRef(0);

  // Sync ref for getCurrentTime without stale closure
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  // Load project + comments in parallel
  useEffect(() => {
    if (!projectId || !assetId) return;
    Promise.all([
      projects.getById(projectId),
      commentsApi.list(assetId),
    ])
      .then(([proj, cmts]) => {
        setProject(proj);
        setCommentList(cmts);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el archivo")
      )
      .finally(() => setLoading(false));
  }, [projectId, assetId]);

  const handleSeek = useCallback((t: number) => {
    setCurrentTime(t);
    // Highlight nearest comment
    if (commentList.length > 0) {
      const nearest = commentList.reduce((best, c) =>
        Math.abs(c.timestamp - t) < Math.abs(best.timestamp - t) ? c : best
      );
      setActiveComment(Math.abs(nearest.timestamp - t) < 2 ? nearest.id : null);
    }
  }, [commentList]);

  if (loading) return <ViewerSkeleton />;

  if (error || !project) {
    return (
      <div className="p-8">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 mb-8">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> {backLabel}
        </Link>
        <p className="text-sm text-error-400">{error ?? "Archivo no encontrado"}</p>
      </div>
    );
  }

  const asset = findAsset(project, assetId);
  if (!asset) {
    return (
      <div className="p-8">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 mb-8">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> {backLabel}
        </Link>
        <p className="text-sm text-error-400">Archivo no encontrado en este proyecto.</p>
      </div>
    );
  }

  // El usuario sale de la sesión (AuthProvider), no de localStorage.
  const currentUserId   = currentUser?.id   ?? "";
  const currentUserRole = currentUser?.role ?? "";

  const typeBadgeClass =
    asset.type === "EDITED"
      ? "bg-brand-500/10 text-brand-400"
      : "bg-ink-500/10 text-ink-500";

  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-white/[0.05] bg-surface-800/80 shrink-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 transition-colors shrink-0"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          {backLabel}
        </Link>

        <span className="text-ink-600">/</span>

        <span className="text-sm font-medium text-ink-950 truncate flex-1 min-w-0">
          {asset.name}
        </span>

        <span className={cn(patterns.badge, typeBadgeClass, "shrink-0")}>
          {asset.type === "EDITED" ? "Editado" : "RAW"}
        </span>
      </div>

      {/* ── Split layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Player */}
        <div className="flex-1 min-w-0">
          <VideoPlayer
            assetId={assetId}
            mediaType={asset.mediaType}
            currentTime={currentTime}
            duration={duration}
            playing={playing}
            commentMarkers={commentList.map((c) => ({ id: c.id, timestamp: c.timestamp }))}
            onTimeUpdate={(t) => { setCurrentTime(t); currentTimeRef.current = t; }}
            onDurationChange={setDuration}
            onPlayPause={() => setPlaying((v) => !v)}
            onSeek={handleSeek}
            onActiveComment={setActiveComment}
          />
        </div>

        {/* Comments */}
        <div className="w-72 xl:w-80 shrink-0 border-l border-white/[0.05] bg-surface-900/60">
          <CommentsPanel
            assetId={assetId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            mediaType={asset.mediaType}
            items={commentList}
            activeId={activeComment}
            onSeek={(t) => {
              setCurrentTime(t);
              handleSeek(t);
            }}
            onAdd={(c) => setCommentList((prev) => [...prev, c].sort((a, b) => a.timestamp - b.timestamp))}
            onDelete={(id) => setCommentList((prev) => prev.filter((c) => c.id !== id))}
            getCurrentTime={() => currentTimeRef.current}
          />
        </div>

      </div>
    </div>
  );
}
