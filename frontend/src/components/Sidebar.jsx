import { NavLink } from 'react-router-dom';

const navSections = [
  {
    title: 'Core Platform',
    items: [
      { path: '/dashboard', icon: '📊', label: 'Dashboard', badge: 'Live' },
      { path: '/products', icon: '📦', label: 'All Products' },
      { path: '/register', icon: '➕', label: 'Register Product', roleOnly: 'manufacturer' },
    ],
  },
  {
    title: 'Provenance & Lifecycle',
    items: [
      { path: '/transfer', icon: '🔄', label: 'Transfer Ownership', tag: 'O4' },
      { path: '/verify', icon: '🛡️', label: 'Verify Product', tag: 'O3' },
      { path: '/history', icon: '📜', label: 'Provenance History', tag: 'O5' },
    ],
  },
];

export default function Sidebar({ role }) {
  const currentRole = (role || 'manufacturer').toLowerCase();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-box">🔗</div>
        <div className="brand-text">
          <h2>Hyperledger Fabric</h2>
          <p>Permissioned Ledger</p>
        </div>
      </div>

      <div className="sidebar-nav-container">
        {navSections.map((section) => (
          <div className="nav-group" key={section.title}>
            <div className="nav-group-title">{section.title}</div>
            <ul className="nav-list">
              {section.items.map((item) => {
                // If item has role restriction and doesn't match, we still show it or highlight
                const isPermitted = !item.roleOnly || item.roleOnly === currentRole;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'active' : ''} ${!isPermitted ? 'role-dimmed' : ''}`
                      }
                      title={!isPermitted ? `Primary action for ${item.roleOnly}` : undefined}
                    >
                      <span className="nav-icon">{item.icon}</span>
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
            <span className="meta-label">Channel:</span>
            <span className="meta-val">mychannel</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Consensus:</span>
            <span className="meta-val">Raft</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">State DB:</span>
            <span className="meta-val">CouchDB</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
