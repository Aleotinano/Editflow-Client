"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { admin, ApiError, type ClientType } from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function NewClientPage() {
  const router = useRouter();

  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [type,        setType]        = useState<ClientType>("COMPANY");
  const [driveId,     setDriveId]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim())            errs.name     = "Requerido";
    if (!email.trim())           errs.email    = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                 errs.email    = "Email inválido";
    if (password.length < 8)     errs.password = "Mínimo 8 caracteres";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setError(null);
    setSubmitting(true);

    try {
      const result = await admin.clients.create({
        name:          name.trim(),
        email:         email.trim(),
        password,
        type,
        ...(driveId.trim() && { driveFolderId: driveId.trim() }),
      });
      router.push(`/admin/clients/${result.client.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ email: "Este email ya está en uso" });
      } else {
        setError(err instanceof ApiError ? err.message : "No se pudo crear el cliente");
      }
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim() && email.trim() && password.length >= 8 && !submitting;

  return (
    <div className="p-8 max-w-lg mx-auto">

      {/* Encabezado */}
      <div className="mb-8">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors mb-5"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          Clientes
        </Link>
        <p className={patterns.sectionLabel}>Administración</p>
        <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">Nuevo cliente</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          Se creará una cuenta de acceso para este cliente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className={patterns.label}>Nombre / Razón social</label>
          <input
            id="name" type="text" value={name} autoFocus
            onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
            placeholder="Ej: Acme Productions"
            className={cn(patterns.input, fieldErrors.name && "border-error-500/50")}
          />
          {fieldErrors.name && <p className="text-xs text-error-400 mt-1">{fieldErrors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={patterns.label}>Email de acceso</label>
          <input
            id="email" type="email" value={email} autoComplete="off"
            onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
            placeholder="cliente@empresa.com"
            className={cn(patterns.input, fieldErrors.email && "border-error-500/50")}
          />
          {fieldErrors.email && <p className="text-xs text-error-400 mt-1">{fieldErrors.email}</p>}
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="password" className={patterns.label}>Contraseña temporal</label>
          <div className="relative">
            <input
              id="password" value={password} autoComplete="new-password"
              type={showPass ? "text" : "password"}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
              placeholder="Mínimo 8 caracteres"
              className={cn(patterns.input, "pr-10", fieldErrors.password && "border-error-500/50")}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPass((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-500 hover:text-ink-700">
              {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password
            ? <p className="text-xs text-error-400 mt-1">{fieldErrors.password}</p>
            : <p className="text-xs text-ink-500 mt-1">El cliente podrá cambiarla desde su perfil.</p>
          }
        </div>

        {/* Tipo */}
        <div>
          <label className={patterns.label}>Tipo de cliente</label>
          <div className="flex gap-2">
            {(["COMPANY", "CREATOR"] as const).map((t) => (
              <button
                key={t} type="button" onClick={() => setType(t)}
                className={cn(
                  "flex-1 py-2.5 rounded-md text-sm font-medium border transition-all duration-150",
                  type === t
                    ? "bg-brand-500/10 text-brand-400 border-brand-500/25"
                    : "text-ink-500 border-white/[0.08] hover:text-ink-700 hover:border-white/[0.14]"
                )}
              >
                {t === "COMPANY" ? "Empresa" : "Creador"}
              </button>
            ))}
          </div>
        </div>

        {/* Drive Folder ID (opcional) */}
        <div>
          <label htmlFor="drive" className={patterns.label}>
            Google Drive Folder ID
            <span className="text-ink-400 font-normal ml-1.5">(opcional)</span>
          </label>
          <input
            id="drive" type="text" value={driveId}
            onChange={(e) => setDriveId(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            className={patterns.input}
          />
          <p className="text-xs text-ink-500 mt-1">
            ID de la carpeta de Drive donde se organizarán los archivos del cliente.
          </p>
        </div>

        {error && <p className="text-sm text-error-400">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={!canSubmit}
            className={cn(patterns.btnPrimary, "disabled:opacity-40 disabled:cursor-not-allowed")}>
            {submitting ? <><Spinner />Creando…</> : "Crear cliente"}
          </button>
          <Link href="/admin/clients" className={patterns.btnSecondary}>Cancelar</Link>
        </div>

      </form>
    </div>
  );
}

// ─── Micro ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}
function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}
function Spinner() {
  return <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" aria-hidden />;
}
