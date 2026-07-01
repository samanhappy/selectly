import { Keyboard, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import type { FunctionConfig, FunctionShortcutConfig } from '../../../core/config/llm-config';
import {
  formatShortcut,
  normalizeShortcutEvent,
  validateFunctionShortcut,
  type ShortcutValidationResult,
} from '../../../core/content/function-shortcuts';
import { ShortcutKeys } from '../ShortcutKeys';

interface ShortcutRecorderProps {
  value?: FunctionShortcutConfig;
  allFunctions: Record<string, FunctionConfig>;
  currentFunctionKey?: string;
  i18n: any;
  onChange: (shortcut?: FunctionShortcutConfig) => void;
}

function getValidationMessage(labels: any, result: ShortcutValidationResult): string {
  if (result.error === 'duplicate') {
    return labels.shortcutDuplicate || 'This shortcut is already used by another function.';
  }
  if (result.error === 'reserved') {
    return labels.shortcutReserved || 'This shortcut is reserved by the browser.';
  }
  if (result.error === 'incomplete') {
    return labels.shortcutIncomplete || 'Use Ctrl/Command or Alt with another key.';
  }
  if (result.warning === 'web-conflict-risk') {
    return (
      labels.shortcutConflictRisk || 'This shortcut may conflict with common website shortcuts.'
    );
  }
  return '';
}

export const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({
  value,
  allFunctions,
  currentFunctionKey,
  i18n,
  onChange,
}) => {
  const labels = i18n.popup?.functions?.labels || {};
  const [isRecording, setIsRecording] = useState(false);
  const [validation, setValidation] = useState<ShortcutValidationResult | null>(null);

  const currentValidation = useMemo(
    () => validateFunctionShortcut(value?.chord, allFunctions, currentFunctionKey),
    [allFunctions, currentFunctionKey, value?.chord]
  );
  const displayedValidation = validation || currentValidation;
  const message = getValidationMessage(labels, displayedValidation);
  const hasError = !!displayedValidation.error;
  const displayValue = formatShortcut(value?.chord);

  const clearShortcut = () => {
    setValidation(null);
    onChange(undefined);
    setIsRecording(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      setIsRecording(false);
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      clearShortcut();
      return;
    }

    const chord = normalizeShortcutEvent(event.nativeEvent);
    if (!chord) return;

    const nextValidation = validateFunctionShortcut(chord, allFunctions, currentFunctionKey);
    setValidation(nextValidation);

    if (!nextValidation.valid || !nextValidation.chord) {
      return;
    }

    onChange({ chord: nextValidation.chord });
    setIsRecording(false);
  };

  return (
    <div className="sl-field">
      <label className="sl-label">{labels.shortcut || 'Shortcut'}</label>
      <div className="sl-shortcut-row">
        <button
          type="button"
          className={`sl-shortcut-recorder ${isRecording ? 'is-recording' : ''}`}
          onClick={() => {
            setValidation(null);
            setIsRecording(true);
          }}
          onKeyDown={handleKeyDown}
        >
          <Keyboard size={15} />
          {isRecording ? (
            <span>{labels.shortcutRecording || 'Press shortcut'}</span>
          ) : displayValue ? (
            <ShortcutKeys chord={value?.chord} />
          ) : (
            <span>{labels.shortcutPlaceholder || 'Record shortcut'}</span>
          )}
        </button>
        {displayValue && (
          <button
            type="button"
            className="sl-btn sl-btn-ghost sl-shortcut-clear"
            onClick={clearShortcut}
            title={labels.shortcutClear || 'Clear shortcut'}
            aria-label={labels.shortcutClear || 'Clear shortcut'}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {message ? (
        <div className={hasError ? 'sl-helper sl-helper-error' : 'sl-helper sl-helper-warning'}>
          {message}
        </div>
      ) : (
        <div className="sl-helper">
          {labels.shortcutHelp ||
            'Run this function from the current page when selected text is available.'}
        </div>
      )}
    </div>
  );
};
