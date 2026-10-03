"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ApiError,
  multicuenta,
  type MulticuentaClient,
  type TikTokAccount,
  type TikTokPost,
  type TikTokPostPreview,
} from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import {
  currentMonth,
  MonthPicker,
  monthLabel,
  monthOf,
  QuotaBar,
  TikTokPostCard,
  TikTokThumb,
} from "@/components/tiktok";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

// ─── Modal: registrar video ───────────────────────────────────────────────────

function RegisterPostModal({
  onRegistered,
  onClose,
}: {
  onRegistered: (post: TikTokPost) => void;
  onClose:      () => void;
}) {
  const [url,     setUrl]     = useState("");
  const [preview, setPreview] = useState<TikTokPostPreview | null>(null);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (!preview) {
        setPreview(await multicuenta.preview(url.trim()));
      } else {
        const post = await multicuenta.register(url.trim());
        toast.success("Video registrado", { description: `@${post.account.username} · ${post.client.name}` });
        onRegistered(post);
      }
    } catch (err) {
      setError(errorMessage(err, "No se pudo verificar el link"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-surface-800 border border-white/[0.08] rounded-2xl
        shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-ink-950">Registrar video de TikTok</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-950 hover:bg-white/[0.05] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className={patterns.label}>Link del video</label>
            <input
              ref={inputRef}
              value={url}
              onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(""); }}
              placeholder="https://www.tiktok.com/@cuenta/video/… o vm.tiktok.com/…"
              className={patterns.input}
              disabled={busy}
            />
            <p className="mt-1 text-[11px] text-ink-300">
              El video tiene que ser público y estar publicado desde una de tus cuentas registradas.
            </p>
          </div>

          {preview && (
            <div className="flex gap-3 p-3 rounded-xl bg-surface-700/60 border border-white/[0.06]">
              <TikTokThumb src={preview.thumbnailUrl} className="w-20 aspect-[9/16] rounded-lg shrink-0" />
              <div className="min-w-0 space-y-1 py-0.5">
                <p className="text-sm font-medium text-ink-950 truncate">@{preview.account.username}</p>
                <p className="text-xs text-ink-500">{preview.client.name}</p>
                <p className="text-xs text-ink-500">
                  Publicado el{" "}
                  {new Date(preview.postedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {preview.title && <p className="text-[11px] text-ink-300 line-clamp-3">{preview.title}</p>}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-error-400 bg-error-500/[0.08] border border-error-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={busy} className={patterns.btnGhost}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !url.trim()}
              className={cn(patterns.btnPrimary, (busy || !url.trim()) && "opacity-50 cursor-not-allowed")}
            >
              {busy ? "Verificando…" : preview ? "Registrar" : "Verificar link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tarjeta de cliente ───────────────────────────────────────────────────────

function ClientCard({
  client,
  onAccountAdded,
  onAccountRemoved,
}: {
  client:           MulticuentaClient;
  onAccountAdded:   (clientId: string, account: TikTokAccount) => void;
  onAccountRemoved: (clientId: string, accountId: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [adding,   setAdding]   = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setAdding(true);
    try {
      const account = await multicuenta.addAccount(client.id, username.trim());
      onAccountAdded(client.id, account);
      setUsername("");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo agregar la cuenta"));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(account: TikTokAccount) {
    try {
      await multicuenta.removeAccount(account.id);
      onAccountRemoved(client.id, account.id);
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo quitar la cuenta"));
    }
  }

  return (
    <div className={cn(patterns.panel, "space-y-4")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink-950 truncate">{client.name}</p>
        <span className="text-[11px] text-ink-500 shrink-0 tabular-nums">vos: {client.myCount}</span>
      </div>

      <QuotaBar count={client.count} target={client.monthlyTarget} />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500 mb-2">
          Tus cuentas
        </p>
        <div className="flex flex-wrap gap-1.5">
          {client.tiktokAccounts.map((a) => (
            <span
              key={a.id}
              className="group inline-flex items-center gap-1 text-xs text-ink-700 bg-white/[0.05]
                border border-white/[0.06] rounded-full pl-2.5 pr-1.5 py-0.5"
            >
              @{a.username}
              <button
                onClick={() => handleRemove(a)}
                className="text-ink-300 hover:text-error-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Quitar @${a.username}`}
              >
                ✕
              </button>
            </span>
          ))}
          {client.tiktokAccounts.length === 0 && (
            <span className="text-xs text-ink-300">Todavía no registraste cuentas.</span>
          )}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mt-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@usuario"
            disabled={adding}
            className={cn(patterns.input, "py-1.5 text-xs")}
          />
          <button
            type="submit"
            disabled={adding || !username.trim()}
            className={cn(patterns.btnSecondary, "text-xs py-1.5 px-3 shrink-0",
              (adding || !username.trim()) && "opacity-50 cursor-not-allowed")}
          >
            {adding ? "…" : "Agregar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MulticuentaPage() {
  const [month,        setMonth]        = useState(currentMonth);
  const [clients,      setClients]      = useState<MulticuentaClient[]>([]);
  const [posts,        setPosts]        = useState<TikTokPost[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    Promise.all([multicuenta.clients(month), multicuenta.posts(month)])
      .then(([c, p]) => { setClients(c); setPosts(p); })
      .catch((err) => setError(errorMessage(err, "No se pudo cargar el panel")))
      .finally(() => setLoading(false));
  }, [month]);

  function changeMonth(m: string) {
    setLoading(true);
    setError(null);
    setMonth(m);
  }

  function bumpCount(clientId: string, delta: number) {
    setClients((prev) => prev.map((c) =>
      c.id === clientId ? { ...c, count: c.count + delta, myCount: c.myCount + delta } : c
    ));
  }

  function handleRegistered(post: TikTokPost) {
    setShowRegister(false);
    const postMonth = monthOf(post.postedAt);
    if (postMonth === month) {
      setPosts((prev) => [post, ...prev]);
      bumpCount(post.client.id, 1);
    } else {
      toast.info(`Este video cuenta para ${monthLabel(postMonth).toLowerCase()}`);
    }
  }

  async function handleDeletePost(post: TikTokPost) {
    if (!window.confirm(`¿Quitar el video de @${post.account.username}? Deja de contar para la tanda.`)) return;
    try {
      await multicuenta.deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      if (post.status === "ACTIVE") bumpCount(post.client.id, -1);
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo quitar el video"));
    }
  }

  function handleAccountAdded(clientId: string, account: TikTokAccount) {
    setClients((prev) => prev.map((c) =>
      c.id === clientId ? { ...c, tiktokAccounts: [...c.tiktokAccounts, account] } : c
    ));
  }

  function handleAccountRemoved(clientId: string, accountId: string) {
    setClients((prev) => prev.map((c) =>
      c.id === clientId ? { ...c, tiktokAccounts: c.tiktokAccounts.filter((a) => a.id !== accountId) } : c
    ));
  }

  const hasAccounts = clients.some((c) => c.tiktokAccounts.length > 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className={patterns.sectionLabel}>Panel de multicuenta</p>
          <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">Tandas del mes</h1>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={changeMonth} />
          <button
            onClick={() => setShowRegister(true)}
            disabled={!hasAccounts}
            title={hasAccounts ? undefined : "Registrá una cuenta primero"}
            className={cn(patterns.btnPrimary, !hasAccounts && "opacity-50 cursor-not-allowed")}
          >
            Registrar video
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={cn(patterns.panel, "h-56")} />
          ))}
        </div>
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-error-400">{error}</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-ink-500">No tenés clientes asignados como editor de multicuenta.</p>
          <p className="text-xs text-ink-300 mt-1">Pedile a un administrador que te asigne.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {clients.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                onAccountAdded={handleAccountAdded}
                onAccountRemoved={handleAccountRemoved}
              />
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <p className={patterns.sectionLabel}>Mis videos del mes</p>
              {posts.length > 0 && (
                <span className="text-[11px] text-ink-500">
                  {posts.length} {posts.length === 1 ? "video" : "videos"}
                </span>
              )}
            </div>
            {posts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-ink-500">Sin videos registrados en {monthLabel(month).toLowerCase()}.</p>
                <p className="text-xs text-ink-300 mt-1">
                  Publicá desde TikTok y pegá el link con “Registrar video”.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                {posts.map((p) => (
                  <TikTokPostCard key={p.id} post={p} onDelete={handleDeletePost} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showRegister && (
        <RegisterPostModal onRegistered={handleRegistered} onClose={() => setShowRegister(false)} />
      )}
    </div>
  );
}
