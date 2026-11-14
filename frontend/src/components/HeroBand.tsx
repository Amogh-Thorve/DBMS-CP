import React from 'react';

interface HeroBandProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const HeroBand: React.FC<HeroBandProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children
}) => {
  return (
    <div className="hero-band" style={{ marginBottom: 'var(--spacing-giant)' }}>
      <div className="hero-band-inner">
        <div>
          {badge && (
            <span
              style={{
                display: 'inline-block',
                padding: '3px 8px',
                borderRadius: 'var(--rounded-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '8px'
              }}
            >
              {badge}
            </span>
          )}
          <h1 className="type-hero-title">{title}</h1>
          {subtitle && <p style={{ marginTop: '6px', opacity: 0.9 }}>{subtitle}</p>}
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
      {children && (
        <div style={{ maxWidth: '1440px', margin: '16px auto 0' }}>
          {children}
        </div>
      )}
    </div>
  );
};
