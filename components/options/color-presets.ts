/**
 * Shared color presets
 * Single responsibility: Provide curated color presets for UI pickers
 */

export type ColorPreset = {
  id: string;
  name: string;
  highlightColor: string;
  solidColor: string;
};

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'sun', name: 'Sunshine', highlightColor: 'rgba(255, 204, 0, 0.24)', solidColor: '#ffcc00' },
  { id: 'mint', name: 'Mint', highlightColor: 'rgba(16, 185, 129, 0.22)', solidColor: '#10b981' },
  { id: 'sky', name: 'Sky', highlightColor: 'rgba(56, 189, 248, 0.22)', solidColor: '#38bdf8' },
  {
    id: 'lavender',
    name: 'Lavender',
    highlightColor: 'rgba(139, 92, 246, 0.22)',
    solidColor: '#8b5cf6',
  },
  { id: 'rose', name: 'Rose', highlightColor: 'rgba(244, 63, 94, 0.2)', solidColor: '#f43f5e' },
  { id: 'peach', name: 'Peach', highlightColor: 'rgba(251, 146, 60, 0.22)', solidColor: '#fb923c' },
];
