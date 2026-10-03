const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {}
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const t = token ?? getToken();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? "Error desconocido");
  }

  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role       = "ADMIN" | "EDITOR" | "CLIENT";
export type ClientType = "COMPANY" | "CREATOR";

export interface AuthResponse {
  token: string;
  user: {
    id:        string;
    name:      string;
    email:     string;
    role:      Role;
    createdAt: string;
  };
}

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),

  me: () => apiFetch<AuthResponse["user"]>("/auth/me"),
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "DELIVERED";

export type ProjectTier = "BASICA" | "SIMPLE" | "PRO";

export const BATCH_SIZES = [5, 10, 20] as const;
export type BatchSize = (typeof BATCH_SIZES)[number];

export const TIER_CONFIG: Record<ProjectTier, { label: string; description: string }> = {
  BASICA: { label: "Básica",  description: "Edición básica, cortes y música"    },
  SIMPLE: { label: "Simple",  description: "Cortes, transiciones y subtítulos"  },
  PRO:    { label: "Pro",     description: "Color grading, efectos y animaciones" },
};

export type MediaType = "VIDEO" | "AUDIO" | "IMAGE";

// ─── Assets ───────────────────────────────────────────────────────────────────

export interface AssetSummary {
  id:          string;
  name:        string;
  mediaType:   MediaType;
  type:        "RAW" | "EDITED";
  driveFileId: string;
  folderId:    string | null;
  createdAt:   string;
  uploadedBy:  { id: string; name: string };
  _count:      { comments: number };
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export interface FolderSummary {
  id:        string;
  name:      string;
  projectId: string;
  createdAt: string;
  _count:    { assets: number };
}

export interface FolderWithAssets extends Omit<FolderSummary, "_count"> {
  assets: AssetSummary[];
}

// ─── Project types ────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id:        string;
  name:      string;
  status:    ProjectStatus;
  batchSize: number | null;
  tier:      ProjectTier | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id:   string;
    name: string;
    type: string;
    user: { id: string; name: string };
  };
  editors: Array<{ user: { id: string; name: string } }>;
  _count:  { assets: number };
}

/** Respuesta de GET /projects/:id — incluye carpetas y assets raíz */
export interface ProjectDetail extends ProjectSummary {
  folders: FolderWithAssets[];
  assets:  AssetSummary[];   // solo los que no tienen carpeta (raíz)
}

// ─── API functions ────────────────────────────────────────────────────────────

