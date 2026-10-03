"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  admin,
  ApiError,
  type AssignedEditor,
  type ClientDetail,
  type ClientType,
  type EditorRole,
  type EditorSummary,
  type ProjectStatus,
  type TikTokPost,
} from "@/lib/api";
import { patterns, projectStatusStyles } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";
import { currentMonth, MonthPicker, QuotaBar, TikTokPostCard } from "@/components/tiktok";

// ─── Tipos locales ────────────────────────────────────────────────────────────

type ClientProject = ClientDetail["projects"][number];
type EditableFields = Pick<ClientDetail, "name" | "type" | "driveFolderId" | "monthlyTarget">;

const ROLE_STYLE: Record<EditorRole, { label: string; className: string }> = {
  PRINCIPAL:   { label: "Principal",   className: "bg-info-500/10 text-info-400"   },
  MULTICUENTA: { label: "Multicuenta", className: "bg-brand-500/10 text-brand-400" },
};

// ─── Sección: editar datos del cliente ───────────────────────────────────────

function EditForm({
  client,
  onSaved,
  onCancel,
}: {
  client:    ClientDetail;
  onSaved:   (updated: EditableFields) => void;
  onCancel:  () => void;
}) {
  const [name,    setName]    = useState(client.name);
  const [type,    setType]    = useState<ClientType>(client.type);
  const [driveId, setDriveId] = useState(client.driveFolderId ?? "");
  const [target,  setTarget]  = useState(client.monthlyTarget?.toString() ?? "");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("El nombre es requerido"); return; }
    const monthlyTarget = target.trim() ? Number(target) : null;
    if (monthlyTarget !== null && (!Number.isInteger(monthlyTarget) || monthlyTarget < 1)) {
      setError("La tanda mensual tiene que ser un número entero mayor a 0");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await admin.clients.update(client.id, {
        name:          name.trim(),
        type,
        driveFolderId: driveId.trim() || null,
        monthlyTarget,
      });
      onSaved({
        name:          updated.name,
        type:          updated.type,
        driveFolderId: updated.driveFolderId,
        monthlyTarget: updated.monthlyTarget,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className="grid grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="col-span-2 sm:col-span-1">
          <label className={patterns.label}>Nombre</label>
          <input
            type="text" value={name} autoFocus
            onChange={(e) => setName(e.target.value)}
            className={patterns.input}
          />
        </div>

        {/* Tipo */}
        <div className="col-span-2 sm:col-span-1">
          <label className={patterns.label}>Tipo</label>
          <div className="flex gap-2 h-[38px]">
            {(["COMPANY", "CREATOR"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-md text-sm font-medium border transition-all duration-150",
                  type === t
                    ? "bg-brand-500/10 text-brand-400 border-brand-500/25"
                    : "text-ink-500 border-white/[0.08] hover:text-ink-700"
                )}>
                {t === "COMPANY" ? "Empresa" : "Creador"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Drive ID */}
        <div className="col-span-2 sm:col-span-1">
          <label className={patterns.label}>
            Google Drive Folder ID
            <span className="text-ink-400 font-normal ml-1.5">(opcional)</span>
          </label>
          <input type="text" value={driveId} onChange={(e) => setDriveId(e.target.value)}
            placeholder="ID de carpeta de Drive"
            className={patterns.input} />
        </div>

        {/* Tanda mensual */}
        <div className="col-span-2 sm:col-span-1">
          <label className={patterns.label}>
            Tanda mensual
            <span className="text-ink-400 font-normal ml-1.5">(videos de TikTok)</span>
          </label>
          <input type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)}
            placeholder="Sin objetivo"
            className={patterns.input} />
        </div>
      </div>

      {error && <p className="text-xs text-error-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving}
          className={cn(patterns.btnPrimary, "text-xs py-1.5 px-3 disabled:opacity-50")}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        <button onClick={onCancel} className={cn(patterns.btnSecondary, "text-xs py-1.5 px-3")}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Sección: asignar editor ──────────────────────────────────────────────────

function AssignEditorForm({
  clientId,
  assignedIds,
  onAssigned,
  onCancel,
}: {
  clientId:    string;
  assignedIds: string[];
  onAssigned:  (editor: AssignedEditor) => void;
  onCancel:    () => void;
}) {
  const [allEditors,  setAllEditors]  = useState<EditorSummary[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState("");
  const [role,        setRole]        = useState<EditorRole>("PRINCIPAL");
  const [assigning,   setAssigning]   = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    admin.editors.list()
      .then((editors) => {
        setAllEditors(editors.filter((e) => !assignedIds.includes(e.id)));
      })
      .catch(() => setError("No se pudo cargar la lista de editores"))
      .finally(() => setLoading(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAssign() {
    if (!selectedId) return;
    setAssigning(true);
    setError("");
    try {
      const result = await admin.clients.assignEditor(clientId, selectedId, role);
      onAssigned({ ...result.editor, role: result.role });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "Este editor ya está asignado"
          : "No se pudo asignar el editor"
      );
      setAssigning(false);
    }
  }

  const available = allEditors;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.05]">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={loading || assigning}
        className={cn(
          patterns.input,
          "flex-1 max-w-xs py-1.5 h-auto appearance-none cursor-pointer",
          selectedId === "" ? "text-ink-500" : "text-ink-950"
        )}
      >
        <option value="" disabled>
          {loading ? "Cargando…" : available.length === 0 ? "Sin editores disponibles" : "Elegí un editor"}
        </option>
        {available.map((e) => (
          <option key={e.id} value={e.id}>{e.name} — {e.email}</option>
        ))}
      </select>

      <div className="flex rounded-lg overflow-hidden border border-white/[0.08] shrink-0">
        {(["PRINCIPAL", "MULTICUENTA"] as const).map((r, i) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "px-2.5 py-1.5 text-xs font-medium transition-colors duration-150",
              i > 0 && "border-l border-white/[0.08]",
              role === r ? "bg-brand-500 text-white" : "bg-surface-700 text-ink-500 hover:text-ink-700"
            )}
          >
            {ROLE_STYLE[r].label}
          </button>
        ))}
      </div>

      <button
        onClick={handleAssign}
        disabled={!selectedId || assigning || loading}
        className={cn(
          patterns.btnPrimary, "text-xs py-1.5 px-3",
          (!selectedId || assigning || loading) && "opacity-40 cursor-not-allowed"
        )}
      >
        {assigning ? "Asignando…" : "Asignar"}
      </button>

      <button onClick={onCancel} className={cn(patterns.btnGhost, "text-xs py-1.5 px-2")}>
        Cancelar
      </button>

      {error && <span className="text-xs text-error-400">{error}</span>}
    </div>
  );
}

