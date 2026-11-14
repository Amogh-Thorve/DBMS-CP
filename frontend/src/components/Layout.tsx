import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AlertTriangle, X } from 'lucide-react';

interface LayoutProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [quickHelpModalOpen, setQuickHelpModalOpen] = useState<boolean>(false);

  return (
    <div className="app-container">
      {/* Two-Storey Chrome */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Catalogue Slide-Out Drawer (Mobile & Desktop On-Demand) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="main-content">
        <main className="content-body">
          {children(activeTab, setActiveTab)}
        </main>
      </div>

      {/* =====================================================================
          PERSISTENT FLOATING AFFORDANCE ({component.button-floating})
          Background: {colors.primary} (#0057d2), Height: 58px, Rounded: {rounded.md} (8px)
          Padding: 16px 20px, Type: {typography.caption}
          ===================================================================== */}
      <button
        className="button-floating"
        onClick={() => setQuickHelpModalOpen(true)}
        aria-label="Enterprise Quick Actions and System Documentation"
        title="Quick Assistance & Specification Guide"
      >
        <AlertTriangle size={18} />
        <span>Quick Assist & Spec</span>
      </button>

      {/* Quick Assist / Help Modal */}
      {quickHelpModalOpen && (
        <div className="modal-backdrop" onClick={() => setQuickHelpModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="sap-logo-box">SAP</div>
                <h3 style={{ margin: 0 }}>STVAMS Enterprise Command Centre</h3>
              </div>
              <button
                onClick={() => setQuickHelpModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--colors-ink)', marginBottom: '6px' }}>
                  SAP Web Surface Design System Active
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--colors-ink-body)', lineHeight: '1.5' }}>
                  This application is rendered strictly following the <strong>design.md</strong> specification:
                  two-storey chrome, flat bands (<code>{`{colors.chrome}`}</code>, <code>{`{colors.band-blue}`}</code>, <code>{`{colors.band-lavender}`}</code>),
                  true black headlines, slate copy, <code>#0057d2</code> acting blue, tight 8px controls, and square zone geometry.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--colors-chrome)',
                    border: '1px solid var(--colors-hairline-subtle)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--colors-ink)', marginBottom: '4px' }}>
                    DBMS Core Engine
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--colors-ink-meta)' }}>
                    Dual-Driver: Oracle Autonomous / Local SQLite with transparent failover.
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--colors-band-blue)',
                    border: '1px solid #cce7ff'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--colors-primary)', marginBottom: '4px' }}>
                    Surface Ground
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--colors-ink-meta)' }}>
                    Canvas white ground (57-69%) framed by broad flat zones.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setActiveTab('search');
                    setQuickHelpModalOpen(false);
                  }}
                >
                  Search Catalogue
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setQuickHelpModalOpen(false)}
                >
                  Close Specification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ENTERPRISE FOOTER GROUND ({colors.band} - #eaecee)
          Full-bleed, square edges ({rounded.none}), text: {colors.ink-nav} (#545454)
          ===================================================================== */}
      <footer className="sap-footer">
        <div className="footer-inner">
          <div className="footer-cols">
            <div className="footer-col">
              <h5>Registry & Assets</h5>
              <ul>
                <li><a href="#vehicles" onClick={(e) => { e.preventDefault(); setActiveTab('vehicles'); }}>Vehicle Registration Registry</a></li>
                <li><a href="#owners" onClick={(e) => { e.preventDefault(); setActiveTab('owners'); }}>Registered Legal Owners</a></li>
                <li><a href="#drivers" onClick={(e) => { e.preventDefault(); setActiveTab('drivers'); }}>Licensed Drivers Database</a></li>
                <li><a href="#cameras" onClick={(e) => { e.preventDefault(); setActiveTab('cameras'); }}>ANPR Surveillance Hardware</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Enforcement & Tribunal</h5>
              <ul>
                <li><a href="#violations" onClick={(e) => { e.preventDefault(); setActiveTab('violations'); }}>Traffic Violation Records</a></li>
                <li><a href="#fines" onClick={(e) => { e.preventDefault(); setActiveTab('fines'); }}>Challan Invoicing & Penalties</a></li>
                <li><a href="#appeals" onClick={(e) => { e.preventDefault(); setActiveTab('appeals'); }}>Tribunal Dispute Appeals</a></li>
                <li><a href="#payments" onClick={(e) => { e.preventDefault(); setActiveTab('payments'); }}>Settlements & Reconciliation</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Analytics & Surveillance</h5>
              <ul>
                <li><a href="#dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>Operational GIS Command Hub</a></li>
                <li><a href="#analytics" onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }}>Intelligence & Repeat Offenders</a></li>
                <li><a href="#events" onClick={(e) => { e.preventDefault(); setActiveTab('events'); }}>Live Vehicle Telemetry Stream</a></li>
                <li><a href="#reports" onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}>Audit & Compliance Export</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Enterprise Architecture</h5>
              <ul>
                <li><span style={{ fontSize: '13px', color: 'var(--colors-ink-meta)' }}>Design Specification: SAP Web Surface</span></li>
                <li><span style={{ fontSize: '13px', color: 'var(--colors-ink-meta)' }}>Chrome: 60px Two-Storey Global Frame</span></li>
                <li><span style={{ fontSize: '13px', color: 'var(--colors-ink-meta)' }}>Color Model: SAP Blue (#0057d2), Deep Blue (#0040b0)</span></li>
                <li><span style={{ fontSize: '13px', color: 'var(--colors-ink-meta)' }}>Database: Relational Normalization & ACID</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-legal-strip">
            <div>
              &copy; 2026 STVAMS Enterprise Traffic Systems. Conforms to SAP Enterprise Design Specification.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Strict Privacy Standards</span>
              <span>Regulatory Traffic Enforcement</span>
              <span>Audit Logging Enabled</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
