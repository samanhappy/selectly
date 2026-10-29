import { Heart } from 'lucide-react';
import React from 'react';

import { getSupportUrl } from '../../core/config/monetization';

export const SupportLink = ({ label, href }: { label: string; href?: string }) => {
  const url = getSupportUrl();
  if (!url) return null;

  return (
    <a
      href={href ?? url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="sl-btn sl-btn-secondary min-h-11"
    >
      <Heart size={16} aria-hidden="true" />
      {label}
    </a>
  );
};
