import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOwnerOverview } from '../../../api/reports';
import { ROUTES } from '../../../config/constants';
import type { OwnerOverviewBranch } from '../../../types/common';
import type { SettlementSummaryItem } from '../../../api/reports';

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function OwnerDashboardPage() {
  const [overview, setOverview] = useState<OwnerOverviewBranch[]>([]);
  const [settlementSummary, setSettlementSummary] = useState<SettlementSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOwnerOverview().then((r) => {
      setLoading(false);
      if (r.success) {
        if (r.overview) setOverview(r.overview);
        if (r.settlementSummary) setSettlementSummary(r.settlementSummary);
      } else setError(r.message || 'Failed to load overview');
    });
  }, []);

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="owner-overview owner-overview--loading">
          <div className="owner-loading">
            <div className="spinner" />
            <p>Loading branch overview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="owner-overview">
          <div className="owner-error content-card">
            <p className="owner-error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalMemberships = overview.reduce((s, b) => s + b.membershipsSold, 0);
  const totalLeads = overview.reduce((s, b) => s + b.leads, 0);
  const totalAppointments = overview.reduce((s, b) => s + b.appointmentsThisMonth, 0);

  return (
    <div className="dashboard-content">
      <div className="owner-overview">
        {/* Hero / header */}
        <header className="owner-hero">
          <h1 className="owner-hero-title">Branch Overview</h1>
          <p className="owner-hero-subtitle">
            Full visibility across all branches: performance, memberships, leads, and cross-branch settlement.
          </p>
          {overview.length > 0 && (
            <div className="owner-hero-stats">
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{overview.length}</span>
                <span className="owner-hero-stat-label">Branches</span>
              </div>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{formatNumber(totalMemberships)}</span>
                <span className="owner-hero-stat-label">Memberships sold</span>
              </div>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{formatNumber(totalLeads)}</span>
                <span className="owner-hero-stat-label">Total leads</span>
              </div>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{formatNumber(totalAppointments)}</span>
                <span className="owner-hero-stat-label">Appointments this month</span>
              </div>
            </div>
          )}
        </header>

        {/* Cross-branch settlement */}
        {settlementSummary.length > 0 && (
          <section className="owner-settlement content-card">
            <h2 className="owner-section-title">Cross-branch settlement</h2>
            <p className="owner-section-desc">Outstanding balances for membership services delivered at another branch.</p>
            <div className="owner-settlement-table-wrap">
              <table className="owner-settlement-table">
                <thead>
                  <tr>
                    <th>From branch</th>
                    <th>To branch</th>
                    <th className="owner-settlement-amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {settlementSummary.map((s, i) => (
                    <tr key={i}>
                      <td>{s.fromBranch}</td>
                      <td>{s.toBranch}</td>
                      <td className="owner-settlement-amount">
                        ${typeof s.amount === 'number' ? s.amount.toFixed(2) : s.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Link to Sales Dashboard for performance table */}
        <section className="owner-branches content-card">
          <h2 className="owner-section-title">Branch performance</h2>
          <p className="owner-section-desc">
            View the performance by branch table (memberships sold, appointments, completed) with date and package filters on the Sales Dashboard.
          </p>
          <Link to={ROUTES.admin.sales} className="filter-btn" style={{ textDecoration: 'none' }}>
            View Sales Dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}
