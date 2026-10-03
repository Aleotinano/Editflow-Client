"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { auth, ApiError } from "@/lib/api";

// ─── Icono de video ───────────────────────────────────────────────────────────

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

// ─── Login page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token, user } = await auth.login(email, password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(`Bienvenido, ${user.name}`, {
        description: "Sesión iniciada correctamente.",
        duration: 3000,
      });

      // Redirigir según rol
      const destination =
        user.role === "ADMIN"  ? "/admin" :
        user.role === "EDITOR" ? "/editor" :
        "/client";

      router.push(destination);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Email o contraseña incorrectos");
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-surface-950 flex flex-col overflow-hidden">

      {/* ── Fondo ambiente ─────────────────────────────────────────────────── */}
      {/*
        Reemplazar el bloque de abajo con un <Image> de next/image
        cuando haya una imagen real de la empresa.
        Agregar "object-cover opacity-20" sobre el next/image y conservar los glows.
      */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>

        {/* Dot grid — profundidad sutil */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Glow naranja principal — centro-arriba */}
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[600px]
          bg-brand-500/20 rounded-full blur-[160px]" />

        {/* Glow violeta — esquina inferior derecha */}
        <div className="absolute -bottom-64 -right-48 w-[700px] h-[700px]
          bg-violet-600/10 rounded-full blur-[140px]" />

        {/* Glow naranja secundario — izquierda */}
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px]
          bg-brand-600/8 rounded-full blur-[100px]" />

        {/* Línea de gradiente horizontal — separa el nav del contenido */}
        <div className="absolute top-[72px] left-0 right-0 h-px
          bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      </div>

      {/* ── Top nav ────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-8 h-[72px]">

        {/* Logo + nombre */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center
            shadow-[0_0_20px_rgba(249,115,22,0.45)]">
            <VideoIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-ink-950 tracking-tight">
            EditFlow
          </span>
        </div>

        {/* Tagline discreta */}
        <span className="hidden sm:block text-xs text-ink-500">
          Gestión de proyectos de video
        </span>

      </nav>

      {/* ── Contenido centrado ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[360px]">

          {/* Encabezado del form */}
          <div className="mb-7">
            <h1 className="text-[1.6rem] font-semibold text-ink-950 tracking-tight leading-tight">
              Bienvenido
            </h1>
            <p className="text-sm text-ink-500 mt-1.5">
              Ingresá tus credenciales para acceder
            </p>
          </div>

          {/* Card glass */}
          <form
            onSubmit={handleSubmit}
            className={cn(
              "bg-surface-900/60 backdrop-blur-2xl",
              "border border-white/[0.07]",
              "rounded-xl p-7 space-y-5",
              "shadow-[0_32px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.03)]"
            )}
          >
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-error-500/8 border border-error-500/20
                rounded-md px-3.5 py-2.5 text-sm text-error-400">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className={patterns.label}>Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={patterns.input}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={patterns.label}>Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={patterns.input}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                patterns.btnPrimary,
                "w-full py-2.5 text-sm",
                "shadow-[0_0_28px_rgba(249,115,22,0.30)]",
                "hover:shadow-[0_0_36px_rgba(249,115,22,0.40)]",
                "transition-all duration-200",
                loading && "opacity-60 cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando…
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-ink-500 mt-5">
            ¿Problemas para acceder?{" "}
            <span className="text-brand-400 hover:text-brand-300 cursor-pointer transition-colors duration-150">
              Contactá al administrador
            </span>
          </p>

        </div>
      </div>

    </div>
  );
}
