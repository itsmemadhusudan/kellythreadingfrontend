import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getSalesImages, getSalesImageDetail, createSalesImage } from '../../api/salesImages';
import type { SalesImageItem, SalesImageDetail } from '../../api/salesImages';
import { ROUTES } from '../../config/constants';

function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export default function VendorSalesImagesPage() {
  const [images, setImages] = useState<SalesImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<SalesImageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [salesCountModal, setSalesCountModal] = useState<SalesImageItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formImage, setFormImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = () => {
    setLoading(true);
    getSalesImages().then((r) => {
      setLoading(false);
      if (r.success && r.images) setImages(r.images);
      else setError(r.message || 'Failed to load');
    });
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleAdd = () => {
    setFormTitle('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormImage(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formImage) {
      setError('Title, date, and image are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await createSalesImage({
      title: formTitle.trim(),
      date: new Date(formDate).toISOString(),
      imageBase64: formImage,
    });
    setSubmitting(false);
    if (result.success) {
      setModalOpen(false);
      loadImages();
    } else {
      setError(result.message || 'Failed to add sales image');
    }
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
    link.download = `sales-${formatDate(img.date)}-${img.title.replace(/[^a-z0-9]/gi, '-')}.png`;
    link.click();
  };

  return (
    <div className="dashboard-content">
      <header className="page-hero" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1 className="page-hero-title">Sales images</h1>
          <p className="page-hero-subtitle">
            Add images of total sales for the day. Data is removed after 7 days. Click a row to view.
          </p>
          <Link to={ROUTES.vendor.sales} className="filter-btn" style={{ textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>
            ← Back to Sales
          </Link>
        </div>
        <button type="button" className="btn-primary" onClick={handleAdd} style={{ alignSelf: 'flex-start' }}>
          Add sales image
        </button>
      </header>

      <section className="content-card">
        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Image</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {images.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="vendors-empty">No sales images yet. Add one to get started.</td>
                  </tr>
                ) : (
                  images.map((img) => (
                    <tr key={img.id}>
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

      {modalOpen && (
        <div className="vendor-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="content-card" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: 480, margin: '2rem auto' }}>
            <h2>Add sales image</h2>
            <form ref={formRef} onSubmit={handleSubmit}>
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Daily total sales"
                  required
                />
              </label>
              <label>
                <span>Date</span>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </label>
              <label>
                <span>Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
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

      {salesCountModal && (
        <div className="vendor-modal-backdrop" onClick={() => setSalesCountModal(null)}>
          <div className="content-card" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: 360, margin: '2rem auto' }}>
            <h2>Sales count</h2>
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
            <h2>{detailModal.title}</h2>
            <p>{formatDate(detailModal.date)}</p>
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