// ─── Fila de editor asignado ──────────────────────────────────────────────────

function EditorRow({
  editor,
  clientId,
  onUnassigned,
  onRoleChanged,
}: {
  editor:        AssignedEditor;
  clientId:      string;
  onUnassigned:  (id: string) => void;
  onRoleChanged: (id: string, role: EditorRole) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing,   setRemoving]   = useState(false);
  const [switching,  setSwitching]  = useState(false);

  async function handleToggleRole() {
    const next: EditorRole = editor.role === "PRINCIPAL" ? "MULTICUENTA" : "PRINCIPAL";
    setSwitching(true);
    try {
      const { role } = await admin.clients.setEditorRole(clientId, editor.id, next);
      onRoleChanged(editor.id, role);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el rol");
    } finally {
      setSwitching(false);
    }
  }

  async function handleUnassign() {
    setRemoving(true);
    try {
      await admin.clients.unassignEditor(clientId, editor.id);
      onUnassigned(editor.id);
    } catch {
      setRemoving(false);
      setConfirming(false);
    }
  }

  return (
    <div className={cn(
      "flex items-center px-4 py-3 gap-3 border-b border-white/[0.05]",
      "hover:bg-white/[0.02] transition-colors duration-150",
      removing && "opacity-40 pointer-events-none"
    )}>
      {/* Iniciales */}
      <div className="w-7 h-7 rounded-full bg-ink-500/10 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-semibold text-ink-500">
          {editor.name.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-950 truncate">{editor.name}</p>
        <p className="text-xs text-ink-500 truncate">{editor.email}</p>
      </div>

      <button
        onClick={handleToggleRole}
        disabled={switching}
        title="Cambiar rol"
        className={cn(
          patterns.badge, ROLE_STYLE[editor.role].className,
          "shrink-0 hover:opacity-80 transition-opacity disabled:opacity-40"
        )}
      >
        {ROLE_STYLE[editor.role].label}
      </button>

      {/* Desasignar */}
      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-ink-500">¿Desasignar?</span>
          <button onClick={handleUnassign} disabled={removing}
            className="text-xs font-medium text-error-400 hover:text-error-300 disabled:opacity-50">
            {removing ? "…" : "Sí"}
          </button>
          <button onClick={() => setConfirming(false)} className="text-xs text-ink-500 hover:text-ink-700">
            No
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)}
          className="text-xs text-ink-500 hover:text-error-400 transition-colors shrink-0">
          Desasignar
        </button>
      )}
    </div>
  );
}

