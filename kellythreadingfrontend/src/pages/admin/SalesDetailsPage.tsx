import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getManualSales, getManualSaleDetail, createManualSale, deleteManualSale } from '../../api/manualSales';
import { getBranches } from '../../api/branches';
import { formatCurrency } from '../../utils/money';
import type { ManualSale, ManualSaleDetail } from '../../api/manualSales';
import type { Branch } from '../../types/common';
import { ROUTES } from '../../config/constants';

function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export default function SalesDetailsPage() {
  const [sales, setSales] = useState<ManualSale[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<ManualSaleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formAmount, setFormAmount] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formImage, setFormImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSales = () => {
    setLoading(true);
    getManualSales({
      from: from || undefined,
      to: to || undefined,
      branchId: branchId || undefined,
    }).then((r) => {
      setLoading(false);
      if (r.success && r.sales) setSales(r.sales);
      else setError(r.message || 'Failed to load');
    });
  };

  useEffect(() => {
    loadSales();
  }, [from, to, branchId]);

  useEffect(() => {
    getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
  }, []);

  const handleAddSale = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormAmount('');
    setFormBranchId(branches[0]?.id || '');
    setFormImage(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBranchId || !formDate || formAmount === '') {
      setError('Branch, date, and amount are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await createManualSale({
      branchId: formBranchId,
      date: new Date(formDate).toISOString(),
      amount: Number(formAmount),
      imageBase64: formImage || undefined,
    });
    setSubmitting(false);
    if (result.success) {
      setModalOpen(false);
      loadSales();
    } else {
      setError(result.message || 'Failed to add sale');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this manual sale entry?')) return;
    setDeletingId(id);
    const result = await deleteManualSale(id);
    setDeletingId(null);
    if (result.success) {
      setDetailModal(null);
      loadSales();
    } else {
      setError(result.message || 'Failed to delete');
    }
  };

  const handleRowClick = (sale: ManualSale) => {
    if (!sale.hasImage) return;
    setDetailLoading(true);
    setDetailModal(null);
    getManualSaleDetail(sale.id).then((r) => {
      setDetailLoading(false);
      if (r.success && r.sale) setDetailModal(r.sale);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormImage(result);
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = (sale: ManualSaleDetail) => {
    if (!sale.imageBase64) return;
    const link = document.createElement('a');
    link.href = sale.imageBase64;
    link.download = `sale-${sale.branchName}-${formatDate(sale.date)}.png`;
    link.click();
  };

  return (
    <div className="dashboard-content">
      <header className="page-hero" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1 className="page-hero-title">Sales details</h1>
          <p className="page-hero-subtitle">
            Manual sales entries by branch. Click a row with an image to view or download.
          </p>
          <Link to={ROUTES.admin.sales} className="filter-btn" style={{ textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>
            ← Back to Sales
          </Link>
        </div>
        <button type="button" className="btn-primary" onClick={handleAddSale} style={{ alignSelf: 'flex-start' }}>
          Add manual sale
        </button>
      </header>

      <section className="content-card">
        <div className="sales-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <label>
            <span>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>
            <span>Branch</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th>Image</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="vendors-empty">No manual sales in this date range.</td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => s.hasImage && handleRowClick(s)}
                      style={{ cursor: s.hasImage ? 'pointer' : 'default' }}
                      className={s.hasImage ? 'clickable-row' : ''}
                    >
                      <td>{s.branchName}</td>
                      <td>{formatDate(s.date)}</td>
                      <td className="num">{formatCurrency(s.amount)}</td>
                      <td>{s.hasImage ? '📷 View' : '—'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="filter-btn"
                          disabled={deletingId === s.id}
                          onClick={() => handleDelete(s.id)}
                          style={{ color: 'var(--theme-error, #c00)' }}
                        >
                          {deletingId === s.id ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add manual sale modal */}
      {modalOpen && (
        <div className="vendor-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="content-card" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: 480, margin: '2rem auto' }}>
            <h2>Add manual sale</h2>
            <form ref={formRef} onSubmit={handleSubmit}>
              <label>
                <span>Branch</span>
                <select value={formBranchId} onChange={(e) => setFormBranchId(e.target.value)} required>
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Date</span>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </label>
              <label>
                <span>Amount</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label>
                <span>Image (optional)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {formImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={formImage} alt="Preview" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4 }} />
                    <button type="button" className="filter-btn" onClick={() => { setFormImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ marginTop: '0.25rem' }}>
                      Remove image
                    </button>
                  </div>
                )}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="filter-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="filter-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image view/download modal */}
      {detailLoading && (
        <div className="vendor-modal-backdrop">
          <div className="content-card" style={{ padding: '1.5rem', margin: '2rem auto' }}>
            <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
          </div>
        </div>
      )}
      {detailModal && !detailLoading && (
        <div className="vendor-modal-backdrop" onClick={() => setDetailModal(null)}>
          <div className="content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, padding: '1.5rem', margin: '2rem auto' }}>
            <h2>{detailModal.branchName} – {formatDate(detailModal.date)}</h2>
            <p>{formatCurrency(detailModal.amount)}</p>
            {detailModal.imageBase64 && (
              <>
                <img src={detailModal.imageBase64} alt="Sale receipt" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="filter-btn" onClick={() => downloadImage(detailModal)}>
                    Download image
                  </button>
                  <button type="button" className="filter-btn" onClick={() => handleDelete(detailModal.id)}>
                    Delete entry
                  </button>
                  <button type="button" className="filter-btn" onClick={() => setDetailModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
