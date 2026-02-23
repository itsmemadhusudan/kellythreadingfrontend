import { useEffect, useState, useCallback } from 'react';
import { getSalesDashboard } from '../../../api/reports';
import { getBranches } from '../../../api/branches';
import {
  getManualSales,
  createManualSale,
  deleteManualSale,
  getManualSale,
  type ManualSale,
} from '../../../api/manualSales';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency, formatNumber } from '../../../utils/money';
import type { SalesDashboard as SalesDashboardType } from '../../../types/common';
import type { Branch } from '../../../types/common';

const breakdownLimit = 10;

export default function SalesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SalesDashboardType | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<SalesDashboardType | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBreakdownPage, setDetailBreakdownPage] = useState(1);
  const [breakdownPage, setBreakdownPage] = useState(1);

  // Manual sales state
  const [manualSales, setManualSales] = useState<ManualSale[]>([]);
  const [manualSalesLoading, setManualSalesLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addBranchId, setAddBranchId] = useState('');
  const [addDate, setAddDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addCount, setAddCount] = useState('');
  const [addImage, setAddImage] = useState<File | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const fetchManualSales = useCallback(() => {
    setManualSalesLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - 30);
    getManualSales({
      from: from.toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      branchId: isAdmin && branchId ? branchId : undefined,
    }).then((r) => {
      setManualSalesLoading(false);
      if (r.success) setManualSales(r.sales || []);
    });
  }, [isAdmin, branchId]);

  useEffect(() => {
    if (isAdmin) getBranches({ all: true }).then((r) => r.success && r.branches && setBranches(r.branches || []));
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    getSalesDashboard({
      branchId: branchId || undefined,
      breakdownPage: isAdmin ? 1 : breakdownPage,
      breakdownLimit: isAdmin ? 1 : breakdownLimit,
    }).then((r) => {
      setLoading(false);
      if (r.success && r.data) setData(r.data);
      else setError(r.message || 'Failed to load');
    });
  }, [branchId, isAdmin, breakdownPage]);

  useEffect(() => {
    if (!selectedBranchId) {
      setDetailData(null);
      return;
    }
    setDetailLoading(true);
    getSalesDashboard({
      branchId: selectedBranchId,
      breakdownPage: detailBreakdownPage,
      breakdownLimit,
    }).then((r) => {
      setDetailLoading(false);
      if (r.success && r.data) setDetailData(r.data);
      else setDetailData(null);
    });
  }, [selectedBranchId, detailBreakdownPage]);

  useEffect(() => {
    fetchManualSales();
  }, [fetchManualSales]);

  useEffect(() => {
    if (isAdmin && branches.length && !addBranchId) setAddBranchId(user?.branchId || branches[0]?.id || '');
  }, [isAdmin, branches, addBranchId, user?.branchId]);

  const selectedBranchName =
    selectedBranchId &&
    (data?.branches?.find((b) => b.id === selectedBranchId)?.name ??
      branches.find((b) => b.id === selectedBranchId)?.name);

  async function handleAddSale(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    const count = parseInt(addCount, 10);
    if (isNaN(count) || count < 0) {
      setAddError('Enter a valid number of sales (0 or more).');
      return;
    }
    const effectiveBranchId = isAdmin ? addBranchId : user?.branchId;
    if (!effectiveBranchId) {
      setAddError('Branch is required.');
      return;
    }
    if (!addDate) {
      setAddError('Date is required.');
      return;
    }

    let imageBase64: string | undefined;
    if (addImage) {
      const base64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string)?.split(',')[1] || null);
        reader.readAsDataURL(addImage);
      });
      if (base64) imageBase64 = base64;
    }

    setAddSubmitting(true);
    const r = await createManualSale({
      branchId: isAdmin ? effectiveBranchId : undefined,
      date: addDate,
      amount: count,
      imageBase64,
    });
    setAddSubmitting(false);

    if (r.success) {
      setShowAddForm(false);
      setAddCount('');
      setAddDate(new Date().toISOString().slice(0, 10));
      setAddImage(null);
      fetchManualSales();
    } else setAddError(r.message || 'Failed to record sale');
  }

  async function handleViewImage(id: string) {
    const r = await getManualSale(id);
    if (r.success && r.sale?.imageBase64) setViewImage(r.sale.imageBase64);
  }

  async function handleDelete(id: string) {
    if (!isAdmin) return;
    setDeletingId(id);
    const r = await deleteManualSale(id);
    setDeletingId(null);
    if (r.success) fetchManualSales();
  }

  const totalManualCount = manualSales.reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <div className="dashboard-content sales-page">
      <header className="page-hero">
        <h1 className="page-hero-title">Sales</h1>
        <p className="page-hero-subtitle">
          Track revenue, memberships, and record daily sales count manually for reporting.
        </p>
      </header>

      {/* Record sale – industry-level form */}
      <section className="sales-record-section content-card">
        <div className="sales-record-header">
          <div>
            <h2 className="sales-record-title">Record sale</h2>
            <p className="sales-record-desc">
              Add the number of sales for a given date. Optional: attach a receipt photo. Counts feed into reports and sales images.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary sales-record-toggle"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setAddError('');
            }}
            aria-expanded={showAddForm}
          >
            {showAddForm ? 'Cancel' : '+ Record sale'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddSale} className="sales-record-form">
            <div className="sales-record-fields">
              {isAdmin && (
                <div className="sales-record-field">
                  <label htmlFor="add-branch">Branch</label>
                  <select
                    id="add-branch"
                    value={addBranchId}
                    onChange={(e) => setAddBranchId(e.target.value)}
                    required
                  >
                    <option value="">— Select branch —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sales-record-field">
                <label htmlFor="add-date">Date</label>
                <input
                  id="add-date"
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                />
              </div>
              <div className="sales-record-field">
                <label htmlFor="add-count">Number of sales</label>
                <input
                  id="add-count"
                  type="number"
                  min={0}
                  step={1}
                  value={addCount}
                  onChange={(e) => setAddCount(e.target.value)}
                  placeholder="e.g. 12"
                  required
                />
              </div>
              <div className="sales-record-field">
                <label htmlFor="add-image">Receipt (optional)</label>
                <input
                  id="add-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAddImage(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            {addError && <div className="alert alert-error sales-record-error">{addError}</div>}
            <div className="sales-record-actions">
              <button type="submit" className="btn-primary" disabled={addSubmitting}>
                {addSubmitting ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Recent manual sales */}
      <section className="content-card sales-manual-list">
        <h2 className="sales-section-title">Recent manual sales</h2>
        <p className="sales-section-desc">
          Last 30 days. Total recorded: <strong>{formatNumber(totalManualCount)}</strong> sales.
        </p>
        {manualSalesLoading ? (
          <div className="loading-placeholder">Loading…</div>
        ) : manualSales.length === 0 ? (
          <p className="sales-empty">No manual sales recorded yet.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {isAdmin && <th>Branch</th>}
                  <th className="num">Count</th>
                  <th>Receipt</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {manualSales.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.date).toLocaleDateString()}</td>
                    {isAdmin && <td>{s.branchName}</td>}
                    <td className="num">{formatNumber(s.amount)}</td>
                    <td>
                      {s.hasImage ? (
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => handleViewImage(s.id)}
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => handleDelete(s.id)}
                          disabled={!!deletingId}
                        >
                          {deletingId === s.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dashboard stats */}
      <section className="content-card">
        {isAdmin && (
          <div className="sales-filters">
            <label>
              <span>Branch</span>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {error && <div className="auth-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading">
            <div className="spinner" />
            <span>Loading...</span>
          </div>
        ) : (
          data && (
            <>
              <h2 className="sales-section-title">Revenue & memberships</h2>
              <div className="owner-hero-stats" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                <div className="owner-hero-stat">
                  <span className="owner-hero-stat-value">
                    {typeof data.totalSales === 'number'
                      ? formatCurrency(data.totalSales)
                      : typeof data.totalRevenue === 'number'
                        ? formatCurrency(data.totalRevenue)
                        : '—'}
                  </span>
                  <span className="owner-hero-stat-label">
                    Total revenue {isAdmin && !branchId ? '(all branches)' : ''}
                  </span>
                </div>
              </div>
              {isAdmin && (data.byBranch?.length ?? 0) > 0 && (
                <>
                  <div className="page-section" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="page-section-title">Sales by branch</h3>
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Branch name</th>
                            <th className="num">Total sales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.byBranch.map((row) => {
                            const branchIdForRow =
                              data.branches?.find((b) => b.name === row.branch)?.id ??
                              branches.find((b) => b.name === row.branch)?.id;
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
                                <td className="num">{formatCurrency(row.sales ?? row.revenue)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="page-section" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="page-section-title">Memberships by branch</h3>
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Branch</th>
                            <th className="num">Total number</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.byBranch.map((row) => (
                            <tr key={row.branch}>
                              <td>
                                <strong>{row.branch}</strong>
                              </td>
                              <td className="num">{formatNumber(row.membershipCount ?? 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              {!isAdmin && data && (data.breakdown?.length ?? 0) > 0 && (
                <div className="page-section" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="page-section-title">Breakdown (Customer, Package, Price)</h3>
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
                    <div
                      style={{
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <span className="text-muted">
                        Showing{' '}
                        {Math.min(
                          (data.breakdownPage ?? 1) * breakdownLimit - breakdownLimit + 1,
                          data.breakdownTotal ?? 0
                        )}
                        –{Math.min((data.breakdownPage ?? 1) * breakdownLimit, data.breakdownTotal ?? 0)} of{' '}
                        {data.breakdownTotal}
                      </span>
                      <button
                        type="button"
                        className="filter-btn"
                        disabled={breakdownPage <= 1}
                        onClick={() => setBreakdownPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="filter-btn"
                        disabled={(data.breakdownPage ?? 1) * breakdownLimit >= (data.breakdownTotal ?? 0)}
                        onClick={() => setBreakdownPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
              {selectedBranchId && (
                <div
                  className="page-section content-card"
                  style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'var(--theme-bg-subtle)',
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <h3 className="page-section-title" style={{ margin: 0 }}>
                      Details for {selectedBranchName ?? 'branch'}
                    </h3>
                    <button
                      type="button"
                      className="filter-btn"
                      onClick={() => {
                        setSelectedBranchId(null);
                        setDetailBreakdownPage(1);
                      }}
                    >
                      Close
                    </button>
                  </div>
                  {detailLoading ? (
                    <div className="vendors-loading">
                      <div className="spinner" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    detailData && (
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
                          <div
                            style={{
                              marginTop: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span className="text-muted">
                              Showing{' '}
                              {Math.min(
                                (detailData.breakdownPage ?? 1) * breakdownLimit - breakdownLimit + 1,
                                detailData.breakdownTotal ?? 0
                              )}
                              –{Math.min(
                                (detailData.breakdownPage ?? 1) * breakdownLimit,
                                detailData.breakdownTotal ?? 0
                              )}{' '}
                              of {detailData.breakdownTotal}
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
                              disabled={
                                (detailData.breakdownPage ?? 1) * breakdownLimit >=
                                (detailData.breakdownTotal ?? 0)
                              }
                              onClick={() => setDetailBreakdownPage((p) => p + 1)}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )
                  )}
                </div>
              )}
            </>
          )
        )}
      </section>

      {viewImage && (
        <div
          className="modal-overlay"
          onClick={() => setViewImage(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setViewImage(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={`data:image/jpeg;base64,${viewImage}`}
              alt="Receipt"
              style={{ maxWidth: '100%', maxHeight: '85vh' }}
            />
            <button type="button" className="modal-close" onClick={() => setViewImage(null)}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
