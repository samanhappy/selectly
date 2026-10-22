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
      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      <Heart size={16} aria-hidden="true" />
      {!compact && label}
    </a>
  );
};
