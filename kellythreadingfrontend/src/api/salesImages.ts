import { apiRequest } from './client';

export interface SalesImageItem {
  id: string;
  title: string;
  date: string;
  branchId: string;
  branchName: string;
  hasImage: boolean;
  salesCount: number;
  createdAt: string;
}

export interface SalesImageDetail extends SalesImageItem {
  imageBase64?: string;
}

export async function getSalesImages(params?: {
  branchId?: string;
}): Promise<{ success: boolean; images?: SalesImageItem[]; message?: string }> {
  const q = new URLSearchParams();
  if (params?.branchId) q.set('branchId', params.branchId);
  const query = q.toString();
  const r = await apiRequest<{ images: SalesImageItem[] }>(`/sales-images${query ? `?${query}` : ''}`);
  if (r.success && 'images' in r) return { success: true, images: (r as { images: SalesImageItem[] }).images };
  return { success: false, message: (r as { message?: string }).message };
}

export async function getSalesImageDetail(id: string): Promise<{
  success: boolean;
  image?: SalesImageDetail;
  message?: string;
}> {
  const r = await apiRequest<{ image: SalesImageDetail }>(`/sales-images/${id}`);
  if (r.success && 'image' in r) return { success: true, image: (r as { image: SalesImageDetail }).image };
  return { success: false, message: (r as { message?: string }).message };
}

export async function createSalesImage(data: {
  title: string;
  date: string;
  imageBase64: string;
  branchId?: string;
}): Promise<{ success: boolean; image?: SalesImageItem; message?: string }> {
  const r = await apiRequest<{ image: SalesImageItem }>('/sales-images', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (r.success && 'image' in r) return { success: true, image: (r as { image: SalesImageItem }).image };
  return { success: false, message: (r as { message?: string }).message };
}
