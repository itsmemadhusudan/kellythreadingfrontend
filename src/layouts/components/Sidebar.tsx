import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon?: string;
  section?: string;
}

interface SidebarProps {
  title: string;
  navItems: NavItem[];
  open: boolean;
  onClose: () => void;
  /** Open ticket count to show as notification badge on Tickets nav item */
  ticketCount?: number;
  /** Route path for Tickets (admin or vendor) to attach the badge */
  ticketsRoute?: string;
}

/** Group consecutive items by section for formatted sidebar */
function groupBySection(items: NavItem[]): { section: string | null; items: NavItem[] }[] {
  const groups: { section: string | null; items: NavItem[] }[] = [];
  let currentSection: string | null = null;
  let currentItems: NavItem[] = [];

  items.forEach((item) => {
    const section = item.section ?? null;
    if (section !== currentSection) {
      if (currentItems.length > 0) {
        groups.push({ section: currentSection, items: currentItems });
      }
      currentSection = section;
      currentItems = [item];
    } else {
      currentItems.push(item);
    }
  });
  if (currentItems.length > 0) {
    groups.push({ section: currentSection, items: currentItems });
  }
  return groups;
}

export function Sidebar({ title, navItems, open, onClose, ticketCount = 0, ticketsRoute }: SidebarProps) {
  const groups = groupBySection(navItems);

  return (
    <div className="dashboard-sidebar-wrapper">
      <div className="sidebar-backdrop" onClick={onClose} aria-hidden />
      <aside className={`dashboard-sidebar ${open ? 'sidebar-open' : ''}`}>
        <nav className="sidebar-nav">
          <div className="sidebar-brand" title={title}>{title}</div>
          {groups.map(({ section, items }, groupIndex) => (
            <div key={section ?? `group-${groupIndex}`} className="sidebar-nav-group">
              {section && <div className="sidebar-nav-section-label">{section}</div>}
              <ul>
                {items.map((item) => {
                  const showTicketBadge = ticketsRoute && item.to === ticketsRoute && ticketCount > 0;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={!item.to.endsWith('/') && !item.to.includes('/') ? false : item.to.split('/').length <= 3}
                        className={({ isActive }) => (isActive ? 'active' : '')}
                        onClick={onClose}
                      >
                        {item.icon && <span className="nav-icon">{item.icon}</span>}
                        <span className="nav-label">{item.label}</span>
                        {showTicketBadge && (
                          <span className="sidebar-nav-badge" aria-label={`${ticketCount} open ticket${ticketCount !== 1 ? 's' : ''}`}>
                            {ticketCount > 99 ? '99+' : ticketCount}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