export const projects = {
  /** Devuelve array directo (sin wrapper) */
  list: () =>
    apiFetch<ProjectSummary[]>("/projects"),

  create: (data: { name: string; clientId?: string; batchSize?: number; tier?: ProjectTier }) =>
    apiFetch<ProjectSummary>("/projects", { method: "POST", body: data }),

  getById: (id: string) =>
    apiFetch<ProjectDetail>(`/projects/${id}`),

  updateStatus: (id: string, status: ProjectStatus) =>
    apiFetch<ProjectSummary>(`/projects/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
};

export const folders = {
  create: (projectId: string, name: string) =>
    apiFetch<FolderSummary>(`/projects/${projectId}/folders`, {
      method: "POST",
      body: { name },
    }),

  rename: (id: string, name: string) =>
    apiFetch<FolderSummary>(`/folders/${id}`, {
      method: "PATCH",
      body: { name },
    }),

  delete: (id: string) =>
    apiFetch<void>(`/folders/${id}`, { method: "DELETE" }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface ClientSummary {
  id:            string;
  name:          string;
  type:          ClientType;
  driveFolderId: string | null;
  createdAt:     string;
  user:          { id: string; email: string };
  editors:       Array<{ id: string; name: string; email: string }>;
}

export type EditorRole = "PRINCIPAL" | "MULTICUENTA";

export interface AssignedEditor {
  id:    string;
  name:  string;
  email: string;
  role:  EditorRole;
}

export interface ClientDetail extends Omit<ClientSummary, "editors"> {
  monthlyTarget: number | null;
  editors:       AssignedEditor[];
  projects:      Array<{ id: string; name: string; status: ProjectStatus; createdAt: string }>;
}

export interface DashboardProject {
  id:         string;
  name:       string;
  status:     ProjectStatus;
  updatedAt:  string;
  clientName: string;
}

export interface DashboardData {
  stats: {
    total:            number;
    inReview:         number;
    changesRequested: number;
    approved:         number;
    clients:          number;
    editors:          number;
  };
  needsAction:    DashboardProject[];
  recentProjects: DashboardProject[];
}

export interface CreateClientResponse {
  id:        string;
  name:      string;
  email:     string;
  role:      "CLIENT";
  createdAt: string;
  client: {
    id:            string;
    name:          string;
    type:          ClientType;
    driveFolderId: string | null;
    createdAt:     string;
  };
}

export interface EditorSummary {
  id:        string;
  name:      string;
  email:     string;
  role:      "EDITOR";
  createdAt: string;
  clients:   Array<{ id: string; name: string; type: ClientType }>;
}

export const admin = {
  dashboard: () => apiFetch<DashboardData>("/admin/dashboard"),
  clients: {
    list:   () =>
      apiFetch<ClientSummary[]>("/admin/clients"),
    getById: (id: string) =>
      apiFetch<ClientDetail>(`/admin/clients/${id}`),
    create: (data: { name: string; email: string; password: string; type: ClientType; driveFolderId?: string }) =>
      apiFetch<CreateClientResponse>("/admin/clients", { method: "POST", body: data }),
    update: (id: string, data: { name?: string; type?: ClientType; driveFolderId?: string | null; monthlyTarget?: number | null }) =>
      apiFetch<Pick<ClientDetail, "id" | "name" | "type" | "driveFolderId" | "monthlyTarget" | "createdAt">>(
        `/admin/clients/${id}`, { method: "PATCH", body: data }
      ),
    delete: (id: string) =>
      apiFetch<void>(`/admin/clients/${id}`, { method: "DELETE" }),
    assignEditor: (clientId: string, editorId: string, role: EditorRole = "PRINCIPAL") =>
      apiFetch<{ role: EditorRole; client: { id: string; name: string }; editor: { id: string; name: string; email: string } }>(
        `/admin/clients/${clientId}/editors/${editorId}`, { method: "POST", body: { role } }
      ),
    setEditorRole: (clientId: string, editorId: string, role: EditorRole) =>
      apiFetch<{ role: EditorRole }>(
        `/admin/clients/${clientId}/editors/${editorId}`, { method: "PATCH", body: { role } }
      ),
    unassignEditor: (clientId: string, editorId: string) =>
      apiFetch<void>(`/admin/clients/${clientId}/editors/${editorId}`, { method: "DELETE" }),
    tiktokPosts: (clientId: string, month: string) =>
      apiFetch<TikTokPost[]>(`/admin/clients/${clientId}/tiktok-posts?month=${month}`),
  },
  quotas: (month: string) =>
    apiFetch<ClientQuota[]>(`/admin/quotas?month=${month}`),
  editors: {
    list:   () =>
      apiFetch<EditorSummary[]>("/admin/editors"),
    create: (data: { name: string; email: string; password: string }) =>
      apiFetch<Omit<EditorSummary, "clients">>("/admin/editors", { method: "POST", body: data }),
    delete: (id: string) =>
      apiFetch<void>(`/admin/editors/${id}`, { method: "DELETE" }),
  },
};

// ─── Multicuenta TikTok ──────────────────────────────────────────────────────

export interface TikTokAccount {
  id:        string;
  username:  string;
  createdAt: string;
}

export interface TikTokPost {
  id:           string;
  videoId:      string;
  url:          string;
  title:        string;
  thumbnailUrl: string | null;
  postedAt:     string;
  status:       "ACTIVE" | "REMOVED";
  createdAt:    string;
  account:      { id: string; username: string };
  client:       { id: string; name: string };
  editor:       { id: string; name: string };
}

export interface TikTokPostPreview {
  videoId:      string;
  url:          string;
  title:        string;
  thumbnailUrl: string | null;
  postedAt:     string;
  account:      { id: string; username: string };
  client:       { id: string; name: string };
}

export interface MulticuentaClient {
  id:             string;
  name:           string;
  type:           ClientType;
  monthlyTarget:  number | null;
  tiktokAccounts: TikTokAccount[];
  count:          number;   // videos del cliente en el mes (todos los editores)
  myCount:        number;   // videos propios en el mes
}

export interface ClientQuota {
  id:            string;
  name:          string;
  type:          ClientType;
  monthlyTarget: number | null;
  accounts:      number;
  count:         number;
  editors:       Array<{ id: string; name: string; role: EditorRole; count: number }>;
}

export const multicuenta = {
  clients: (month: string) =>
    apiFetch<MulticuentaClient[]>(`/multicuenta/clients?month=${month}`),
  addAccount: (clientId: string, username: string) =>
    apiFetch<TikTokAccount>("/multicuenta/accounts", { method: "POST", body: { clientId, username } }),
  removeAccount: (id: string) =>
    apiFetch<void>(`/multicuenta/accounts/${id}`, { method: "DELETE" }),
  posts: (month: string, clientId?: string) =>
    apiFetch<TikTokPost[]>(
      `/multicuenta/posts?month=${month}${clientId ? `&clientId=${clientId}` : ""}`
    ),
  preview: (url: string) =>
    apiFetch<TikTokPostPreview>("/multicuenta/posts/preview", { method: "POST", body: { url } }),
  register: (url: string) =>
    apiFetch<TikTokPost>("/multicuenta/posts", { method: "POST", body: { url } }),
  deletePost: (id: string) =>
    apiFetch<void>(`/multicuenta/posts/${id}`, { method: "DELETE" }),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  id:        string;
  text:      string;
  timestamp: number;  // segundos (float)
  createdAt: string;
  user: { id: string; name: string; role: string };
}

export const comments = {
  list:   (assetId: string) =>
    apiFetch<Comment[]>(`/assets/${assetId}/comments`),
  add:    (assetId: string, data: { text: string; timestamp: number }) =>
    apiFetch<Comment>(`/assets/${assetId}/comments`, { method: "POST", body: data }),
  delete: (id: string) =>
    apiFetch<void>(`/comments/${id}`, { method: "DELETE" }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id:        string;
  userId:    string;
  title:     string;
  body:      string;
  read:      boolean;
  createdAt: string;
}

export const notifications = {
  list:         ()           => apiFetch<Notification[]>("/notifications"),
  markAsRead:   (id: string) => apiFetch<Notification>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: ()          => apiFetch<void>("/notifications/read-all", { method: "PATCH" }),
};

// ─── Assets ───────────────────────────────────────────────────────────────────

export interface CreateAssetInput {
  name:        string;
  driveFileId: string;
  mediaType:   MediaType;
  type:        "RAW" | "EDITED";
  folderId?:   string;
}

export const assetApi = {
  create: (projectId: string, data: CreateAssetInput) =>
    apiFetch<AssetSummary>(`/projects/${projectId}/assets`, {
      method: "POST",
      body: data,
    }),

  moveToFolder: (assetId: string, folderId: string | null) =>
    apiFetch<AssetSummary>(`/assets/${assetId}/folder`, {
      method: "PATCH",
      body: { folderId },
    }),

  delete: (id: string) =>
    apiFetch<void>(`/assets/${id}`, { method: "DELETE" }),
};
