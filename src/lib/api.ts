// In production (Vercel) the API lives on a different origin, so point at it via
// VITE_API_BASE_URL. Locally this is unset and we use Vite's dev proxy at '/api'.
// Normalized so it works whether the env value includes the `/api` suffix or not
// (e.g. both "https://x.onrender.com" and "https://x.onrender.com/api" resolve to
// ".../api") — a common deploy foot-gun.
const BASE = (() => {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '/api';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
})();

function getToken() { return localStorage.getItem('diya_token'); }

function headers(extra: Record<string, string> = {}) {
  const token = getToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers(), ...(options.headers as Record<string, string> || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string, role: 'student' | 'professor') =>
      request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request<User>('/auth/me'),
    updateProfile: (data: Partial<User>) => request<User>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  groups: {
    list: () => request<Group[]>('/groups'),
    create: (name: string, description: string) => request<Group>('/groups', { method: 'POST', body: JSON.stringify({ name, description }) }),
    get: (id: number | string) => request<Group>(`/groups/${id}`),
    byName: (name: string) => request<Group>(`/groups/by-name/${encodeURIComponent(name)}`),
    join: (code: string) => request<{ message: string; group: Group }>('/groups/join', { method: 'POST', body: JSON.stringify({ code }) }),
    members: (id: number | string) => request<User[]>(`/groups/${id}/members`),
  },

  forum: {
    list: (groupId: number | string) => request<Question[]>(`/groups/${groupId}/forum`),
    post: (groupId: number | string, title: string, body: string, tags?: string) =>
      request<Question>(`/groups/${groupId}/forum`, { method: 'POST', body: JSON.stringify({ title, body, tags }) }),
    getQuestion: (id: number | string) => request<Question & { replies: Reply[] }>(`/forum/question/${id}`),
    reply: (questionId: number | string, body: string) =>
      request<Reply>(`/forum/question/${questionId}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
    updateAIStatus: (questionId: number | string, status: 'verified' | 'rejected') =>
      request(`/forum/question/${questionId}/ai-status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  requests: {
    list: (groupId: number | string) => request<OHRequest[]>(`/groups/${groupId}/requests`),
    create: (groupId: number | string, subject: string, description: string, preferred_time: string) =>
      request<OHRequest>(`/groups/${groupId}/requests`, { method: 'POST', body: JSON.stringify({ subject, description, preferred_time }) }),
    update: (id: number | string, status: string, scheduled_at?: string) =>
      request(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status, scheduled_at }) }),
  },

  workflow: {
    queue: (groupId: number | string) => request<WorkflowItem[]>(`/workflow/queue/${groupId}`),
    history: (groupId: number | string) => request<WorkflowItem[]>(`/workflow/history/${groupId}`),
    resolve: (itemId: number | string, action: string, ai_status?: string) =>
      request(`/workflow/item/${itemId}/resolve`, { method: 'PATCH', body: JSON.stringify({ action, ai_status }) }),
    summary: (groupId: number | string) => request<WorkflowSummary>(`/workflow/summary/${groupId}`),
  },

  clusters: {
    list: (groupId: number | string) => request<ConfusionCluster[]>(`/clusters/${groupId}`),
    recommend: (clusterId: number | string) =>
      request<{ recommendation: InterventionRec; cluster: ConfusionCluster }>(`/clusters/${clusterId}/refresh-clusters`, { method: 'POST' }),
    updateStatus: (clusterId: number | string, status: string) =>
      request(`/clusters/${clusterId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  interventions: {
    list: (groupId: number | string) => request<Intervention[]>(`/interventions/${groupId}`),
    create: (groupId: number | string, data: Partial<Intervention> & { topic?: string }) =>
      request<Intervention>(`/interventions/${groupId}`, { method: 'POST', body: JSON.stringify(data) }),
    generateAnnouncement: (id: number | string, topic: string, insights: string) =>
      request<{ announcement: string }>(`/interventions/${id}/generate-announcement`, { method: 'POST', body: JSON.stringify({ topic, insights }) }),
    updateStatus: (id: number | string, status: string) =>
      request(`/interventions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  approvedAnswers: {
    list: (groupId: number | string) => request<ApprovedAnswer[]>(`/approved-answers/${groupId}`),
    create: (groupId: number | string, data: Partial<ApprovedAnswer>) =>
      request<ApprovedAnswer>(`/approved-answers/${groupId}`, { method: 'POST', body: JSON.stringify(data) }),
  },

  ai: {
    selfCheck: (data: { assignment_name: string; rubric_name: string; rubric_text: string; work_text: string }) =>
      request<SelfCheckResult>('/ai/self-check', { method: 'POST', body: JSON.stringify(data) }),
    analysis: (groupId: number | string) => request<AnalysisResult>(`/ai/analysis/${groupId}`),
    history: () => request<SelfCheckReport[]>('/self-check/history'),
  },

  admin: {
    metrics: () => request<AdminMetrics>('/admin/metrics'),
    queueHealth: () => request<QueueHealth>('/admin/queue-health'),
    aiUsage: () => request<AIUsageSummary>('/admin/ai-usage'),
  },

  knowledge: {
    list: (groupId: number | string) => request<KnowledgeDoc[]>(`/knowledge/${groupId}`),
    upload: (groupId: number | string, file: File) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      return fetch(`${BASE}/knowledge/${groupId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d as { message: string; filename: string; chunks: number }; });
    },
    delete: (groupId: number | string, filename: string) =>
      request(`/knowledge/${groupId}/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () => request<AppNotification[]>('/notifications'),
    readAll: () => request('/notifications/read-all', { method: 'PATCH' }),
    read: (id: number) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  },

  health: () => request<{ status: string; ai_enabled: boolean; version: string }>('/health'),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User { id: number; name: string; email: string; role: 'student' | 'professor'; avatar?: string; bio?: string; }
export interface Group { id: number; name: string; code: string; description: string; professor_id: number; professor_name: string; member_count: number; created_at: string; }
export interface Question { id: number; group_id: number; user_id: number; author_name: string; title: string; body: string; tags: string; topic?: string; ai_answer: string | null; ai_status: 'pending' | 'generating' | 'verified' | 'rejected'; confidence_score?: number | null; routing_decision?: string; escalation_reason?: string; rag_sources?: string | null; upvotes: number; reply_count: number; created_at: string; }
export interface KnowledgeDoc { id: number; filename: string; chunks: number; uploaded_at: string; }
export interface Reply { id: number; question_id: number; user_id: number; author_name: string; author_role: 'student' | 'professor'; body: string; upvotes: number; is_accepted: number; created_at: string; }
export interface AppNotification { id: number; user_id: number; type: string; title: string; message: string; link: string | null; read: number; created_at: string; }
export interface OHRequest { id: number; group_id: number; student_id: number; student_name: string; subject: string; description: string; status: 'pending' | 'approved' | 'rejected' | 'completed'; preferred_time: string; scheduled_at: string | null; created_at: string; }
export interface SelfCheckResult { id: number; letter_grade: string; score: string; summary: string; strengths: string[]; improvements: { section: string; suggestion: string }[]; assignment_name: string; rubric_name: string; }
export interface SelfCheckReport { id: number; assignment_name: string; rubric_name: string; letter_grade: string; score_text: string; improvements: { section: string; suggestion: string }[]; created_at: string; }
export interface AnalysisResult { topics: { id: string; name: string; count: number; trend: 'rising' | 'steady' | 'declining'; status: 'needs-attention' | 'proficient'; insight: string; recommendation: string; }[]; overall_summary: string; total_questions: number; }

export interface WorkflowItem {
  id: number; question_id: number; group_id: number; status: 'processed' | 'escalated' | 'resolved' | 'auto_resolved';
  routing_decision: 'normal' | 'duplicate' | 'low_confidence' | 'escalated';
  duplicate_of?: number; confidence_score?: number; topic?: string; escalation_reason?: string;
  resolved_by?: number; resolved_at?: string; created_at: string;
  title: string; body: string; ai_answer?: string; ai_status?: string; rag_sources?: string | null; student_name: string;
}

export interface WorkflowSummary {
  totalQuestions: number; questionsThisWeek: number; escalated: number; resolved: number;
  duplicates: number; verified: number; rejected: number; acceptanceRate: number | null;
  avgConfidence: number | null; activeClusters: number; criticalClusters: number;
  approvedAnswers: number; clusters: ConfusionCluster[];
}

export interface ConfusionCluster {
  id: number; group_id: number; topic: string; question_count: number;
  severity: 'low' | 'medium' | 'high' | 'critical'; status: 'open' | 'intervention_sent' | 'resolved';
  first_seen: string; last_seen: string;
}

export interface InterventionRec { type: string; title: string; content: string; urgency: string; }

export interface Intervention {
  id: number; group_id: number; cluster_id?: number; type: string; title: string; content: string;
  created_by: number; status: 'draft' | 'sent' | 'tracked'; outcome_before?: number; outcome_after?: number;
  effectiveness?: number; created_at: string;
}

export interface ApprovedAnswer {
  id: number; group_id: number; source_question_id?: number; topic?: string;
  question_pattern: string; answer: string; usage_count: number; created_by: number; created_by_name: string; created_at: string;
}

export interface AdminMetrics {
  totalRequests: number; requests24h: number; failedRequests: number; avgLatency: number | null;
  totalTokens: number; escalationRate: number; duplicateRate: number;
  requestsByType: { request_type: string; count: number; avg_latency: number; errors: number }[];
  dailyActivity: { date: string; requests: number; errors: number }[];
}

export interface QueueHealth { unresolved: number; criticalClusters: number; pendingReview: number; draftInterventions: number; }

export interface AIUsageSummary {
  aiEnabled: boolean; publicDemoMode: boolean;
  todayCalls: number; todaySpendUsd: number; monthlySpendUsd: number; blockedToday: number;
  dailyBudgetUsd: number; monthlyBudgetUsd: number; remainingDailyUsd: number; remainingMonthlyUsd: number;
  callsByType: { request_type: string; calls: number; blocked: number; cost: number }[];
}

export function saveAuth(token: string, user: User) { localStorage.setItem('diya_token', token); localStorage.setItem('diya_user', JSON.stringify(user)); }
export function getUser(): User | null { const u = localStorage.getItem('diya_user'); return u ? JSON.parse(u) : null; }
export function clearAuth() { localStorage.removeItem('diya_token'); localStorage.removeItem('diya_user'); }
export function isLoggedIn() { return !!localStorage.getItem('diya_token'); }
