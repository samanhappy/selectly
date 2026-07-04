import { MoveVertical } from 'lucide-react';
import React from 'react';

import {
  MAX_SELECTION_FLOATING_GAP,
  MIN_SELECTION_FLOATING_GAP,
  normalizeSelectionFloatingGap,
} from '../../../core/config/llm-config';

interface SelectionFloatingGapControlProps {
  value?: number;
  label?: string;
  description?: string;
  onChange: (value: number) => void;
}

export const SelectionFloatingGapControl: React.FC<SelectionFloatingGapControlProps> = ({
  value,
  label = 'Distance from selection',
  description = 'Controls the spacing between selected text and Selectly panels.',
  onChange,
}) => {
  const gap = normalizeSelectionFloatingGap(value);

  return (
    <>
      <label className="sl-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MoveVertical size={16} /> {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="range"
          min={MIN_SELECTION_FLOATING_GAP}
          max={MAX_SELECTION_FLOATING_GAP}
          step={1}
          value={gap}
          aria-label={label}
          onChange={(event) => onChange(normalizeSelectionFloatingGap(event.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ minWidth: 44, textAlign: 'right', fontSize: 12, color: '#475569' }}>
          {gap}px
        </span>
      </div>
      <div className="sl-helper">{description}</div>
    </>
  );
};
