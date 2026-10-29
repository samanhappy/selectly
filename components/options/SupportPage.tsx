import SupportQrImage from 'data-base64:~assets/support-qr.png';
import { Heart } from 'lucide-react';
import React from 'react';

import { getSupportUrl } from '../../core/config/monetization';
import type { I18nConfig } from '../../core/i18n/types';
import { SupportLink } from '../shared/SupportLink';
import { PALETTE } from './constants';

export const SupportPage = ({ labels }: { labels: I18nConfig['common'] }) => {
  if (!getSupportUrl()) return null;

  return (
    <div style={{ padding: 12, background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <section className="sl-card" aria-labelledby="support-title">
        <h2 id="support-title" className="m-0 flex items-center gap-2.5 text-lg font-semibold">
          <Heart size={18} aria-hidden="true" />
          {labels.supportProject}
        </h2>
        <p className="mt-3 text-sm text-slate-600">{labels.supportThanks}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <SupportLink label="GitHub Sponsors" />
          <SupportLink label="Ko-fi" href="https://ko-fi.com/samanhappy" />
        </div>
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">{labels.supportQrCode}</h3>
          <img
            src={SupportQrImage}
            alt={labels.supportQrCode}
            width={852}
            height={786}
            className="block h-auto w-full max-w-xs [clip-path:inset(0_1%_1%_0)]"
          />
        </div>
      </section>
    </div>
  );
};
