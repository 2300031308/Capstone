import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import {
  ShieldCheck,
  ArrowRight,
  Boxes,
  Lock,
  Search,
  Truck,
  Factory,
  Store,
  UserCheck,
  Cpu,
  FileCheck,
  CheckCircle2,
  KeyRound,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page-root" id="home">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-container">
          <div className="hero-badge-pill">
            <ShieldCheck size={14} color="var(--primary)" />
            <span>Hyperledger Fabric 2.5 &bull; Enterprise DLT</span>
          </div>

          <h1 className="hero-main-heading">
            Permissioned Supply-Chain Provenance
          </h1>

          <p className="hero-sub-text">
            Powered by Hyperledger Fabric. Secure product registration, verified ownership,
            tamper-evident provenance, and strict role-based access control across the enterprise lifecycle.
          </p>

          <div className="hero-cta-group">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => scrollToSection('capabilities')}
            >
              <span>Explore Platform</span>
              <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/login')}
            >
              <span>Sign In to Portal</span>
            </button>
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="landing-section bg-alt" id="capabilities">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-eyebrow">Enterprise Features</span>
            <h2 className="section-title">Core System Capabilities</h2>
            <p className="section-desc">
              Engineered to enforce zero-trust transparency, immutable ownership tracking, and data integrity across distributed participants.
            </p>
          </div>

          <div className="capabilities-grid">
            <div className="capability-card modern-card">
              <div className="cap-icon-box">
                <Boxes size={22} color="var(--primary)" />
              </div>
              <h3 className="cap-title">Product Provenance</h3>
              <p className="cap-text">
                Chronological chain-of-custody tracking recorded permanently in CouchDB World State with block timestamps and transaction IDs.
              </p>
            </div>

            <div className="capability-card modern-card">
              <div className="cap-icon-box">
                <Layers size={22} color="var(--primary)" />
              </div>
              <h3 className="cap-title">Blockchain-backed Records</h3>
              <p className="cap-text">
                Immutable ledger state maintained by distributed peers, synchronized via Raft crash fault tolerant (CFT) consensus.
              </p>
            </div>

            <div className="capability-card modern-card">
              <div className="cap-icon-box">
                <CheckCircle2 size={22} color="var(--success)" />
              </div>
              <h3 className="cap-title">Product Authenticity</h3>
              <p className="cap-text">
                Cryptographic validation verifying origin signatures against registered manufacturer X.509 root certificates to reject counterfeits.
              </p>
            </div>

            <div className="capability-card modern-card">
              <div className="cap-icon-box">
                <Truck size={22} color="var(--primary)" />
              </div>
              <h3 className="cap-title">Ownership Tracking</h3>
              <p className="cap-text">
                State machine enforcing that only the current verified ledger custodian can authorize downstream custody transfers.
              </p>
            </div>

            <div className="capability-card modern-card">
              <div className="cap-icon-box">
                <Lock size={22} color="var(--primary)" />
              </div>
              <h3 className="cap-title">Role-based Access Control</h3>
              <p className="cap-text">
                Multi-layer authorization segregating manufacturer origin rights, distributor logistics, retail inventory, and consumer queries.
              </p>
            </div>

            <div className="capability-card modern-card">
              <div className="cap-icon-box">
                <Cpu size={22} color="var(--primary)" />
              </div>
              <h3 className="cap-title">Hyperledger Fabric Network</h3>
              <p className="cap-text">
                Permissioned enterprise infrastructure operating on channel <code>mychannel</code> with smart contracts deployed across peer nodes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-eyebrow">Lifecycle Architecture</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-desc">
              Every asset progresses through an authenticated, verified sequence of custody handoffs committed to the blockchain.
            </p>
          </div>

          <div className="workflow-pipeline">
            {/* Step 1: Manufacturer */}
            <div className="pipeline-step modern-card">
              <div className="step-number-badge">1</div>
              <div className="step-icon-wrap">
                <Factory size={26} color="var(--primary)" />
              </div>
              <h4 className="step-role-heading">Manufacturer</h4>
              <span className="step-msp-tag">Org1MSP Origin</span>
              <p className="step-body-desc">
                Registers new physical assets on the ledger with unique Product IDs, batch numbers, and origin metadata.
              </p>
            </div>

            <div className="pipeline-divider">
              <ArrowRight size={20} color="var(--text-muted)" />
            </div>

            {/* Step 2: Distributor */}
            <div className="pipeline-step modern-card">
              <div className="step-number-badge">2</div>
              <div className="step-icon-wrap">
                <Truck size={26} color="var(--primary)" />
              </div>
              <h4 className="step-role-heading">Distributor</h4>
              <span className="step-msp-tag">Org2MSP Logistics</span>
              <p className="step-body-desc">
                Verifies shipment authenticity, takes active custody of freight, and routes consignments to retail centers.
              </p>
            </div>

            <div className="pipeline-divider">
              <ArrowRight size={20} color="var(--text-muted)" />
            </div>

            {/* Step 3: Retailer */}
            <div className="pipeline-step modern-card">
              <div className="step-number-badge">3</div>
              <div className="step-icon-wrap">
                <Store size={26} color="var(--primary)" />
              </div>
              <h4 className="step-role-heading">Retailer</h4>
              <span className="step-msp-tag">Org2MSP Retail</span>
              <p className="step-body-desc">
                Conducts inbound store verification, manages shelf stock, and registers point-of-sale customer transitions.
              </p>
            </div>

            <div className="pipeline-divider">
              <ArrowRight size={20} color="var(--text-muted)" />
            </div>

            {/* Step 4: Customer */}
            <div className="pipeline-step modern-card">
              <div className="step-number-badge">4</div>
              <div className="step-icon-wrap">
                <UserCheck size={26} color="var(--success)" />
              </div>
              <h4 className="step-role-heading">Customer</h4>
              <span className="step-msp-tag">Verified Consumer</span>
              <p className="step-body-desc">
                Scans product ID or QR code to verify cryptographic authenticity and inspect complete tamper-proof provenance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="landing-section bg-alt" id="technology">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-eyebrow">Enterprise Stack</span>
            <h2 className="section-title">Cryptographic &amp; DLT Foundations</h2>
            <p className="section-desc">
              Built on production-proven enterprise distributed ledger standards and cryptographic specifications.
            </p>
          </div>

          <div className="tech-cards-grid">
            <div className="tech-spec-card modern-card">
              <div className="tech-header">
                <Cpu size={20} color="var(--primary)" />
                <h4>Hyperledger Fabric</h4>
              </div>
              <span className="tech-subtitle">Permissioned Blockchain</span>
              <p className="tech-desc">
                Enterprise consortium architecture with private channels, modular consensus, and isolated CouchDB world state databases.
              </p>
            </div>

            <div className="tech-spec-card modern-card">
              <div className="tech-header">
                <FileCheck size={20} color="var(--primary)" />
                <h4>SHA-256</h4>
              </div>
              <span className="tech-subtitle">Data Integrity</span>
              <p className="tech-desc">
                Cryptographic hashing generating unique fingerprint digests of product specifications, preventing unauthorized data modification.
              </p>
            </div>

            <div className="tech-spec-card modern-card">
              <div className="tech-header">
                <KeyRound size={20} color="var(--primary)" />
                <h4>ECDSA Signatures</h4>
              </div>
              <span className="tech-subtitle">Digital Signatures</span>
              <p className="tech-desc">
                Elliptic Curve Digital Signature Algorithm ensuring non-repudiation and tamper-evident proof of origin across supply chain transitions.
              </p>
            </div>

            <div className="tech-spec-card modern-card">
              <div className="tech-header">
                <Lock size={20} color="var(--primary)" />
                <h4>MSP / X.509</h4>
              </div>
              <span className="tech-subtitle">Participant Identity</span>
              <p className="tech-desc">
                Membership Service Provider framework validating cryptographic digital certificates issued by trusted Certificate Authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Platform / About Section */}
      <section className="landing-section" id="about">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-eyebrow">Platform Value</span>
            <h2 className="section-title">Why Permissioned Provenance?</h2>
            <p className="section-desc">
              Conventional supply chain systems rely on centralized databases vulnerable to single-point failures, unauthorized alterations, and counterfeit infiltration.
            </p>
          </div>

          <div className="why-grid">
            <div className="why-item modern-card">
              <div className="why-check"><CheckCircle2 size={18} color="var(--primary)" /></div>
              <div>
                <h4>Guaranteed Product Authenticity</h4>
                <p>Ensures that every product originates from a verified manufacturer and has not been tampered with or substituted in transit.</p>
              </div>
            </div>

            <div className="why-item modern-card">
              <div className="why-check"><CheckCircle2 size={18} color="var(--primary)" /></div>
              <div>
                <h4>Traceable Custody Chain</h4>
                <p>Eliminates blind spots between production warehouses, transport carriers, distribution centers, and point-of-sale retail shelves.</p>
              </div>
            </div>

            <div className="why-item modern-card">
              <div className="why-check"><CheckCircle2 size={18} color="var(--primary)" /></div>
              <div>
                <h4>Permissioned Access Security</h4>
                <p>Restricts administrative actions to authenticated enterprise participants while providing public verification access to end consumers.</p>
              </div>
            </div>

            <div className="why-item modern-card">
              <div className="why-check"><CheckCircle2 size={18} color="var(--primary)" /></div>
              <div>
                <h4>Immutable Audit Trails</h4>
                <p>Every state transition is signed, endorsed by consortium peers, and recorded permanently to satisfy regulatory and quality compliance.</p>
              </div>
            </div>
          </div>

          {/* Bottom Action Card */}
          <div className="cta-banner modern-card">
            <div>
              <h3>Ready to inspect the distributed ledger?</h3>
              <p>Authenticate with your enterprise credentials or verify product authenticity as a consumer.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/login')}
              >
                Sign In to Platform
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/register')}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-left">
            <div className="footer-brand">
              <ShieldCheck size={18} color="var(--primary)" />
              <strong>SupplyChain Provenance</strong>
            </div>
            <p className="footer-tagline">
              Permissioned Supply-Chain Provenance on Hyperledger Fabric
            </p>
          </div>
          <div className="footer-right">
            <span className="footer-copy">
              Computer Science &amp; Engineering Capstone Project &bull; Objective 1 Architecture
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
