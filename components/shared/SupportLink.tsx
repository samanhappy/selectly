import { Heart } from 'lucide-react';
import React from 'react';

import { getSupportUrl } from '../../core/config/monetization';

export const SupportLink = ({ label, compact = false }: { label: string; compact?: boolean }) => {
  const url = getSupportUrl();
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      style={
        compact
          ? { width: 28, height: 28, padding: 0, boxSizing: 'border-box', flexShrink: 0 }
          : undefined
      }
      className={`inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 ${compact ? 'h-7 w-7' : 'gap-2 p-2'}`}
    >
      <Heart size={16} aria-hidden="true" />
      {!compact && label}
    </a>
  );
};
