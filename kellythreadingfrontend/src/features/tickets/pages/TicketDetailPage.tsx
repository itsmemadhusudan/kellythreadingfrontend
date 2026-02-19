import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, addTicketReply, updateTicketStatus } from '../../../api/tickets';
import { useAuth } from '../../../auth/hooks/useAuth';
import type { Ticket } from '../../../api/tickets';
import { ROUTES } from '../../../config/constants';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const basePath = user?.role === 'admin' ? '/admin' : '/vendor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    getTicket(id).then((r) => {
      setLoading(false);
      if (r.success && r.ticket) setTicket(r.ticket);
      else setError(r.message || 'Failed to load ticket');
    });
  }, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !replyText.trim()) return;
    setSubmitting(true);
    setError('');
    const res = await addTicketReply(id, replyText.trim());
    setSubmitting(false);
    if (res.success && res.ticket) {
      setTicket(res.ticket);
      setReplyText('');
    } else setError((res as { message?: string }).message || 'Failed to add reply');
  }

  async function handleStatusChange(status: 'open' | 'closed') {
    if (!id) return;
    setError('');
    const res = await updateTicketStatus(id, status);
    if (res.success) setTicket((prev) => (prev ? { ...prev, status } : null));
    else setError((res as { message?: string }).message || 'Failed to update status');
  }

  if (loading || !id) {
    return (
      <div className="dashboard-content">
        <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="dashboard-content">
        <div className="auth-error">{error}</div>
        <button type="button" className="auth-submit" style={{ marginTop: '1rem' }} onClick={() => navigate(isAdmin ? ROUTES.admin.tickets : ROUTES.vendor.tickets)}>Back to tickets</button>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <button type="button" className="vendor-name-btn" style={{ marginBottom: '0.5rem' }} onClick={() => navigate(isAdmin ? ROUTES.admin.tickets : ROUTES.vendor.tickets)}>← Back to tickets</button>
        <div className="ticket-detail-header">
          <div>
            <h1 className="ticket-detail-subject">{ticket!.subject}</h1>
            <p className="ticket-detail-meta text-muted">
              {ticket!.createdByBranch || ticket!.createdBy || 'Admin'} · {ticket!.targetBranch ? `To: ${ticket!.targetBranch}` : 'To: All branches'} · {new Date(ticket!.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="ticket-detail-actions">
            <span className={`status-badge status-${ticket!.status === 'closed' ? 'rejected' : 'approved'}`}>{ticket!.status}</span>
            {ticket!.status === 'open' ? (
              <button type="button" className="filter-btn" onClick={() => handleStatusChange('closed')}>Close ticket</button>
            ) : (
              <button type="button" className="filter-btn" onClick={() => handleStatusChange('open')}>Reopen</button>
            )}
          </div>
        </div>
        <div className="ticket-detail-body">
          <p style={{ whiteSpace: 'pre-wrap' }}>{ticket!.body}</p>
        </div>
        {(ticket!.replies || []).length > 0 && (
          <div className="ticket-replies">
            <h3 className="ticket-replies-title">Replies</h3>
            {ticket!.replies!.map((r) => (
              <div key={r.id} className="ticket-reply-item">
                <div className="ticket-reply-meta">
                  <strong>{r.userName || 'Unknown'}</strong>
                  {r.branchName && <span className="text-muted"> · {r.branchName}</span>}
                  <span className="text-muted"> · {new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p className="ticket-reply-message" style={{ whiteSpace: 'pre-wrap' }}>{r.message}</p>
              </div>
            ))}
          </div>
        )}
        {ticket!.status === 'open' && (
          <form onSubmit={handleReply} className="ticket-reply-form" style={{ marginTop: '1.5rem' }}>
            <label><span>Add reply</span><textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Your reply..." required /></label>
            {error && <p className="auth-error" style={{ marginBottom: '0.5rem' }}>{error}</p>}
            <button type="submit" className="auth-submit" disabled={submitting || !replyText.trim()}>{submitting ? 'Sending…' : 'Send reply'}</button>
          </form>
        )}
      </section>
    </div>
  );
}
