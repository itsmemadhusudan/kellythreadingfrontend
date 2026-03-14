import { useEffect, useState } from 'react';
import { createVendor, getVendors } from '../../api/vendors';
import { getBranches } from '../../api/branches';
import type { Branch } from '../../types/crm';
import type { VendorListItem } from '../../types/auth';

export default function CreateVendorPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recentVendors, setRecentVendors] = useState<VendorListItem[]>([]);

  const loadRecentVendors = () => {
    getVendors(undefined, 5).then((r) => {
      if (r.success && r.vendors && r.vendors.length > 0) {
        setRecentVendors(r.vendors.slice(0, 5));
      } else {
        setRecentVendors([]);
      }
    });
  };

  useEffect(() => {
    getBranches().then((r) => r.success && r.branches && setBranches(r.branches || []));
  }, []);

  useEffect(() => {
    loadRecentVendors();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const res = await createVendor({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      branchId: branchId || undefined,
      vendorName: vendorName.trim() || undefined,
    });
    setSubmitting(false);
    if (res.success) {
      setName('');
      setEmail('');
      setPassword('');
      setVendorName('');
      setBranchId('');
      setSuccess('Vendor/Staff account created. They can now log in with this email and password and will be redirected to the vendor dashboard.');
      loadRecentVendors();
    } else {
      setError(res.message || 'Failed to create vendor.');
    }
  }

  return (
    <div className="dashboard-content">
      <header className="page-hero">
        <h1 className="page-hero-title">Create Vendor / Staff</h1>
        <p className="page-hero-subtitle">Register a new vendor or staff account. They will be stored as role vendor and can log in to access the vendor dashboard.</p>
      </header>
      <section className="content-card">
        <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: '420px' }}>
          <label>
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Login email" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required />
          </label>
          <label>
            <span>Display name (optional)</span>
            <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Vendor / business name" />
          </label>
          <label>
            <span>Branch (optional)</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">— No branch yet</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          {error && <div className="auth-error vendors-error">{error}</div>}
          {success && <div className="auth-success" style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: 8, background: 'rgba(34, 197, 94, 0.15)', color: '#86efac' }}>{success}</div>}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Vendor / Staff'}
          </button>
        </form>
      </section>

      {recentVendors.length > 0 && (
        <section className="content-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Last updated vendors</h3>
          <div className="vendors-table-wrap" style={{ marginTop: '0.75rem' }}>
            <table className="vendors-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Display name</th>
                  <th>Branch</th>
                </tr>
              </thead>
              <tbody>
                {recentVendors.map((v) => (
                  <tr key={v.id}>
                    <td>{v.name || '—'}</td>
                    <td>{v.email || '—'}</td>
                    <td>{v.vendorName || '—'}</td>
                    <td>{v.branchName || '— No branch'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
