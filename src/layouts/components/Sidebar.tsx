import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon?: string;
}

interface SidebarProps {
  title: string;
  navItems: NavItem[];
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ title, navItems, open, onClose }: SidebarProps) {
  return (
    <div className="dashboard-sidebar-wrapper">
      <div className="sidebar-backdrop" onClick={onClose} aria-hidden />
      <aside className={`dashboard-sidebar ${open ? 'sidebar-open' : ''}`}>
        <nav className="sidebar-nav">
          <div className="sidebar-brand" title={title}>{title}</div>
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={!item.to.endsWith('/') && !item.to.includes('/') ? false : item.to.split('/').length <= 3}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  onClick={onClose}
                >
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
