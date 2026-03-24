import { useState, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../auth/auth.store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ProfileMenu } from './components/ProfileMenu';
import { NotificationBell } from './components/NotificationBell';
import { PageLoader } from '../components/ui/PageLoader';
import { ROUTES } from '../config/constants';
import { getTicketCount } from '../api/tickets';
import { getSettings } from '../api/settings';

interface NavItem {
  to: string;
  label: string;
  icon?: string;
  section?: string;
}

const ownerNav: NavItem[] = [
  // Overview
  { to: ROUTES.admin.root, label: 'Dashboard', icon: '📊', section: 'Overview' },
  { to: ROUTES.admin.sales, label: 'Sales dashboard', icon: '💰', section: 'Overview' },
  // Staff & branches
  { to: ROUTES.admin.vendors, label: 'Staff (assign branch)', icon: '👤', section: 'Staff & branches' },
  { to: ROUTES.admin.createVendor, label: 'Add new staff', icon: '➕', section: 'Staff & branches' },
  { to: ROUTES.admin.branches, label: 'Branches', icon: '📍', section: 'Staff & branches' },
  // Business
  { to: ROUTES.admin.salesImages, label: 'Sales Data', icon: '🖼️', section: 'Business' },
  { to: ROUTES.admin.memberships, label: 'Memberships', icon: '🎫', section: 'Business' },
  { to: ROUTES.admin.customers, label: 'Customers', icon: '👥', section: 'Business' },
  { to: ROUTES.admin.packages, label: 'Packages', icon: '📦', section: 'Business' },
  { to: ROUTES.admin.leads, label: 'Leads inbox', icon: '📥', section: 'Business' },
  { to: ROUTES.admin.appointments, label: 'Appointments', icon: '📅', section: 'Business' },
  { to: ROUTES.admin.services, label: 'Services', icon: '✂️', section: 'Business' },
  { to: ROUTES.admin.settlements, label: 'Settlements', icon: '📋', section: 'Business' },
  { to: ROUTES.admin.loyalty, label: 'Loyalty', icon: '⭐', section: 'Business' },
  // Account & system
  { to: ROUTES.admin.profile, label: 'My profile', icon: '👤', section: 'Account & system' },
  { to: ROUTES.admin.tickets, label: 'Tickets', icon: '🎫', section: 'Account & system' },
  { to: ROUTES.admin.activityLog, label: 'Activity log', icon: '📋', section: 'Account & system' },
  { to: ROUTES.admin.guidelines, label: 'Guidelines', icon: '📄', section: 'Account & system' },
  { to: ROUTES.admin.rolesPermissions, label: 'Roles & permissions', icon: '🛡️', section: 'Account & system' },
  { to: ROUTES.admin.settings, label: 'Settings', icon: '⚙️', section: 'Account & system' },
];

const branchNav: NavItem[] = [
  // Overview
  { to: ROUTES.vendor.root, label: 'Dashboard', icon: '📊', section: 'Overview' },
  { to: ROUTES.vendor.sales, label: 'Sales', icon: '💰', section: 'Overview' },
  { to: ROUTES.vendor.salesImages, label: 'Sales Data', icon: '🖼️', section: 'Overview' },
  // Business
  { to: ROUTES.vendor.memberships, label: 'Memberships', icon: '🎫', section: 'Business' },
  { to: ROUTES.vendor.customers, label: 'Customers', icon: '👥', section: 'Business' },
  { to: ROUTES.vendor.packages, label: 'Packages', icon: '📦', section: 'Business' },
  { to: ROUTES.vendor.leads, label: 'Leads inbox', icon: '📥', section: 'Business' },
  { to: ROUTES.vendor.appointments, label: 'Appointments', icon: '📅', section: 'Business' },
  { to: ROUTES.vendor.services, label: 'Services', icon: '✂️', section: 'Business' },
  { to: ROUTES.vendor.settlements, label: 'Settlements', icon: '📋', section: 'Business' },
  { to: ROUTES.vendor.loyalty, label: 'Loyalty', icon: '⭐', section: 'Business' },
  // Account
  { to: ROUTES.vendor.profile, label: 'My profile', icon: '👤', section: 'Account' },
  { to: ROUTES.vendor.activityLog, label: 'Activity log', icon: '📋', section: 'Account' },
  { to: ROUTES.vendor.guidelines, label: 'Guidelines', icon: '📄', section: 'Account' },
  { to: ROUTES.vendor.tickets, label: 'Tickets', icon: '🎫', section: 'Account' },
];

interface DashboardLayoutProps {
  title: string;
  navItems?: NavItem[];
}

export function DashboardLayout({ title, navItems: navItemsProp }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  const [showGuidelinesInVendor, setShowGuidelinesInVendor] = useState<boolean>(true);
  const [showNotificationBellToVendors, setShowNotificationBellToVendors] = useState<boolean>(true);
  const [showNotificationBellToAdmins, setShowNotificationBellToAdmins] = useState<boolean>(true);
  const { user } = useAuthStore();

  useEffect(() => {
    getSettings().then((r) => {
      if (r.success && r.settings) {
        if (typeof r.settings.showGuidelinesInVendorDashboard === 'boolean') {
          setShowGuidelinesInVendor(r.settings.showGuidelinesInVendorDashboard);
        }
        if (typeof r.settings.showNotificationBellToVendors === 'boolean') {
          setShowNotificationBellToVendors(r.settings.showNotificationBellToVendors);
        }
        if (typeof r.settings.showNotificationBellToAdmins === 'boolean') {
          setShowNotificationBellToAdmins(r.settings.showNotificationBellToAdmins);
        }
      }
    });
  }, [user?.role]);

  const vendorNavItems =
    showGuidelinesInVendor
      ? branchNav
      : branchNav.filter((item) => item.to !== ROUTES.vendor.guidelines);
  const navItems = navItemsProp ?? (user?.role === 'admin' ? ownerNav : vendorNavItems);
  const displayTitle = title || (user?.role === 'admin' ? 'Owner Dashboard' : 'Branch Dashboard');
  const ticketsRoute = user?.role === 'admin' ? ROUTES.admin.tickets : ROUTES.vendor.tickets;

  useEffect(() => {
    getTicketCount().then((r) => {
      if (r.success && r.openCount != null) setTicketCount(r.openCount);
    });
    const interval = setInterval(() => {
      getTicketCount().then((r) => {
        if (r.success && r.openCount != null) setTicketCount(r.openCount);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`dashboard ${sidebarOpen ? 'dashboard-sidebar-open' : ''}`}>
      <Topbar title={displayTitle} onMenuClick={() => setSidebarOpen((o) => !o)}>
        {((user?.role === 'admin' && showNotificationBellToAdmins) || (user?.role === 'vendor' && showNotificationBellToVendors)) && <NotificationBell />}
        <ProfileMenu />
      </Topbar>
      <Sidebar
        title={displayTitle}
        navItems={navItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ticketCount={ticketCount}
        ticketsRoute={ticketsRoute}
      />
      <main className="dashboard-main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
