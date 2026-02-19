import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getSalesDashboard } from '../../../api/reports';
import { getBranches } from '../../../api/branches';
import { getMembershipTypes } from '../../../api/memberships';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency, formatNumber } from '../../../utils/money';
import { ROUTES } from '../../../config/constants';
import type { SalesDashboard as SalesDashboardType } from '../../../types/common';
import type { Branch, MembershipType } from '../../../types/common';

const breakdownLimit = 10;

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function BranchDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SalesDashboardType | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [branchId, setBranchId] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [from, setFrom] = useState(() => getDefaultDateRange().from);
  const [to, setTo] = useState(() => getDefaultDateRange().to);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<SalesDashboardType | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBreakdownPage, setDetailBreakdownPage] = useState(1);
  const [breakdownPage, setBreakdownPage] = useState(1);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
  }, [isAdmin]);

  useEffect(() => {
    getMembershipTypes().then((r) => r.success && r.membershipTypes && setMembershipTypes(r.membershipTypes || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    getSalesDashboard({
      branchId: branchId || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      serviceCategory: serviceCategory || undefined,
      breakdownPage: isAdmin ? 1 : breakdownPage,
      breakdownLimit: isAdmin ? 1 : breakdownLimit,
    }).then((r) => {
      setLoading(false);
      if (r.success && r.data) setData(r.data);
      else setError(r.message || 'Failed to load');
    });
  }, [branchId, from, to, serviceCategory, isAdmin, breakdownPage]);

  useEffect(() => {
    if (!selectedBranchId) {
      setDetailData(null);
      return;
    }
    setDetailLoading(true);
    getSalesDashboard({
      branchId: selectedBranchId,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      serviceCategory: serviceCategory || undefined,
      breakdownPage: detailBreakdownPage,
      breakdownLimit,
    }).then((r) => {
      setDetailLoading(false);
      if (r.success && r.data) setDetailData(r.data);
      else setDetailData(null);
    });
  }, [selectedBranchId, from, to, serviceCategory, detailBreakdownPage]);

  const selectedBranchName = selectedBranchId && (data?.branches?.find((b) => b.id === selectedBranchId)?.name ?? branches.find((b) => b.id === selectedBranchId)?.name);

  const dailySalesAmount = data
    ? (data.dailySalesTotal ?? (data.dailySales?.reduce((sum, r) => sum + r.amount, 0) ?? 0))
    : 0;
  const membershipSalesAmount = data?.membershipSales ?? 0;
  const totalSalesComputed = membershipSalesAmount + dailySalesAmount;
  const totalSalesDisplay =
    typeof data?.totalSales === 'number' || typeof data?.totalRevenue === 'number'
      ? totalSalesComputed > 0
        ? totalSalesComputed
        : (data?.totalSales ?? data?.totalRevenue ?? 0)
      : totalSalesComputed;

  return (
    <div className="dashboard-content">
      <header className="page-hero">
        <h1 className="page-hero-title">Sales dashboard</h1>
        <p className="page-hero-subtitle">Total sales, memberships, and breakdown by customer and package.</p>
        {isAdmin && (
          <Link to={ROUTES.admin.salesDetails} className="filter-btn" style={{ marginTop: '0.5rem', textDecoration: 'none' }}>
            Sales details (manual entries)
          </Link>
        )}
      </header>
      <section className="content-card">
        <div className="sales-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          {isAdmin && (
            <label>
              <span>Branch</span>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {isAdmin && (
            <label>
              <span>Package / Service</span>
              <select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)}>
                <option value="">All packages</option>
                {[...new Set([
                  ...membershipTypes.map((t) => t.serviceCategory).filter(Boolean),
                  ...(data?.byService?.map((s) => s.serviceCategory) ?? []),
                ])].filter(Boolean).sort().map((cat) => (
                  <option key={cat!} value={cat!}>{cat}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        {error && <div className="auth-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : data && (
          <>
            <div className="owner-hero-stats" style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{formatCurrency(membershipSalesAmount)}</span>
                <span className="owner-hero-stat-label">Membership sales</span>
              </div>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{formatCurrency(dailySalesAmount)}</span>
                <span className="owner-hero-stat-label">Daily sales amount</span>
              </div>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{formatCurrency(totalSalesDisplay)}</span>
                <span className="owner-hero-stat-label">Total sales (Membership + Daily) {isAdmin && !branchId ? '(all branches)' : ''}</span>
              </div>
            </div>
            <div className="sales-membership-section content-card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--theme-bg-subtle)', borderRadius: 8 }}>
              <h2 className="page-section-title" style={{ marginTop: 0 }}>Membership sales only</h2>
              <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
                Revenue from membership sales. Total sales = Membership sales + Daily sales amount (daily amount can be manually updated).
              </p>
              <div className="stat-card" style={{ display: 'inline-block', minWidth: 200 }}>
                <span className="stat-value">{formatCurrency(membershipSalesAmount)}</span>
                <span className="stat-label">Membership sales</span>
              </div>
            </div>
            <div className="sales-daily-section">
              <div className="sales-daily-table-wrap" style={{ minHeight: 280, border: '1px solid var(--theme-border)', borderRadius: 8, padding: '1rem', background: 'var(--theme-bg-subtle)' }}>
                <h3 className="page-section-title" style={{ marginTop: 0, marginBottom: '0.75rem' }}>Daily sales</h3>
                {data.dailySales && data.dailySales.length > 0 ? (
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th className="num">Daily sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.dailySales.map((row) => (
                          <tr key={row.date}>
                            <td>{row.date}</td>
                            <td className="num">{formatCurrency(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="vendors-empty" style={{ margin: 0 }}>No daily sales data for this date range.</p>
                )}
              </div>
              <div className="sales-daily-chart-wrap" style={{ minHeight: 280, border: '1px solid var(--theme-border)', borderRadius: 8, padding: '1rem', background: 'var(--theme-bg-subtle)' }}>
                <h3 className="page-section-title" style={{ marginTop: 0, marginBottom: '0.75rem' }}>Daily sales</h3>
                {data.dailySales && data.dailySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={data.dailySales.map((r) => ({ date: r.date, amount: r.amount, sales: r.amount }))}
                      margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Sales']} labelFormatter={(label) => `Date: ${label}`} />
                      <Bar dataKey="amount" fill="var(--theme-link)" name="Sales" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="vendors-empty" style={{ margin: 0 }}>No daily sales data for this date range.</p>
                )}
              </div>
            </div>
            {isAdmin && (data.byBranch?.length ?? 0) > 0 && (
              <div className="page-section" style={{ marginBottom: '1.5rem' }}>
                <h2 className="page-section-title">Performance by branch</h2>
                <p className="text-muted" style={{ marginBottom: '0.75rem' }}>Click a branch name to see customer/package breakdown.</p>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th className="num">Memberships sold</th>
                        <th className="num">Appointments this month</th>
                        <th className="num">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byBranch.map((row) => {
                        const branchIdForRow = row.branchId ?? data.branches?.find((b) => b.name === row.branch)?.id ?? branches.find((b) => b.name === row.branch)?.id;
                        return (
                          <tr key={row.branch}>
                            <td>
                              {branchIdForRow ? (
                                <button
                                  type="button"
                                  className="branch-name-link"
                                  onClick={() => setSelectedBranchId(branchIdForRow)}
                                >
                                  {row.branch}
                                </button>
                              ) : (
                                <strong>{row.branch}</strong>
                              )}
                            </td>
                            <td className="num">{formatNumber(row.membershipCount ?? 0)}</td>
                            <td className="num">{formatNumber(row.appointmentsThisMonth ?? 0)}</td>
                            <td className="num">{formatNumber(row.completed ?? 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!isAdmin && data && (data.breakdown?.length ?? 0) > 0 && (
              <div className="page-section" style={{ marginBottom: '1.5rem' }}>
                <h2 className="page-section-title">Breakdown (Customer, Package, Price)</h2>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer name</th>
                        <th>Package name</th>
                        <th className="num">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.breakdown || []).map((row, i) => (
                        <tr key={`${row.customerName}-${row.packageName}-${i}`}>
                          <td>{row.customerName}</td>
                          <td>{row.packageName}</td>
                          <td className="num">{formatCurrency(row.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(data.breakdownTotal ?? 0) > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="text-muted">
                      Showing {Math.min((data.breakdownPage ?? 1) * breakdownLimit - breakdownLimit + 1, data.breakdownTotal ?? 0)}–{Math.min((data.breakdownPage ?? 1) * breakdownLimit, data.breakdownTotal ?? 0)} of {data.breakdownTotal}
                    </span>
                    <button type="button" className="filter-btn" disabled={breakdownPage <= 1} onClick={() => setBreakdownPage((p) => Math.max(1, p - 1))}>Previous</button>
                    <button type="button" className="filter-btn" disabled={((data.breakdownPage ?? 1) * breakdownLimit) >= (data.breakdownTotal ?? 0)} onClick={() => setBreakdownPage((p) => p + 1)}>Next</button>
                  </div>
                )}
              </div>
            )}
            {selectedBranchId && (
              <div className="page-section content-card" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--theme-bg-subtle)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 className="page-section-title" style={{ margin: 0 }}>Details for {selectedBranchName ?? 'branch'}</h2>
                  <button type="button" className="filter-btn" onClick={() => { setSelectedBranchId(null); setDetailBreakdownPage(1); }}>Close</button>
                </div>
                {detailLoading ? (
                  <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
                ) : detailData && (
                  <>
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Customer name</th>
                            <th>Package name</th>
                            <th className="num">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailData.breakdown || []).map((row, i) => (
                            <tr key={`${row.customerName}-${row.packageName}-${i}`}>
                              <td>{row.customerName}</td>
                              <td>{row.packageName}</td>
                              <td className="num">{formatCurrency(row.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(!detailData.breakdown || detailData.breakdown.length === 0) && (
                      <p className="vendors-empty">No breakdown data for this branch.</p>
                    )}
                    {(detailData.breakdownTotal ?? 0) > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span className="text-muted">
                          Showing {Math.min((detailData.breakdownPage ?? 1) * breakdownLimit - breakdownLimit + 1, detailData.breakdownTotal ?? 0)}–{Math.min((detailData.breakdownPage ?? 1) * breakdownLimit, detailData.breakdownTotal ?? 0)} of {detailData.breakdownTotal}
                        </span>
                        <button
                          type="button"
                          className="filter-btn"
                          disabled={detailBreakdownPage <= 1}
                          onClick={() => setDetailBreakdownPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          className="filter-btn"
                          disabled={((detailData.breakdownPage ?? 1) * breakdownLimit) >= (detailData.breakdownTotal ?? 0)}
                          onClick={() => setDetailBreakdownPage((p) => p + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
