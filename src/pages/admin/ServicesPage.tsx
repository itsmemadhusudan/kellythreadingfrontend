import { useEffect, useState } from 'react';
import { getServices, createService, updateService, deleteService } from '../../api/services';
import { getBranches } from '../../api/branches';
import type { Service } from '../../types/crm';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceBranchId, setServiceBranchId] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const loadServices = () => {
    setLoading(true);
    getServices().then((r) => {
      setLoading(false);
      if (r.success && r.services) setServices(r.services);
    });
  };

  useEffect(() => {
    loadServices();
    getBranches({ all: true }).then((r) => r.success && r.branches && setBranches(r.branches || []));
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      setMessage('');
      setMessageType(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [message]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setMessageType('error');
      setMessage('Service name is required.');
      return;
    }
    const durationNum = serviceDuration.trim() ? parseInt(serviceDuration, 10) : undefined;
    const priceNum = servicePrice.trim() ? parseFloat(servicePrice) : undefined;
    if (serviceDuration.trim() && (Number.isNaN(durationNum) || (durationNum != null && durationNum < 1))) {
      setMessageType('error');
      setMessage('Duration must be at least 1 minute.');
      return;
    }
    if (servicePrice.trim() && (Number.isNaN(priceNum as number) || (priceNum != null && priceNum < 0))) {
      setMessageType('error');
      setMessage('Price must be 0 or greater.');
      return;
    }
    setSaving(true);
    setMessage('');
    setMessageType(null);
    const r = await createService({
      name: serviceName.trim(),
      category: serviceCategory.trim() || undefined,
      branchId: serviceBranchId || undefined,
      durationMinutes: durationNum,
      price: priceNum,
    });
    setSaving(false);
    if (r.success) {
      setServiceName('');
      setServiceCategory('');
      setServiceBranchId('');
      setServiceDuration('');
      setServicePrice('');
      loadServices();
      setMessageType('success');
      setMessage('Service added.');
    } else {
      setMessageType('error');
      setMessage((r as { message?: string }).message || 'Failed to add service.');
    }
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditCategory(s.category || '');
    setEditBranchId(s.branchId || '');
    setEditDuration(s.durationMinutes != null ? String(s.durationMinutes) : '');
    setEditPrice(s.price != null ? String(s.price) : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName.trim()) {
      setMessageType('error');
      setMessage('Name is required.');
      return;
    }
    const durationNum = editDuration.trim() ? parseInt(editDuration, 10) : undefined;
    const priceNum = editPrice.trim() ? parseFloat(editPrice) : undefined;
    if (editDuration.trim() && (Number.isNaN(durationNum) || (durationNum != null && durationNum < 1))) {
      setMessageType('error');
      setMessage('Duration must be at least 1 minute.');
      return;
    }
    if (editPrice.trim() && (Number.isNaN(priceNum as number) || (priceNum != null && priceNum < 0))) {
      setMessageType('error');
      setMessage('Price must be 0 or greater.');
      return;
    }
    setSaving(true);
    setMessage('');
    setMessageType(null);
    const r = await updateService(editingId, {
      name: editName.trim(),
      category: editCategory.trim() || undefined,
      branchId: editBranchId || undefined,
      durationMinutes: durationNum,
      price: priceNum,
    });
    setSaving(false);
    if (r.success) {
      setEditingId(null);
      loadServices();
      setMessageType('success');
      setMessage('Service updated.');
    } else {
      setMessageType('error');
      setMessage((r as { message?: string }).message || 'Failed to update service.');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Remove this service? It will no longer appear in appointments or leads.')) return;
    setSaving(true);
    setMessage('');
    setMessageType(null);
    const r = await deleteService(id);
    setSaving(false);
    if (r.success) {
      loadServices();
      setMessageType('success');
      setMessage('Service removed.');
    } else {
      setMessageType('error');
      setMessage((r as { message?: string }).message || 'Failed to remove service.');
    }
  };

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <header className="page-hero" style={{ marginBottom: '1rem' }}>
          <h1 className="page-hero-title">Services</h1>
          <p className="page-hero-subtitle">
            Add and manage services for appointments and leads. Leave branch blank for all branches.
          </p>
        </header>
        {message && (
          <div className={messageType === 'error' ? 'auth-error' : 'auth-success'} role="alert" style={{ marginBottom: '1rem' }}>
            {message}
          </div>
        )}
        <form onSubmit={handleAddService} className="settings-form settings-form-row" style={{ marginBottom: '1.5rem' }}>
          <label className="settings-label settings-label-flex">
            <span>Name *</span>
            <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Eyebrow threading" className="settings-input" />
          </label>
          <label className="settings-label settings-label-flex">
            <span>Category</span>
            <input type="text" value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} placeholder="Optional" className="settings-input" />
          </label>
          <label className="settings-label settings-label-flex">
            <span>Branch</span>
            <select value={serviceBranchId} onChange={(e) => setServiceBranchId(e.target.value)} className="settings-input">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="settings-label settings-label-flex">
            <span>Duration (min)</span>
            <input type="number" min={1} value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} placeholder="—" className="settings-input settings-input-narrow" />
          </label>
          <label className="settings-label settings-label-flex">
            <span>Price ($)</span>
            <input type="number" min={0} step={0.01} value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="—" className="settings-input settings-input-narrow" />
          </label>
          <button type="submit" className="settings-btn settings-btn-primary" disabled={saving}>
            {saving ? 'Adding…' : 'Add service'}
          </button>
        </form>
        {loading ? (
          <p className="text-muted">Loading services…</p>
        ) : services.length === 0 ? (
          <p className="text-muted">No services yet. Add one above.</p>
        ) : (
          <div className="settings-table-wrap">
            <table className="data-table settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Branch</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    {editingId === s.id ? (
                      <td colSpan={6}>
                        <form onSubmit={handleUpdateService} className="settings-inline-form">
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" required className="settings-input settings-input-sm" />
                          <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Category" className="settings-input settings-input-sm" />
                          <select value={editBranchId} onChange={(e) => setEditBranchId(e.target.value)} className="settings-input settings-input-sm">
                            <option value="">All branches</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          <input type="number" min={1} value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="Min" className="settings-input settings-input-sm" />
                          <input type="number" min={0} step={0.01} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Price" className="settings-input settings-input-sm" />
                          <button type="submit" className="settings-btn settings-btn-sm" disabled={saving}>Save</button>
                          <button type="button" className="settings-btn settings-btn-sm settings-btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td>{s.name}</td>
                        <td>{s.category || '—'}</td>
                        <td>{s.branch || 'All'}</td>
                        <td>{s.durationMinutes != null ? `${s.durationMinutes} min` : '—'}</td>
                        <td>{s.price != null ? `$${s.price}` : '—'}</td>
                        <td>
                          <button type="button" className="settings-btn settings-btn-sm settings-btn-secondary" onClick={() => startEdit(s)}>Edit</button>
                          <button type="button" className="settings-btn settings-btn-sm settings-btn-danger" onClick={() => handleDeleteService(s.id)}>Remove</button>
                        </td>
                      </>
                    )}
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
