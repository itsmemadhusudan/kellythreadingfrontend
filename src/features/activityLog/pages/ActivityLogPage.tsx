import { useCallback, useEffect, useState, Fragment } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getActivityLog } from '../../../api/activityLog';
import type { ActivityLogItem } from '../../../api/activityLog';

const PAGE_SIZE = 25;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Format a details key for display (e.g. branchName -> Branch name) */
function formatDetailLabel(key: string): string {
  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
  return label;
}

function formatDetailValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    setExpandedId(null);
    getActivityLog({ page, limit: PAGE_SIZE }).then((r) => {
      setLoading(false);
      if (r.success && r.activities != null) {
        setActivities(r.activities);
        setTotal(r.total ?? 0);
        setTotalPages(r.totalPages ?? 1);
      } else {
        setError(r.message || 'Failed to load activity log');
      }
    });
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="dashboard-content activity-log-page">
      <header className="activity-log-header">
        <div className="activity-log-header-inner">
          <h1 className="activity-log-title">
            {isAdmin ? 'Activity log' : 'My activity'}
          </h1>
          <p className="activity-log-subtitle">
            {isAdmin
              ? 'All system activity. Click a row to view details.'
              : 'Your actions and activity in your branch. Click a row to view details.'}
          </p>
        </div>
        {!loading && total > 0 && (
          <div className="activity-log-stats">
            <span className="activity-log-stats-text">
              First <strong>{activities.length}</strong> items
              {total > PAGE_SIZE && ` · Showing ${from}–${to} of ${total}`}
            </span>
          </div>
        )}
      </header>

      {error && (
        <div className="activity-log-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="activity-log-loading">
          <div className="spinner" aria-hidden />
          <span>Loading activity…</span>
        </div>
      ) : activities.length === 0 ? (
        <section className="activity-log-empty">
          <div className="activity-log-empty-icon" aria-hidden>📋</div>
          <h2 className="activity-log-empty-title">No activities yet</h2>
          <p className="activity-log-empty-text">
            {isAdmin
              ? 'Activity will appear here when users log in, add staff, create branches, or sell memberships.'
              : 'Your actions and branch activity will show here when you or others in your branch use the system.'}
          </p>
        </section>
      ) : (
        <>
          <div className="activity-log-toolbar">
            <button
              type="button"
              className="activity-log-refresh"
              onClick={() => load()}
              aria-label="Refresh"
            >
              Refresh
            </button>
          </div>

          <div className="activity-log-table-wrap">
            <table className="activity-log-table" aria-label="Activity log">
              <thead>
                <tr>
                  <th className="activity-log-th-expand" aria-label="Expand row" />
                  <th className="activity-log-th-name">Operation name</th>
                  <th className="activity-log-th-status">Status</th>
                  <th className="activity-log-th-time">Time</th>
                  <th className="activity-log-th-timestamp">Timestamp</th>
                  {isAdmin && <th className="activity-log-th-user">Event initiated by</th>}
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const isExpanded = expandedId === a.id;
                  return (
                    <Fragment key={a.id}>
                      <tr
                        className={`activity-log-row ${isExpanded ? 'activity-log-row-expanded' : ''}`}
                        onClick={() => toggleExpand(a.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleExpand(a.id);
                          }
                        }}
                        aria-expanded={isExpanded}
                        aria-label={`${a.description}, ${formatRelative(a.createdAt)}`}
                      >
                        <td className="activity-log-td-expand">
                          <span
                            className={`activity-log-chevron ${isExpanded ? 'activity-log-chevron-open' : ''}`}
                            aria-hidden
                          >
                            ▶
                          </span>
                        </td>
                        <td className="activity-log-td-name">
                          <span className="activity-log-op-name">{a.description}</span>
                        </td>
                        <td className="activity-log-td-status">
                          <span className="activity-log-status activity-log-status-succeeded">
                            <span className="activity-log-status-icon" aria-hidden>●</span>
                            Succeeded
                          </span>
                        </td>
                        <td className="activity-log-td-time">{formatRelative(a.createdAt)}</td>
                        <td className="activity-log-td-timestamp">{formatTimestamp(a.createdAt)}</td>
                        {isAdmin && (
                          <td className="activity-log-td-user" title={a.user?.email ?? undefined}>
                            {a.user?.name ?? '—'}
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr key={`${a.id}-detail`} className="activity-log-detail-row" role="row">
                          <td colSpan={isAdmin ? 6 : 5} className="activity-log-detail-cell">
                            <div className="activity-log-detail-panel">
                              <h4 className="activity-log-detail-title">Operation details</h4>
                              <dl className="activity-log-detail-list">
                                <div className="activity-log-detail-item">
                                  <dt>Activity ID</dt>
                                  <dd><code className="activity-log-detail-code">{a.id}</code></dd>
                                </div>
                                <div className="activity-log-detail-item">
                                  <dt>Description</dt>
                                  <dd>{a.description}</dd>
                                </div>
                                {a.entity && (
                                  <div className="activity-log-detail-item">
                                    <dt>Entity type</dt>
                                    <dd>{a.entity}</dd>
                                  </div>
                                )}
                                {a.entityId && (
                                  <div className="activity-log-detail-item">
                                    <dt>Entity ID</dt>
                                    <dd><code className="activity-log-detail-code">{String(a.entityId)}</code></dd>
                                  </div>
                                )}
                                {isAdmin && a.user && (
                                  <>
                                    <div className="activity-log-detail-item">
                                      <dt>Initiated by</dt>
                                      <dd>{a.user.name}{a.user.email ? ` (${a.user.email})` : ''}</dd>
                                    </div>
                                    {a.user.role && (
                                      <div className="activity-log-detail-item">
                                        <dt>User role</dt>
                                        <dd>{a.user.role}</dd>
                                      </div>
                                    )}
                                  </>
                                )}
                                <div className="activity-log-detail-item">
                                  <dt>Timestamp</dt>
                                  <dd><time dateTime={a.createdAt}>{formatDate(a.createdAt)}</time></dd>
                                </div>
                                {a.details && Object.keys(a.details).length > 0 && (
                                  <>
                                    <div className="activity-log-detail-item activity-log-detail-section">
                                      <dt>Additional details</dt>
                                      <dd />
                                    </div>
                                    {Object.entries(a.details).map(([key, value]) => (
                                      <div key={key} className="activity-log-detail-item">
                                        <dt>{formatDetailLabel(key)}</dt>
                                        <dd>
                                          {key.toLowerCase().includes('price') || key.toLowerCase().includes('amount')
                                            ? typeof value === 'number'
                                              ? `$${Number(value).toFixed(2)}`
                                              : formatDetailValue(value)
                                            : formatDetailValue(value)}
                                        </dd>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </dl>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav
              className="activity-log-pagination"
              aria-label="Activity log pagination"
            >
              <button
                type="button"
                className="activity-log-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="activity-log-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="activity-log-pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
