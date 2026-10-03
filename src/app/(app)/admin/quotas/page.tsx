"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { admin, ApiError, type ClientQuota } from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { currentMonth, MonthPicker, QuotaBar } from "@/components/tiktok";

const ROLE_BADGE = {
  PRINCIPAL:   { label: "Principal",   className: "bg-info-500/10 text-info-400"   },
  MULTICUENTA: { label: "Multicuenta", className: "bg-brand-500/10 text-brand-400" },
} as const;

// Primero los que tienen objetivo, del más atrasado al más avanzado
function progress(q: ClientQuota) {
  return q.monthlyTarget ? q.count / q.monthlyTarget : Infinity;
}

function QuotaCard({ quota }: { quota: ClientQuota }) {
  return (
    <Link href={`/admin/clients/${quota.id}`} className={cn(patterns.card, "p-5 flex flex-col gap-4")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink-950 truncate">{quota.name}</p>
        <span className="text-[11px] text-ink-500 shrink-0">
          {quota.accounts} {quota.accounts === 1 ? "cuenta" : "cuentas"}
        </span>
      </div>

      <QuotaBar count={quota.count} target={quota.monthlyTarget} />

      {quota.editors.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-white/[0.05]">
          {quota.editors.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-xs pt-1.5">
              <span className="text-ink-700 truncate flex-1">{e.name}</span>
              <span className={cn(patterns.badge, ROLE_BADGE[e.role].className, "text-[10px]")}>
                {ROLE_BADGE[e.role].label}
              </span>
              <span className="text-ink-950 tabular-nums w-6 text-right">{e.count}</span>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function QuotasPage() {
  const [month,   setMonth]   = useState(currentMonth);
  const [quotas,  setQuotas]  = useState<ClientQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  function changeMonth(m: string) {
    setLoading(true);
    setError(null);
    setMonth(m);
  }

  useEffect(() => {
    admin.quotas(month)
      .then((q) => setQuotas([...q].sort((a, b) => (progress(a) - progress(b)) || 0)))
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar las tandas"))
      .finally(() => setLoading(false));
  }, [month]);

  const withTarget = quotas.filter((q) => q.monthlyTarget);
  const completed  = withTarget.filter((q) => q.count >= q.monthlyTarget!).length;
  const total      = quotas.reduce((sum, q) => sum + q.count, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className={patterns.sectionLabel}>Multicuenta TikTok</p>
          <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">Tandas mensuales</h1>
          {!loading && !error && (
            <p className={cn(patterns.metaInline, "mt-1.5")}>
              <span>{total} {total === 1 ? "video" : "videos"}</span>
              <span>·</span>
              <span>{completed}/{withTarget.length} tandas completas</span>
            </p>
          )}
        </div>
        <MonthPicker value={month} onChange={changeMonth} />
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(patterns.panel, "h-44")} />
          ))}
        </div>
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-error-400">{error}</p>
        </div>
      ) : quotas.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-ink-500">No hay clientes todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {quotas.map((q) => <QuotaCard key={q.id} quota={q} />)}
        </div>
      )}
    </div>
  );
}
