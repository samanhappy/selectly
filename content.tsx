import type { PlasmoCSConfig } from 'plasmo';

import ErrorBoundary from './components/content/ErrorBoundary';
import { Selectly } from './core/content/Selectly';

// NOTE: Plasmo's content script UI system will attempt to render the module's default export
// inside an overlay container when the file has a .tsx extension. Previously we did not provide
// a default export, causing React to receive `undefined` and emit an "Element type is invalid" warning.
// We add a no-op component (returns null) as the default export so the overlay mounts cleanly while
// our imperative Selectly class handles all DOM + shadow root rendering logic.
const SelectlyContent: React.FC = () => <ErrorBoundary>{null}</ErrorBoundary>;
export default SelectlyContent;

// IMPORTANT: Do NOT import global popup styles (Tailwind + resets) here.
// Importing style.css would inject Tailwind Preflight into every page and
// pollute host site styles. Popup keeps its own import; content script uses
// shadow-scoped styles defined in core/content/content-styles.ts.

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  all_frames: true,
};

// Initialize Selectly
let selectlyInstance: Selectly | null = null;

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      selectlyInstance = new Selectly();
      (window as any).selectlyInstance = selectlyInstance;
    });
  } else {
    selectlyInstance = new Selectly();
    (window as any).selectlyInstance = selectlyInstance;
  }
}
