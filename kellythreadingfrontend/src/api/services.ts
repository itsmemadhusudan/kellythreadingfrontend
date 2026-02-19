import { apiRequest } from './client';
import type { Service } from '../types/crm';

export async function getServices(branchId?: string, all = false): Promise<{ success: boolean; services?: Service[]; message?: string }> {
  const q = new URLSearchParams();
  if (branchId) q.set('branchId', branchId);
  if (all) q.set('all', 'true');
  const query = q.toString();
  const r = await apiRequest<{ services: Service[] }>(`/services${query ? `?${query}` : ''}`);
  if (r.success && 'services' in r) return { success: true, services: (r as { services: Service[] }).services };
  return { success: false, message: (r as { message?: string }).message };
}

export async function createService(data: { name: string; category?: string; branchId?: string; durationMinutes?: number; price?: number }) {
  return apiRequest<{ service: Service }>('/services', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateService(id: string, data: { name?: string; category?: string; branchId?: string; durationMinutes?: number; price?: number }) {
  return apiRequest<{ service: Service }>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteService(id: string) {
  return apiRequest<{ message?: string }>(`/services/${id}`, { method: 'DELETE' });
}
