/**
 * GeneralPage Component
 * Single responsibility: Display and manage general settings (data import/export)
 */

import { Download, Upload } from 'lucide-react';
import React from 'react';

import { secureStorage } from '../../core/storage/secure-storage';
import { PALETTE } from './constants';

interface GeneralPageProps {
  t: any; // i18n translations
  onReload: () => Promise<void>;
}

export const GeneralPage: React.FC<GeneralPageProps> = ({ t, onReload }) => {
  const exportConfiguration = async () => {
    try {
      const jsonData = await secureStorage.exportAllData();
      const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selectly-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(t.options?.general?.exportSuccess || 'Configuration exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(t.options?.general?.exportError || 'Failed to export configuration. Please try again.');
    }
  };

  const importConfiguration = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await secureStorage.importAllData(text);
        alert(
          t.options?.general?.importSuccess ||
            'Configuration imported successfully! The page will reload.'
        );
        // Reload config to reflect changes
        await onReload();
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert(
          `${t.options?.general?.importError || 'Failed to import configuration'}: ${(error as Error).message}`
        );
      }
    };
    input.click();
  };

  return (
    <div style={{ padding: '12px', background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <div className="sl-card" style={{ marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t.options?.general?.dataManagement || 'Data Management'}
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: PALETTE.surfaceMuted,
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {t.options?.general?.exportConfig || 'Export Configuration'}
                </div>
                <div style={{ fontSize: 12, color: PALETTE.textSecondary }}>
                  {t.options?.general?.exportConfigDesc ||
                    'Download all settings and data as JSON file'}
                </div>
              </div>
              <button
                className="sl-btn sl-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={exportConfiguration}
              >
                <Download size={16} />
                {t.options?.general?.export || 'Export'}
              </button>
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: PALETTE.surfaceMuted,
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {t.options?.general?.importConfig || 'Import Configuration'}
                </div>
                <div style={{ fontSize: 12, color: PALETTE.textSecondary }}>
                  {t.options?.general?.importConfigDesc ||
                    'Restore settings and data from JSON file'}
                </div>
              </div>
              <button
                className="sl-btn sl-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={importConfiguration}
              >
                <Upload size={16} />
                {t.options?.general?.import || 'Import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
