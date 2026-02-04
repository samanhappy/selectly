import { Bookmark } from 'lucide-react';
import { useState } from 'react';

interface GlobalActionBarProps {
  onSaveProgress: () => Promise<void>;
  labels: {
    saveProgress: string;
    progressSaved: string;
  };
}

export const GlobalActionBar = ({ onSaveProgress, labels }: GlobalActionBarProps) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    if (status === 'saving') return;
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
      <button
        className={`selectly-global-action-btn ${status === 'saved' ? 'is-saved' : ''}`}
        onClick={handleSave}
        title={status === 'saved' ? labels.progressSaved : labels.saveProgress}
        aria-label={labels.saveProgress}
      >
        <Bookmark size={16} />
      </button>
    </div>
  );
};
