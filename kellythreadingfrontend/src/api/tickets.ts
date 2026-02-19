import { apiRequest } from './client';

export interface TicketReply {
  id: string;
  message: string;
  userName?: string;
  branchName?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  createdBy?: string;
  createdByBranch?: string;
  targetBranch?: string;
  status: string;
  replyCount?: number;
  createdAt: string;
  replies?: TicketReply[];
}

export async function getTickets(): Promise<{ success: boolean; tickets?: Ticket[]; message?: string }> {
  const r = await apiRequest<{ tickets: Ticket[] }>('/tickets');
  if (r.success && 'tickets' in r) return { success: true, tickets: (r as { tickets: Ticket[] }).tickets };
  return { success: false, message: (r as { message?: string }).message };
}

export async function getTicket(id: string): Promise<{ success: boolean; ticket?: Ticket; message?: string }> {
  const r = await apiRequest<{ ticket: Ticket }>(`/tickets/${id}`);
  if (r.success && 'ticket' in r) return { success: true, ticket: (r as { ticket: Ticket }).ticket };
  return { success: false, message: (r as { message?: string }).message };
}

export async function createTicket(data: { subject: string; body: string; targetBranchId?: string }) {
  return apiRequest<{ ticket: Ticket }>('/tickets', { method: 'POST', body: JSON.stringify(data) });
}

export async function addTicketReply(id: string, message: string): Promise<{ success: boolean; ticket?: Ticket; message?: string }> {
  const r = await apiRequest<{ ticket: Ticket }>(`/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
  if (r.success && 'ticket' in r) return { success: true, ticket: (r as { ticket: Ticket }).ticket };
  return { success: false, message: (r as { message?: string }).message };
}

export async function updateTicketStatus(id: string, status: 'open' | 'closed') {
  return apiRequest<{ ticket: { id: string; status: string } }>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
