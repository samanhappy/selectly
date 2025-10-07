import { Check, Copy, Download, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { i18n } from '../../core/i18n';
import { imageGeneratorService } from '../../core/services/image-generator-service';

interface SharePreviewProps {
  imageBlob: Blob;
  selectedText: string;
  onClose: () => void;
  x?: number;
  y?: number;
}

export const SharePreview: React.FC<SharePreviewProps> = ({
  imageBlob,
  selectedText,
  onClose,
  x = 100,
  y = 100,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [i18nConfig, setI18nConfig] = useState(i18n.getConfig());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const initI18n = async () => {
      await i18n.initialize();
      setI18nConfig(i18n.getConfig());
    };
    initI18n();
  }, []);

  useEffect(() => {
    // Create object URL for the blob
    const url = URL.createObjectURL(imageBlob);
    setImageUrl(url);

    // Cleanup when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageBlob]);

  useEffect(() => {
    if (copyStatus !== 'idle') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  // Focus trap, selection clear, and scroll lock when modal opens
  useEffect(() => {
    // Save previously focused element
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) || null;
    // Clear any existing text selection on the page
    try {
      const sel = window.getSelection();
      sel?.removeAllRanges();
    } catch {}
    // Blur active element to avoid page text focus
    try {
      (document.activeElement as HTMLElement | null)?.blur?.();
    } catch {}
    // Lock page scroll
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    // Focus the modal container
    const focusModalSoon = () => {
      if (containerRef.current) containerRef.current.focus();
    };
    const t = setTimeout(focusModalSoon, 0);

    // Basic focus trap inside the modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = containerRef.current;
      if (!root) return;
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
      ).filter((el) => el.offsetParent !== null || el === root); // visible
      if (nodes.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const goingBackward = e.shiftKey;
      if (!current) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (!root.contains(current)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (!goingBackward && current === last) {
        e.preventDefault();
        first.focus();
      } else if (goingBackward && current === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', handleKeyDown, true);
      // Restore scroll
      document.documentElement.style.overflow = prevOverflow;
      // Restore previous focus
      try {
        previouslyFocusedRef.current?.focus?.({ preventScroll: true } as any);
      } catch {}
    };
    // We only want this to run on mount/unmount of the modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensurePngBlob = async (blob: Blob): Promise<Blob> => {
    if (blob.type === 'image/png') return blob;
    // Convert to PNG via canvas
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const b64 = btoa(String.fromCharCode(...uint8));
    const dataUrl = `data:${blob.type};base64,${b64}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const pngBlob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
    );
    return pngBlob;
  };

  const handleCopyImage = async () => {
    try {
      // Always clear page selection before any copy attempts
      try {
        const sel = window.getSelection();
        sel?.removeAllRanges();
      } catch {}

      // Prefer Clipboard API with PNG enforced
      const pngBlob = await ensurePngBlob(imageBlob);
      if (
        navigator.clipboard &&
        'write' in navigator.clipboard &&
        typeof ClipboardItem !== 'undefined'
      ) {
        const item = new ClipboardItem({ [pngBlob.type]: pngBlob });
        await navigator.clipboard.write([item]);
        setCopyStatus('success');
        return;
      }

      // Fallback: contenteditable + execCommand on an <img>
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(pngBlob);
      });

      const tempHost = document.createElement('div');
      tempHost.contentEditable = 'true';
      tempHost.style.position = 'fixed';
      tempHost.style.left = '-99999px';
      tempHost.style.top = '0';
      tempHost.style.width = '1px';
      tempHost.style.height = '1px';
      tempHost.style.opacity = '0';
      tempHost.style.userSelect = 'text';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = 'shared image';
      tempHost.appendChild(img);
      document.body.appendChild(tempHost);
      // Select the image node
      const range = document.createRange();
      range.selectNode(img);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      // Try to copy
      const ok = document.execCommand('copy');
      // Cleanup and restore selection state
      sel?.removeAllRanges();
      tempHost.remove();
      if (ok) {
        setCopyStatus('success');
        return;
      }
      throw new Error('execCommand copy failed');
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      setCopyStatus('error');
    }
  };

  const handleDownload = async () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `selectly-share-${timestamp}.png`;
      await imageGeneratorService.downloadImage(imageBlob, filename);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation: 'sl-fadeIn 0.2s ease-out',
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          animation: 'sl-slideInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={containerRef}
        aria-label={i18nConfig?.defaultFunctions?.share?.title || 'Share Image Preview'}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {i18nConfig.defaultFunctions?.share?.title || 'Share Image Preview'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Image Preview */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Share preview"
              style={{
                maxWidth: '700px',
                maxHeight: '500px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
              }}
            />
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <button
              onClick={handleCopyImage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor:
                  copyStatus === 'success'
                    ? '#10b981'
                    : copyStatus === 'error'
                      ? '#ef4444'
                      : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minWidth: '120px',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (copyStatus === 'idle') {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                if (copyStatus === 'idle') {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
              disabled={copyStatus !== 'idle'}
            >
              {copyStatus === 'success' ? (
                <>
                  <Check size={16} />
                  {i18nConfig.content?.complete || 'Copied!'}
                </>
              ) : (
                <>
                  <Copy size={16} />
                  {i18nConfig.common?.copy || 'Copy'}
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minWidth: '120px',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
