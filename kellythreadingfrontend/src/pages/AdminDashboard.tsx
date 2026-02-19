import { useAuth } from '../auth/hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-content">
      <section className="welcome-card">
        <h2>Welcome, {user?.name}</h2>
        <p>Manage branch and system settings from here.</p>
      </section>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">—</span>
          <span className="stat-label">Total Branch</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">—</span>
          <span className="stat-label">Active Branches</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">—</span>
          <span className="stat-label">Pending Tasks</span>
        </div>
      </div>
      <section className="content-card">
        <h3>Quick actions</h3>
        <ul className="quick-actions">
          <li>View and manage branch</li>
          <li>Configure system settings</li>
          <li>Reports (coming soon)</li>
        </ul>
      </section>
    </div>
  );
}
