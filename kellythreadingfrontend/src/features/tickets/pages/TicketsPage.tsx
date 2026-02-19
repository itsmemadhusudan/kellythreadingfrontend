import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTickets, createTicket } from '../../../api/tickets';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../auth/hooks/useAuth';
import type { Ticket } from '../../../api/tickets';
import type { Branch } from '../../../types/common';
import { ROUTES } from '../../../config/constants';

export default function TicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const basePath = user?.role === 'admin' ? '/admin' : '/vendor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    getTickets().then((r) => {
      setLoading(false);
      if (r.success && r.tickets) setTickets(r.tickets);
      else setError(r.message || 'Failed to load tickets');
    });
  }, []);

  useEffect(() => {
    if (isAdmin) getBranches({ all: true }).then((r) => r.success && r.branches && setBranches(r.branches || []));
  }, [isAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await createTicket({
      subject: subject.trim(),
      body: body.trim(),
      targetBranchId: isAdmin ? (targetBranchId || undefined) : undefined,
    });
    setSubmitting(false);
    if (res.success && res.ticket) {
      setSubject('');
      setBody('');
      setTargetBranchId('');
      setShowForm(false);
      navigate(isAdmin ? ROUTES.admin.ticketDetail(res.ticket.id) : ROUTES.vendor.ticketDetail(res.ticket.id));
      getTickets().then((r) => r.success && r.tickets && setTickets(r.tickets || []));
    } else setError((res as { message?: string }).message || 'Failed to create ticket');
  }

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <header className="page-hero" style={{ marginBottom: '1rem' }}>
          <h1 className="page-hero-title">Tickets</h1>
          <p className="page-hero-subtitle">
            {isAdmin ? 'Communication channel with branches. Create tickets and reply to branch messages.' : 'Contact admin. Create tickets and get responses.'}
          </p>
        </header>
        <button type="button" className="auth-submit" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New ticket'}
        </button>
        {showForm && (
          <form onSubmit={handleCreate} className="auth-form" style={{ maxWidth: '500px', marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--theme-border)', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>New ticket</h3>
            <label><span>Subject <strong>*</strong></span><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief subject" required /></label>
            {isAdmin && (
              <label>
                <span>Send to branch</span>
                <select value={targetBranchId} onChange={(e) => setTargetBranchId(e.target.value)}>
                  <option value="">All branches</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            )}
            <label><span>Message <strong>*</strong></span><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Your message..." required /></label>
            {error && <p className="auth-error" style={{ marginBottom: '0.5rem' }}>{error}</p>}
            <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create ticket'}</button>
          </form>
        )}
        {error && !showForm && <div className="auth-error vendors-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading tickets...</span></div>
        ) : tickets.length === 0 ? (
          <p className="vendors-empty">No tickets yet. Create one to start a conversation.</p>
        ) : (
          <div className="data-table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  {isAdmin && <th>From</th>}
                  {isAdmin && <th>To</th>}
                  <th>Status</th>
                  <th>Replies</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.subject}</strong></td>
                    {isAdmin && <td>{t.createdByBranch || t.createdBy || 'Admin'}</td>}
                    {isAdmin && <td>{t.targetBranch || 'All'}</td>}
                    <td><span className={`status-badge status-${t.status === 'closed' ? 'rejected' : 'approved'}`}>{t.status}</span></td>
                    <td>{t.replyCount ?? 0}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td><Link to={`${basePath}/tickets/${t.id}`} className="filter-btn">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
