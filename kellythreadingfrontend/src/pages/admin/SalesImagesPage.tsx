import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSalesImages, getSalesImageDetail } from '../../api/salesImages';
import { getBranches } from '../../api/branches';
import type { SalesImageItem, SalesImageDetail } from '../../api/salesImages';
import type { Branch } from '../../types/common';
import { ROUTES } from '../../config/constants';

function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export default function AdminSalesImagesPage() {
  const [images, setImages] = useState<SalesImageItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState<SalesImageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [salesCountModal, setSalesCountModal] = useState<SalesImageItem | null>(null);

  const loadImages = () => {
    setLoading(true);
    getSalesImages({ branchId: branchId || undefined }).then((r) => {
      setLoading(false);
      if (r.success && r.images) setImages(r.images);
      else setError(r.message || 'Failed to load');
    });
  };

  useEffect(() => {
    loadImages();
  }, [branchId]);

  useEffect(() => {
    getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
  }, []);

  const handleRowClick = (img: SalesImageItem) => {
    setDetailLoading(true);
    setDetailModal(null);
    getSalesImageDetail(img.id).then((r) => {
      setDetailLoading(false);
      if (r.success && r.image) setDetailModal(r.image);
    });
  };

  const downloadImage = (img: SalesImageDetail) => {
    if (!img.imageBase64) return;
    const link = document.createElement('a');
    link.href = img.imageBase64;
    link.download = `sales-${img.branchName}-${formatDate(img.date)}-${img.title.replace(/[^a-z0-9]/gi, '-')}.png`;
    link.click();
  };

  return (
    <div className="dashboard-content">
      <header className="page-hero" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1 className="page-hero-title">Sales images</h1>
          <p className="page-hero-subtitle">
            Branch sales images with title and date. Data is removed after 7 days. Use buttons to view image or sales count.
          </p>
          <Link to={ROUTES.admin.sales} className="filter-btn" style={{ textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>
            ← Back to Sales
          </Link>
        </div>
      </header>

      <section className="content-card">
        <div className="sales-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
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
                  <th>Title</th>
                  <th>Date</th>
                  <th>Image</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {images.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="vendors-empty">No sales images yet. Branches can add images from their dashboard.</td>
                  </tr>
                ) : (
                  images.map((img) => (
                    <tr key={img.id}>
                      <td>{img.branchName}</td>
                      <td>{img.title}</td>
                      <td>{formatDate(img.date)}</td>
                      <td>
                        <button type="button" className="filter-btn" onClick={() => handleRowClick(img)}>
                          📷 View image
                        </button>
                      </td>
                      <td>
                        <button type="button" className="btn-primary" onClick={() => setSalesCountModal(img)}>
                          Sales count
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

      {detailLoading && (
        <div className="vendor-modal-backdrop">
          <div className="content-card" style={{ padding: '1.5rem', margin: '2rem auto' }}>
            <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
          </div>
        </div>
      )}
      {salesCountModal && (
        <div className="vendor-modal-backdrop" onClick={() => setSalesCountModal(null)}>
          <div className="content-card" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: 360, margin: '2rem auto' }}>
            <h2>Sales count</h2>
            <p><strong>{salesCountModal.branchName}</strong></p>
            <p>Date: {formatDate(salesCountModal.date)}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0' }}>
              Total sales: <strong>{salesCountModal.salesCount}</strong>
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #666)' }}>
              Manual sales + memberships for this branch on this date.
            </p>
            <button type="button" className="filter-btn" onClick={() => setSalesCountModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {detailModal && !detailLoading && (
        <div className="vendor-modal-backdrop" onClick={() => setDetailModal(null)}>
          <div className="content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, padding: '1.5rem', margin: '2rem auto' }}>
            <h2>{detailModal.title}</h2>
            <p><strong>{detailModal.branchName}</strong> – {formatDate(detailModal.date)}</p>
            <p>Sales count: <strong>{detailModal.salesCount}</strong></p>
            {detailModal.imageBase64 && (
              <>
                <img src={detailModal.imageBase64} alt={detailModal.title} style={{ maxWidth: '100%', borderRadius: 8, marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="filter-btn" onClick={() => downloadImage(detailModal)}>
                    Download image
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
