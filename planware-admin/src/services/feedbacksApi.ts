import { api } from "./api";

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export type FeedbackType = "BUG" | "FEATURE" | "REQUISITO" | "OUTRO";
export type FeedbackStatus = "ABERTO" | "EM_ANALISE" | "RESOLVIDO" | "RECUSADO";

export interface FeedbackReply {
  id: string;
  message: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; email: string };
  tenant?: { name: string; slug: string };
  replies?: FeedbackReply[];
}

export interface FeedbackListParams {
  type?: string;
  status?: string;
  tenantId?: string;
}

// ─────────────────────────────────────────────────────────────
//  API
// ─────────────────────────────────────────────────────────────

export const feedbacksApi = {
  list: (params: FeedbackListParams = {}) =>
    api.get<{ success: true; data: Feedback[] }>("/feedback/admin", { params }),

  updateStatus: (id: string, status: FeedbackStatus) =>
    api.patch<{ success: true; data: Feedback }>(
      `/feedback/admin/${id}/status`,
      { status },
    ),

  reply: (id: string, message: string) =>
    api.post<{ success: true; data: FeedbackReply }>(
      `/feedback/admin/${id}/reply`,
      { message },
    ),

  delete: (id: string) => api.delete(`/feedback/admin/${id}`),
};
