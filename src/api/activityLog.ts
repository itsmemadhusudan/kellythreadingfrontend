import { apiRequest } from './client';

export interface ActivityLogUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface ActivityLogItem {
  id: string;
  description: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  user: ActivityLogUser | null;
}

export interface ActivityLogResponse {
  success: boolean;
  activities?: ActivityLogItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  message?: string;
}

export async function getActivityLog(params: { page?: number; limit?: number }): Promise<ActivityLogResponse> {
  const q = new URLSearchParams();
  if (params.page != null) q.set('page', String(params.page));
  if (params.limit != null) q.set('limit', String(params.limit));
  const query = q.toString();
  const r = await apiRequest<ActivityLogItem[] & { total: number; page: number; limit: number; totalPages: number }>(
    `/activity-log${query ? `?${query}` : ''}`
  );
  if (!r.success) return { success: false, message: (r as ActivityLogResponse).message };
  const d = r as unknown as { activities: ActivityLogItem[]; total: number; page: number; limit: number; totalPages: number };
  return {
    success: true,
    activities: d.activities,
    total: d.total,
    page: d.page,
    limit: d.limit,
    totalPages: d.totalPages,
  };
}
