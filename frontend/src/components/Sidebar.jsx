import { NavLink } from 'react-router-dom';

const navItems = [
  { section: 'Main', items: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  ]},
  { section: 'Products', items: [
    { path: '/products', icon: '📦', label: 'All Products' },
    { path: '/register', icon: '➕', label: 'Register Product' },
  ]},
  { section: 'Operations', items: [
    { path: '/transfer', icon: '🔄', label: 'Transfer Ownership' },
    { path: '/verify', icon: '✅', label: 'Verify Product' },
    { path: '/history', icon: '📜', label: 'Provenance History' },
  ]},
];

export default function Sidebar({ role, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>
          <span className="logo-icon">🔗</span>
          SupplyChain
        </h1>
        <p>Blockchain Provenance</p>
      </div>

      {navItems.map((section) => (
        <div className="sidebar-section" key={section.section}>
          <div className="sidebar-section-title">{section.section}</div>
          <ul className="sidebar-nav">
            {section.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="sidebar-role">
        <div className="role-badge">
          {role || 'Manufacturer'}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginTop: '12px' }}
          onClick={onLogout}
        >
          Switch Role
        </button>
      </div>
    </aside>
  );
}
