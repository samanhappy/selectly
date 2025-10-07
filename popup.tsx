import { ExternalLink, Zap } from 'lucide-react';
import React, { useEffect } from 'react';

import { i18n } from './core/i18n';

import './style.css';

// Note: Google Analytics import removed to comply with Chrome Extension Manifest V3
// which prohibits remotely hosted code. Consider using Chrome Extension Analytics API
// or other compliant analytics solutions if tracking is needed.

function IndexPopup() {
  useEffect(() => {
    // Auto open options on first load
    try {
      chrome.runtime?.openOptionsPage?.();
    } catch {}
  }, []);

  // Minimal popup with link to Options
  return (
    <div className="selectly-popup" style={{ width: 360 }}>
      <div className="p-3 border-b border-slate-200 flex items-center gap-2">
        <Zap size={18} className="text-blue-600" />
        <div className="text-sm font-semibold">Selectly</div>
      </div>
      <div className="p-4 text-sm text-slate-700">
        <p className="mb-3">Settings have moved to the Options page.</p>
        <button
          className="sl-btn sl-btn-primary flex items-center gap-2"
          onClick={() => chrome.runtime?.openOptionsPage?.()}
        >
          <ExternalLink size={14} /> Open Options
        </button>
      </div>
    </div>
  );
}

export default IndexPopup;
