import { apiRequest } from './client';

export interface ManualSale {
  id: string;
  branchId: string;
  branchName: string;
  date: string;
  amount: number;
  hasImage?: boolean;
}

export interface ManualSaleDetail extends ManualSale {
  imageBase64?: string;
}

export async function getManualSales(params?: {
  from?: string;
  to?: string;
  branchId?: string;
}): Promise<{ success: boolean; sales?: ManualSale[]; message?: string }> {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.branchId) q.set('branchId', params.branchId);
  const query = q.toString();
  const r = await apiRequest<{ sales: ManualSale[] }>(`/manual-sales${query ? `?${query}` : ''}`);
  if (r.success && 'sales' in r) return { success: true, sales: (r as { sales: ManualSale[] }).sales };
  return { success: false, message: (r as { message?: string }).message };
}

export async function getManualSaleDetail(id: string): Promise<{
  success: boolean;
  sale?: ManualSaleDetail;
  message?: string;
}> {
  const r = await apiRequest<{ sale: ManualSaleDetail }>(`/manual-sales/${id}`);
  if (r.success && 'sale' in r) return { success: true, sale: (r as { sale: ManualSaleDetail }).sale };
  return { success: false, message: (r as { message?: string }).message };
}

export async function createManualSale(data: {
  branchId: string;
  date: string;
  amount: number;
  imageBase64?: string;
}): Promise<{ success: boolean; sale?: ManualSale; message?: string }> {
  const r = await apiRequest<{ sale: ManualSale }>('/manual-sales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (r.success && 'sale' in r) return { success: true, sale: (r as { sale: ManualSale }).sale };
  return { success: false, message: (r as { message?: string }).message };
}

export async function deleteManualSale(id: string): Promise<{ success: boolean; message?: string }> {
  const r = await apiRequest(`/manual-sales/${id}`, { method: 'DELETE' });
  return r.success ? { success: true } : { success: false, message: (r as { message?: string }).message };
}