// ─── Fila de proyecto ─────────────────────────────────────────────────────────

function ProjectRow({ project }: { project: ClientProject }) {
  return (
    <Link
      href={`/admin/projects/${project.id}`}
      className={cn(patterns.listRow, "gap-4")}
    >
      <span className="flex-1 text-sm font-medium text-ink-950 truncate">{project.name}</span>
      <span className={cn(patterns.badge, projectStatusStyles[project.status as ProjectStatus].className)}>
        {projectStatusStyles[project.status as ProjectStatus].label}
      </span>
      <span className="text-xs text-ink-500 hidden sm:block whitespace-nowrap">
        {formatRelative(project.createdAt)}
      </span>
    </Link>
  );
}

// ─── Sección: tanda del mes ───────────────────────────────────────────────────

function QuotaSection({ clientId, target }: { clientId: string; target: number | null }) {
  const [month,   setMonth]   = useState(currentMonth);
  const [posts,   setPosts]   = useState<TikTokPost[]>([]);
  const [loading, setLoading] = useState(true);

  function changeMonth(m: string) {
    setLoading(true);
    setMonth(m);
  }

  useEffect(() => {
    admin.clients.tiktokPosts(clientId, month)
      .then(setPosts)
      .catch(() => toast.error("No se pudieron cargar los videos del mes"))
      .finally(() => setLoading(false));
  }, [clientId, month]);

  const active = posts.filter((p) => p.status === "ACTIVE").length;

  return (
    <div className={patterns.sectionGap}>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <p className={cn(patterns.sectionLabel, "mb-0")}>Tanda del mes</p>
        <MonthPicker value={month} onChange={changeMonth} />
      </div>

      <div className={cn(patterns.panel, "mb-4 max-w-sm")}>
        <QuotaBar count={loading ? 0 : active} target={target} />
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-800 rounded-xl aspect-[9/16] max-h-64" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-8 text-center rounded-md border border-white/[0.05]">
          <p className="text-sm text-ink-500">Sin videos registrados este mes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {posts.map((p) => <TikTokPostCard key={p.id} post={p} showEditor />)}
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-pulse">
      <div className="h-3 bg-white/[0.06] rounded w-20 mb-8" />
      <div className="h-7 bg-white/[0.08] rounded w-52 mb-2" />
      <div className="h-3 bg-white/[0.05] rounded w-40 mb-10" />
      <div className="h-px bg-white/[0.05] mb-6" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04]">
          <div className="w-7 h-7 rounded-full bg-white/[0.05]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-white/[0.06] rounded w-32" />
            <div className="h-2.5 bg-white/[0.04] rounded w-44" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client,       setClient]       = useState<ClientDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isEditing,    setIsEditing]    = useState(false);
  const [showAssign,   setShowAssign]   = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    if (!id) return;
    admin.clients
      .getById(id)
      .then(setClient)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el cliente")
      )
      .finally(() => setLoading(false));
  }, [id]);

  function handleEditorAssigned(editor: AssignedEditor) {
    setClient((c) => c ? { ...c, editors: [...c.editors, editor] } : null);
    setShowAssign(false);
  }

  function handleEditorUnassigned(editorId: string) {
    setClient((c) => c ? { ...c, editors: c.editors.filter((e) => e.id !== editorId) } : null);
  }

  function handleRoleChanged(editorId: string, role: EditorRole) {
    setClient((c) => c ? { ...c, editors: c.editors.map((e) => e.id === editorId ? { ...e, role } : e) } : null);
  }

  function handleSaved(updated: EditableFields) {
    setClient((c) => c ? { ...c, ...updated } : null);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!client) return;
    setDeleting(true);
    try {
      await admin.clients.delete(client.id);
      router.push("/admin/clients");
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  }

  if (loading)           return <LoadingState />;
  if (error || !client)  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 mb-8">
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Clientes
      </Link>
      <div className="py-14 text-center">
        <p className="text-sm text-error-400">{error ?? "Cliente no encontrado"}</p>
      </div>
    </div>
  );

  const typeBadgeClass = client.type === "COMPANY"
    ? "bg-info-500/10 text-info-400"
    : "bg-success-500/10 text-success-400";

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Breadcrumb */}
      <Link href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 transition-colors mb-6">
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Clientes
      </Link>

      {/* ── Encabezado ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-ink-950 leading-tight truncate">
              {client.name}
            </h1>
            <span className={cn(patterns.badge, typeBadgeClass, "text-xs px-2 py-0.5")}>
              {client.type === "COMPANY" ? "Empresa" : "Creador"}
            </span>
          </div>
          <p className={cn(patterns.metaInline, "mt-1.5")}>
            <span>{client.user.email}</span>
            <span>·</span>
            <span>Creado {formatRelative(client.createdAt)}</span>
            {client.monthlyTarget && (
              <>
                <span>·</span>
                <span>Tanda de {client.monthlyTarget} videos/mes</span>
              </>
            )}
            {client.driveFolderId && (
              <>
                <span>·</span>
                <span className="font-mono text-[11px]">{client.driveFolderId.slice(0, 16)}…</span>
              </>
            )}
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={cn(patterns.btnSecondary, "text-xs py-1.5 px-3 shrink-0")}
          >
            Editar
          </button>
        )}
      </div>

      {/* Formulario de edición inline */}
      {isEditing && (
        <EditForm
          client={client}
          onSaved={handleSaved}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* ── Editores asignados ───────────────────────────────────────────────── */}
      <div className={patterns.sectionGap}>
        <div className="flex items-center justify-between mb-1">
          <p className={patterns.sectionLabel}>Editores asignados</p>
          {!showAssign && (
            <button
              onClick={() => setShowAssign(true)}
              className={cn(patterns.btnGhost, "text-xs gap-1.5 px-2 py-1 h-auto")}
            >
              <PlusSmallIcon className="w-3.5 h-3.5" />
              Asignar editor
            </button>
          )}
        </div>

        <div className="rounded-md overflow-hidden border border-white/[0.05]">
          {showAssign && (
            <AssignEditorForm
              clientId={client.id}
              assignedIds={client.editors.map((e) => e.id)}
              onAssigned={handleEditorAssigned}
              onCancel={() => setShowAssign(false)}
            />
          )}

          {client.editors.length === 0 && !showAssign ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-ink-500">Sin editores asignados.</p>
              <p className="text-xs text-ink-300 mt-0.5">
                Asigná uno para que pueda acceder a los proyectos de este cliente.
              </p>
            </div>
          ) : (
            client.editors.map((editor) => (
              <EditorRow
                key={editor.id}
                editor={editor}
                clientId={client.id}
                onUnassigned={handleEditorUnassigned}
                onRoleChanged={handleRoleChanged}
              />
            ))
          )}
        </div>
      </div>

      <QuotaSection clientId={client.id} target={client.monthlyTarget} />

      {/* ── Proyectos ────────────────────────────────────────────────────────── */}
      <div className={patterns.sectionGap}>
        <div className="flex items-center justify-between mb-1">
          <p className={patterns.sectionLabel}>Proyectos</p>
          <Link
            href={`/admin/projects/new`}
            className={cn(patterns.btnGhost, "text-xs gap-1.5 px-2 py-1 h-auto")}
          >
            <PlusSmallIcon className="w-3.5 h-3.5" />
            Nuevo
          </Link>
        </div>

        {client.projects.length === 0 ? (
          <div className="py-8 text-center rounded-md border border-white/[0.05]">
            <p className="text-sm text-ink-500">Sin proyectos.</p>
          </div>
        ) : (
          <div className="rounded-md overflow-hidden border border-white/[0.05]">
            {client.projects.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── Zona de riesgo ───────────────────────────────────────────────────── */}
      <div className={cn(patterns.sectionGap, "mt-10")}>
        <p className={cn(patterns.sectionLabel, "text-error-500/60")}>Zona de riesgo</p>
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-error-500/15 bg-error-500/[0.04]">
          <div>
            <p className="text-sm font-medium text-ink-950">Eliminar cliente</p>
            <p className="text-xs text-ink-500 mt-0.5">
              Elimina la cuenta y todos sus proyectos, archivos y comentarios. Esta acción no se puede deshacer.
            </p>
          </div>

          {confirmDel ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-ink-500 whitespace-nowrap">¿Estás seguro?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={cn(patterns.btnDanger, "text-xs py-1.5 px-3 disabled:opacity-50")}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className={cn(patterns.btnSecondary, "text-xs py-1.5 px-3")}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className={cn(patterns.btnDanger, "text-xs py-1.5 px-3 shrink-0")}
            >
              Eliminar cliente
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Iconos ───────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function PlusSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
