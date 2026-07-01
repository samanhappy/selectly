import React from 'react';

import { getShortcutDisplayParts } from '../../core/content/function-shortcuts';

interface ShortcutKeysProps {
  chord?: string;
}

export const ShortcutKeys: React.FC<ShortcutKeysProps> = ({ chord }) => {
  const parts = getShortcutDisplayParts(chord);
  if (!parts.length) return null;

  return (
    <span className="sl-shortcut-keys">
      {parts.map((part, index) => (
        <span key={`${part.value}-${index}`} className={`sl-shortcut-key-part is-${part.kind}`}>
          {part.value}
        </span>
      ))}
    </span>
  );
};
