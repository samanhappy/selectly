import React from 'react';

import { ICON_OPTIONS, isValidIconKey } from '../../../utils/icon-utils';

interface IconSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ label, value, onChange }) => {
  const current = isValidIconKey(value) ? value : 'sparkles';

  return (
    <div className="sl-field">
      <label className="sl-label">{label}</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: 8,
          background: '#fff',
          padding: 8,
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          maxHeight: 180,
          overflowY: 'auto',
        }}
        role="listbox"
        aria-label="Icon selector"
      >
        {ICON_OPTIONS.map(({ key, Icon }) => {
          const selected = key === current;
          return (
            <button
              type="button"
              key={key}
              onClick={() => onChange(key)}
              aria-label={`icon ${key}`}
              aria-selected={selected}
              role="option"
              style={{
                display: 'grid',
                placeItems: 'center',
                height: 36,
                borderRadius: 8,
                border: selected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                background: selected ? '#eff6ff' : '#ffffff',
                color: '#111827',
                cursor: 'pointer',
                transition: 'all 0.12s ease-in-out',
              }}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
      <div className="sl-helper">Click an icon to select</div>
    </div>
  );
};

export default IconSelector;
