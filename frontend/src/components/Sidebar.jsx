import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  Truck,
  ShieldCheck,
  History,
  Building2,
  Lock,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();

  // Define tailored navigation sections per role
  const getNavSections = () => {
    switch (role) {
      case 'manufacturer':
        return [
          {
            title: 'Manufacturer Operations',
            items: [
              { path: '/manufacturer/dashboard', icon: LayoutDashboard, label: 'Overview' },
              { path: '/register', icon: PackagePlus, label: 'Register Product' },
              { path: '/products', icon: Boxes, label: 'Manufactured Assets' },
            ],
          },
          {
            title: 'Provenance & Audit',
            items: [
              { path: '/transfer', icon: Truck, label: 'Custody Transfer', tag: 'O4' },
              { path: '/verify', icon: ShieldCheck, label: 'Verify Authenticity', tag: 'O3' },
              { path: '/history', icon: History, label: 'Provenance History', tag: 'O5' },
            ],
          },
        ];

      case 'distributor':
        return [
          {
            title: 'Logistics Operations',
            items: [
              { path: '/distributor/dashboard', icon: LayoutDashboard, label: 'Logistics Overview' },
              { path: '/products', icon: Boxes, label: 'Custody Inventory' },
              { path: '/transfer', icon: Truck, label: 'Transfer Custody', tag: 'O4' },
            ],
          },
          {
            title: 'Verification',
            items: [
              { path: '/verify', icon: ShieldCheck, label: 'Verify Shipment', tag: 'O3' },
              { path: '/history', icon: History, label: 'Audit Trail', tag: 'O5' },
            ],
          },
        ];

      case 'retailer':
        return [
          {
            title: 'Retail Operations',
            items: [
              { path: '/retailer/dashboard', icon: LayoutDashboard, label: 'Store Overview' },
              { path: '/products', icon: Boxes, label: 'Retail Stock' },
              { path: '/transfer', icon: Truck, label: 'Point-of-Sale / Transfer', tag: 'O4' },
            ],
          },
          {
            title: 'Authentication',
            items: [
              { path: '/verify', icon: ShieldCheck, label: 'Verify Stock', tag: 'O3' },
              { path: '/history', icon: History, label: 'Product Provenance', tag: 'O5' },
            ],
          },
        ];

      case 'customer':
      default:
        return [
          {
            title: 'Consumer Verification',
            items: [
              { path: '/customer/dashboard', icon: ShieldCheck, label: 'Authenticity Check' },
              { path: '/verify', icon: ShieldCheck, label: 'Verify Product', tag: 'O3' },
              { path: '/history', icon: History, label: 'Provenance Timeline', tag: 'O5' },
            ],
          },
        ];
    }
  };

  const navSections = getNavSections();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Building2 size={18} color="#93c5fd" />
        </div>
        <div className="brand-text">
          <h2>Hyperledger Fabric</h2>
          <p>Enterprise Network</p>
        </div>
      </div>

      <div className="sidebar-nav-container">
        {navSections.map((section) => (
          <div className="nav-group" key={section.title}>
            <div className="nav-group-title">{section.title}</div>
            <ul className="nav-list">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <IconComponent size={16} className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                      {item.badge && <span className="nav-badge live">{item.badge}</span>}
                      {item.tag && <span className="nav-badge upcoming">{item.tag}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="network-meta-box">
          <div className="meta-row">
            <span className="meta-label">Consensus:</span>
            <span className="meta-val">Raft</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">State DB:</span>
            <span className="meta-val">CouchDB</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">MSP Identity:</span>
            <span className="meta-val">{user?.mspId || 'Org1MSP'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
