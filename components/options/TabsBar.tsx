import React from 'react';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsBarProps {
  active: string;
  items: TabItem[];
  onChange: (key: string) => void;
  surfaceBorder?: string;
  surfaceBg?: string;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  active,
  items,
  onChange,
  surfaceBorder,
  surfaceBg,
}) => {
  return (
    <div
      className="sl-tabs"
      style={{
        background: surfaceBg,
        borderBottom: surfaceBorder ? `1px solid ${surfaceBorder}` : undefined,
      }}
    >
      {items.map((i) => (
        <button
          key={i.key}
          className="sl-tab-btn"
          data-active={active === i.key}
          onClick={() => onChange(i.key)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {i.icon}
            {i.label}
          </div>
        </button>
      ))}
    </div>
  );
};
