import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/settings';
import { getServices, createService, updateService, deleteService } from '../api/services';
import { getBranches } from '../api/branches';
import { formatCurrency } from '../utils/money';
import type { Service } from '../types/crm';
import type { Branch } from '../types/common';

export default function AdminSettings() {
  const [message, setMessage] = useState('');
  const [settlementPercentage, setSettlementPercentage] = useState('');
  const [membershipRenewalCost, setMembershipRenewalCost] = useState('');
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [renewalSaving, setRenewalSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceBranchId, setServiceBranchId] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceCategory, setEditServiceCategory] = useState('');
  const [editServiceBranchId, setEditServiceBranchId] = useState('');
  const [editServiceDuration, setEditServiceDuration] = useState('');
  const [editServicePrice, setEditServicePrice] = useState('');

  useEffect(() => {
    getSettings().then((r) => {
      setSettingsLoading(false);
      if (r.success && r.settings != null) {
        setSettlementPercentage(String(r.settings.settlementPercentage ?? 100));
        setMembershipRenewalCost(String(r.settings.membershipRenewalCost ?? 0));
      }
    });
  }, []);

  useEffect(() => {
    getServices(undefined, true).then((r) => r.success && r.services && setServices(r.services || []));
    getBranches({ all: true }).then((r) => r.success && r.branches && setBranches(r.branches || []));
  }, []);

  function loadServices() {
    getServices(undefined, true).then((r) => r.success && r.services && setServices(r.services || []));
  }

  const handleSaveSettlementPercentage = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(settlementPercentage);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      setMessage('Settlement percentage must be between 0 and 100.');
      return;
    }
    setSettlementSaving(true);
    setMessage('');
    const r = await updateSettings({ settlementPercentage: num });
    setSettlementSaving(false);
    setMessage(r.success ? 'Settlement percentage saved.' : r.message || 'Failed to save.');
  };

  const handleSaveRenewalCost = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(membershipRenewalCost);
    if (Number.isNaN(num) || num < 0) {
      setMessage('Membership renewal cost must be 0 or greater.');
      return;
    }
    setRenewalSaving(true);
    setMessage('');
    const r = await updateSettings({ membershipRenewalCost: num });
    setRenewalSaving(false);
    setMessage(r.success ? 'Membership renewal cost saved.' : r.message || 'Failed to save.');
  };

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceName.trim()) {
      setMessage('Service name is required.');
      return;
    }
    setServiceSubmitting(true);
    setMessage('');
    const r = await createService({
      name: serviceName.trim(),
      category: serviceCategory.trim() || undefined,
      branchId: serviceBranchId || undefined,
      durationMinutes: serviceDuration ? parseInt(serviceDuration, 10) : undefined,
      price: servicePrice ? parseFloat(servicePrice) : undefined,
    });
    setServiceSubmitting(false);
    if (r.success) {
      setServiceName('');
      setServiceCategory('');
      setServiceBranchId('');
      setServiceDuration('');
      setServicePrice('');
      setShowServiceForm(false);
      loadServices();
      setMessage('Service added.');
    } else setMessage((r as { message?: string }).message || 'Failed to add service.');
  }

  async function handleUpdateService(e: React.FormEvent) {
    e.preventDefault();
    if (!editingServiceId) return;
    if (!editServiceName.trim()) {
      setMessage('Service name is required.');
      return;
    }
    setServiceSubmitting(true);
    setMessage('');
    const r = await updateService(editingServiceId, {
      name: editServiceName.trim(),
      category: editServiceCategory.trim() || undefined,
      branchId: editServiceBranchId || undefined,
      durationMinutes: editServiceDuration ? parseInt(editServiceDuration, 10) : undefined,
      price: editServicePrice ? parseFloat(editServicePrice) : undefined,
    });
    setServiceSubmitting(false);
    if (r.success) {
      setEditingServiceId(null);
      loadServices();
      setMessage('Service updated.');
    } else setMessage((r as { message?: string }).message || 'Failed to update service.');
  }

  async function handleDeleteService(id: string) {
    setMessage('');
    const r = await deleteService(id);
    if (r.success) {
      loadServices();
      setMessage('Service removed.');
    } else setMessage((r as { message?: string }).message || 'Failed to remove service.');
  }

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <h2>Settings</h2>
        <p>System and role settings.</p>
        {message && <p className="text-muted" style={{ marginTop: '0.5rem' }}>{message}</p>}
      </section>

      <section className="content-card" style={{ marginTop: '1rem' }}>
        <h3>Settlement percentage</h3>
        <p className="text-muted">
          When a membership is used at a different branch than where it was sold, the using branch owes the selling branch. If a package has a settlement amount set (on the Packages page), that is used. Otherwise this percentage (0–100) is applied to the per-credit value. 100% = full value.
        </p>
        {settingsLoading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <form onSubmit={handleSaveSettlementPercentage} className="auth-form" style={{ maxWidth: '320px', marginTop: '0.5rem' }}>
            <label>
              <span>Settlement percentage (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={settlementPercentage}
                onChange={(e) => setSettlementPercentage(e.target.value)}
                placeholder="100"
              />
            </label>
            <button type="submit" className="auth-submit" disabled={settlementSaving}>
              {settlementSaving ? 'Saving...' : 'Save settlement percentage'}
            </button>
          </form>
        )}
      </section>

      <section className="content-card" style={{ marginTop: '1rem' }}>
        <h3>Membership renewal cost</h3>
        <p className="text-muted">
          When an expired membership is renewed (via the &quot;Renew&quot; button on the membership View/Use page), this amount is set as the new membership&apos;s package price. Set to 0 for free renewal.
        </p>
        {settingsLoading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <form onSubmit={handleSaveRenewalCost} className="auth-form" style={{ maxWidth: '320px', marginTop: '0.5rem' }}>
            <label>
              <span>Renewal cost ($)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={membershipRenewalCost}
                onChange={(e) => setMembershipRenewalCost(e.target.value)}
                placeholder="0"
              />
            </label>
            <button type="submit" className="auth-submit" disabled={renewalSaving}>
              {renewalSaving ? 'Saving...' : 'Save renewal cost'}
            </button>
          </form>
        )}
      </section>

      <section className="content-card" style={{ marginTop: '1rem' }}>
        <h3>Services</h3>
        <p className="text-muted">
          Add and manage services. These appear in the Book appointment form and when adding leads. Leave branch empty for services available to all branches.
        </p>
        <button type="button" className="auth-submit" style={{ width: 'auto', marginTop: '0.5rem', marginBottom: '1rem' }} onClick={() => setShowServiceForm(!showServiceForm)}>
          {showServiceForm ? 'Cancel' : 'Add service'}
        </button>
        {showServiceForm && (
          <form onSubmit={handleAddService} className="auth-form" style={{ maxWidth: '400px', marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--theme-border)', borderRadius: '8px' }}>
            <label><span>Service name <strong>*</strong></span><input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Eyebrow threading" required /></label>
            <label><span>Category (optional)</span><input value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} placeholder="e.g. Threading" /></label>
            <label>
              <span>Branch (optional)</span>
              <select value={serviceBranchId} onChange={(e) => setServiceBranchId(e.target.value)}>
                <option value="">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label><span>Duration (minutes, optional)</span><input type="number" min={1} value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} placeholder="30" /></label>
            <label><span>Price (optional)</span><input type="number" min={0} step="0.01" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="0" /></label>
            <button type="submit" className="auth-submit" disabled={serviceSubmitting}>{serviceSubmitting ? 'Adding…' : 'Add service'}</button>
          </form>
        )}
        {services.length > 0 ? (
          <div className="data-table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Category</th><th>Branch</th><th>Duration</th><th>Price</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    {editingServiceId === s.id ? (
                      <td colSpan={6}>
                        <form onSubmit={handleUpdateService} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <label><span>Name</span><input value={editServiceName} onChange={(e) => setEditServiceName(e.target.value)} required /></label>
                          <label><span>Category</span><input value={editServiceCategory} onChange={(e) => setEditServiceCategory(e.target.value)} /></label>
                          <label>
                            <span>Branch</span>
                            <select value={editServiceBranchId} onChange={(e) => setEditServiceBranchId(e.target.value)}>
                              <option value="">All branches</option>
                              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </label>
                          <label><span>Duration</span><input type="number" min={1} value={editServiceDuration} onChange={(e) => setEditServiceDuration(e.target.value)} /></label>
                          <label><span>Price</span><input type="number" min={0} step="0.01" value={editServicePrice} onChange={(e) => setEditServicePrice(e.target.value)} /></label>
                          <button type="submit" className="filter-btn" disabled={serviceSubmitting}>Save</button>
                          <button type="button" className="filter-btn" onClick={() => setEditingServiceId(null)}>Cancel</button>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.category || '—'}</td>
                        <td>{s.branch || 'All'}</td>
                        <td>{s.durationMinutes ? `${s.durationMinutes} min` : '—'}</td>
                        <td>{s.price != null ? formatCurrency(s.price) : '—'}</td>
                        <td>
                          <button type="button" className="filter-btn" style={{ marginRight: '0.5rem' }} onClick={() => { setEditingServiceId(s.id); setEditServiceName(s.name); setEditServiceCategory(s.category || ''); setEditServiceBranchId(s.branchId || ''); setEditServiceDuration(s.durationMinutes ? String(s.durationMinutes) : ''); setEditServicePrice(s.price != null ? String(s.price) : ''); }}>Edit</button>
                          <button type="button" className="filter-btn" style={{ background: '#dc2626', color: '#fff', border: 'none' }} onClick={() => handleDeleteService(s.id)}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>No services yet. Add one to use in appointments and leads.</p>
        )}
      </section>
    </div>
  );
}
