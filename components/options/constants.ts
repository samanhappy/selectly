/**
 * Shared constants for options page
 * Single responsibility: Define and export shared UI constants
 */

// Unified color palette
export const PALETTE = {
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f8f9fa',
  background: '#f8f9fa',
  surfaceMuted: '#f1f5f9',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#94a3b8',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primarySoft: '#f0f4f8',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  success: '#16a34a',
  successSoft: '#f0fdf4',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
} as const;

// Sidebar section keys
export type SidebarKey =
  | 'collected'
  | 'dictionary'
  | 'highlights'
  | 'functions'
  | 'general'
  | 'llm'
  | 'subscription';

/**
 * Helper to open external links safely inside extension context
 */
export const openExternal = (url: string) => {
  try {
    if (typeof chrome !== 'undefined' && (chrome as any).tabs?.create) {
      (chrome as any).tabs.create({ url });
      return;
    }
  } catch (e) {
    // fallback to window.open below
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};
