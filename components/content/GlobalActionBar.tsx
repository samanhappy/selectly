import { Bookmark, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface GlobalActionBarProps {
  onOpenTabAssistant?: () => Promise<void>;
  onSaveProgress?: () => Promise<void>;
  showTabAssistant?: boolean;
  showSaveProgress?: boolean;
  labels: {
    askPage: string;
    saveProgress: string;
    progressSaved: string;
  };
}

export const GlobalActionBar = ({
  onOpenTabAssistant,
  onSaveProgress,
  showTabAssistant = true,
  showSaveProgress = false,
  labels,
}: GlobalActionBarProps) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    if (status === 'saving' || !onSaveProgress) return;
    setStatus('saving');
    try {
      await onSaveProgress();
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="selectly-global-actions">
      {showTabAssistant && (
        <button
          className="selectly-global-action-btn"
          onClick={() => onOpenTabAssistant?.()}
          title={labels.askPage}
          aria-label={labels.askPage}
        >
          <MessageCircle size={16} />
        </button>
      )}
      {showSaveProgress && (
        <button
          className={`selectly-global-action-btn ${status === 'saved' ? 'is-saved' : ''}`}
          onClick={handleSave}
          title={status === 'saved' ? labels.progressSaved : labels.saveProgress}
          aria-label={labels.saveProgress}
        >
          <Bookmark size={16} />
        </button>
      )}
    </div>
  );
};
