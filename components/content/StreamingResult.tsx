import { BookmarkPlus, ClipboardPaste, Copy, GripVertical, Info, Pin, Send, X } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { useEffect, useRef, useState } from 'react';

import { i18n } from '../../core/i18n';
import { getActionIcon } from '../../utils/icon-utils';

import 'prismjs/themes/prism.css';

interface StreamingResultProps {
  x: number;
  y: number;
  minWidth?: number;
  maxWidth?: number;
  title: string;
  actionKey?: string;
  onClose: () => void;
  canPaste?: boolean;
  onPaste?: (content: string) => void;
  isDialogue?: boolean;
  selectedText?: string;
  selectedSentence?: string;
  onSendMessage?: (message: string) => void;
  autoFocusInput?: boolean;
  /** Optional callback when pin state changes */
  onPinChange?: (pinned: boolean) => void;
  /** Optional model name to display in footer */
  modelName?: string;
  /** Optional cost in USD to display in footer */
  costUsd?: number;
}

/**
 * Markdown renderer component using markdown-to-jsx
 *
 * markdown-to-jsx is a mature, well-maintained library that:
 * - Uses a compiler-style approach for better performance
 * - Has zero dependencies (no complex dep tree issues)
 * - Supports GitHub Flavored Markdown
 * - Allows easy customization with overrides
 * - Works seamlessly with React and bundlers like Plasmo
 *
 * Benefits:
 * - Easy to maintain (simple API, no breaking changes)
 * - Easy to extend (override any HTML element)
 * - Lightweight bundle size
 * - Battle-tested in production (used by major companies)
 */
const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <Markdown
      options={{
        wrapper: 'div',
        forceWrapper: true,
        overrides: {
          // Remove default margins from paragraphs to avoid layout shifts
          p: {
            component: ({ children, ...props }: any) => (
              <p
                style={{
                  margin: '0',
                }}
                {...props}
              >
                {children}
              </p>
            ),
          },
          // Custom code block styling with Prism classes
          pre: {
            component: ({ children, ...props }: any) => (
              <pre
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  margin: '12px 0',
                }}
                {...props}
              >
                {children}
              </pre>
            ),
          },
          code: {
            component: ({ className, children, ...props }: any) => {
              // Inline code vs code block
              const isInline = !className?.includes('lang-');
              if (isInline) {
                return (
                  <code
                    style={{
                      background: 'rgba(0, 0, 0, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.9em',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          },
          // Style links
          a: {
            component: ({ children, ...props }: any) => (
              <a
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
          },
          // Style blockquotes
          blockquote: {
            component: ({ children, ...props }: any) => (
              <blockquote
                style={{
                  borderLeft: '4px solid #3b82f6',
                  paddingLeft: '12px',
                  margin: '12px 0',
                  color: '#64748b',
                  fontStyle: 'italic',
                }}
                {...props}
              >
                {children}
              </blockquote>
            ),
          },
          // Style tables
          table: {
            component: ({ children, ...props }: any) => (
              <table
                style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  margin: '12px 0',
                  fontSize: '0.9em',
                }}
                {...props}
              >
                {children}
              </table>
            ),
          },
          th: {
            component: ({ children, ...props }: any) => (
              <th
                style={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  fontWeight: '600',
                  textAlign: 'left',
                }}
                {...props}
              >
                {children}
              </th>
            ),
          },
          td: {
            component: ({ children, ...props }: any) => (
              <td
                style={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  padding: '8px',
                }}
                {...props}
              >
                {children}
              </td>
            ),
          },
        },
      }}
    >
      {content}
    </Markdown>
  );
};

/**
 * Streaming result display component
 * Shows LLM response with real-time streaming and copy/paste functionality
 */
export const StreamingResult = ({
  x,
  y,
  minWidth,
  maxWidth,
  title,
  actionKey,
  onClose,
  canPaste = false,
  onPaste,
  isDialogue = false,
  selectedText = '',
  selectedSentence,
  onSendMessage,
  autoFocusInput = true,
  onPinChange,
  modelName: modelNameProp,
  costUsd: costUsdProp,
}: StreamingResultProps) => {
  const [content, setContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [i18nConfig, setI18nConfig] = useState(i18n.getConfig());
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [pinned, setPinned] = useState(false);
  const [dicStatus, setDicStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pasteStatus, setPasteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // Footer meta state
  const [modelName, setModelName] = useState<string | undefined>(modelNameProp);
  const [costUsd, setCostUsd] = useState<number | undefined>(costUsdProp);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // Dragging state
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize conversation with selected text if in dialogue mode
  useEffect(() => {
    if (isDialogue && selectedText) {
      setConversationHistory([]);
      setContent('');
      setIsComplete(true);
    }
  }, [isDialogue, selectedText]);

  // Expose and notify pin state externally
  useEffect(() => {
    (window as any).isStreamingResultPinned = () => pinned;
    (window as any).selectlyStreamingPinned = pinned;
    return () => {
      delete (window as any).isStreamingResultPinned;
      delete (window as any).selectlyStreamingPinned;
    };
  }, [pinned]);

  useEffect(() => {
    if (onPinChange) {
      onPinChange(pinned);
    }
  }, [pinned, onPinChange]);

  // Sync footer meta from props changes
  useEffect(() => {
    setModelName(modelNameProp);
  }, [modelNameProp]);
  useEffect(() => {
    setCostUsd(costUsdProp);
  }, [costUsdProp]);

  // Manage elapsed timer
  useEffect(() => {
    if (startedAt && !isComplete) {
      // Update immediately and then every 1s
      setElapsedMs(Date.now() - startedAt);
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [startedAt, isComplete]);

  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, conversationHistory]);

  // Initialize internationalization
  useEffect(() => {
    const initI18n = async () => {
      await i18n.initialize();
      setI18nConfig(i18n.getConfig());
    };
    initI18n();
  }, []);

  // Keep focus on the input in dialogue mode to avoid underlying page capturing keystrokes
  useEffect(() => {
    if (isDialogue && inputRef.current && autoFocusInput) {
      // Defer to end of paint to ensure element exists after re-renders
      requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      });
    }
  }, [isDialogue, isComplete, autoFocusInput]);

  // Dragging event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    const target = e.target as HTMLElement;
    // Treat any obvious interactive element as non-draggable
    const isInteractive = target.closest('input, textarea, button, .glass-button, .send-btn');
    // Exclude only actual message/content blocks (not the padding area) in dialogue mode so user can select text
    const isMessageBubble = isDialogue && target.closest('.sl-message-bubble');
    if (isInteractive || isMessageBubble) return;
    // Start dragging for any other area (expanded draggable region)
    setIsDragging(true);
    setHasBeenDragged(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 420; // component width
      const maxY = window.innerHeight - 100; // minimum space from bottom

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Update position when props change
  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  // Expose methods for external calls
  useEffect(() => {
    (window as any).updateStreamingResult = (
      chunk: string,
      model: string,
      complete: boolean = false,
      error: boolean = false,
      isNewMessage: boolean = false
    ) => {
      console.log('[StreamingResult] updateStreamingResult', {
        chunk,
        model,
        complete,
        error,
        isNewMessage,
      });
      // Initialize call timing on first non-error chunk
      setStartedAt((prev) => (prev == null && !error ? Date.now() : prev));
      if (!error && !complete && elapsedMs === 0 && startedAt == null) {
        setElapsedMs(0);
      }
      if (model && model !== null && model !== 'default') {
        let finalModel: string;
        if (typeof model === 'object' && model !== null) {
          finalModel = (model as any).modelId || '';
        } else {
          finalModel = model as string;
        }
        finalModel = finalModel.replace(/:free$/, '');
        setModelName(finalModel.split('/').pop() || finalModel);
      }
      if (error) {
        setContent(chunk);
        setIsError(true);
        setIsComplete(true);
      } else if (isDialogue && isNewMessage) {
        // For dialogue mode, add to conversation history
        setConversationHistory((prev) => [...prev, { role: 'assistant', content: chunk }]);
        setContent('');
        setIsComplete(true);
      } else if (isDialogue && !complete) {
        // For dialogue streaming, update current content
        setContent((prev) => prev + chunk);
        setIsComplete(false);
        setIsError(false);
      } else if (isDialogue && complete) {
        // Complete the current streaming message and add to history
        setConversationHistory((prev) => {
          const newHistory = [...prev];
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'assistant') {
            // Update the last assistant message
            newHistory[newHistory.length - 1].content = content + chunk;
          } else {
            // Add new assistant message
            newHistory.push({ role: 'assistant', content: content + chunk });
          }
          return newHistory;
        });
        setContent('');
        setIsComplete(true);
        setIsError(false);
      } else {
        // Regular mode
        setContent((prev) => prev + chunk);
        setIsComplete(complete);
        setIsError(false);
      }

      // Stop the timer on completion or error
      if (complete || error) {
        if (startedAt) {
          setElapsedMs(Date.now() - startedAt);
        }
      }
    };

    (window as any).appendToConversation = (role: 'user' | 'assistant', content: string) => {
      setConversationHistory((prev) => [...prev, { role, content }]);
    };

    // Allow external code to update footer meta
    (window as any).updateStreamingMeta = (meta: {
      modelName?: string;
      costUsd?: number;
      startAtMs?: number;
    }) => {
      if (typeof meta.modelName !== 'undefined') setModelName(meta.modelName);
      if (typeof meta.costUsd !== 'undefined') setCostUsd(meta.costUsd);
      if (typeof meta.startAtMs === 'number') {
        setStartedAt(meta.startAtMs);
        setElapsedMs(Date.now() - meta.startAtMs);
      }
    };

    return () => {
      delete (window as any).updateStreamingResult;
      delete (window as any).appendToConversation;
      delete (window as any).updateStreamingMeta;
    };
  }, [isDialogue, content, startedAt, elapsedMs]);

  const handleCopy = () => {
    const textToCopy =
      isDialogue && conversationHistory.length > 0
        ? conversationHistory[conversationHistory.length - 1].content
        : content;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyStatus('success');
      // setTimeout(() => setCopyStatus('idle'), 3000)
      const btn = document.querySelector('.copy-btn') as HTMLButtonElement;
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = i18nConfig.content.complete;
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1000);
      }
    });
  };

  const handlePaste = () => {
    if (onPaste) {
      const textToPaste =
        isDialogue && conversationHistory.length > 0
          ? conversationHistory[conversationHistory.length - 1].content
          : content;
      onPaste(textToPaste);
      setPasteStatus('success');
      // setTimeout(() => setPasteStatus('idle'), 3000)
      const btn = document.querySelector('.paste-btn') as HTMLButtonElement;
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = i18nConfig.content.complete || 'Done';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1000);
      }
    }
  };

  const handleAddToDictionary = async () => {
    try {
      const source = selectedText || '';
      const translation = content.trim();
      if (!source || !translation) return;
      const sentence = (selectedSentence || '').trim();
      const url = window.location.href;
      const title = document.title || url;
      const hostname = window.location.hostname;
      const res = await chrome.runtime.sendMessage({
        action: 'addDictionaryEntry',
        payload: { source, translation, sentence, url, title, hostname, createdAt: Date.now() },
      });
      if (!res?.success) {
        throw new Error(res?.error || 'Failed to add to dictionary');
      }
      setDicStatus('success');
      // setTimeout(() => setDicStatus('idle'), 3000)
    } catch (e) {
      console.error('Add to dictionary failed', e);
      setDicStatus('error');
      setTimeout(() => setDicStatus('idle'), 3000);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !onSendMessage) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setContent('');
    setIsComplete(false);
    setIsError(false);
    setElapsedMs(0);
    setStartedAt(Date.now());

    onSendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      ref={containerRef}
      className="selectly-streaming-result"
      onMouseDown={(e) => {
        handleMouseDown(e);
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10002,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        minWidth: minWidth > 300 ? `${minWidth}px` : '300px',
        maxWidth: maxWidth > 420 ? `${maxWidth}px` : '420px',
        maxHeight: isDialogue ? '500px' : '420px',
        minHeight: isDialogue ? 'auto' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.8),
          0 2px 8px rgba(0, 0, 0, 0.1)
        `,
        animation:
          isDragging || hasBeenDragged
            ? 'none'
            : 'sl-selectlySlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: isDragging ? 'none' : 'auto',
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Header */}
      <div
        className="header-draggable"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
          borderRadius: '16px 16px 0 0',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Drag handle */}
        {/* <div
          className="drag-handle"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            color: '#94a3b8',
            opacity: 0.4,
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.opacity = '0.4'
          }}
        >
          <GripVertical size={14} />
        </div> */}
        {/* Pin toggle moved to top-left */}
        {
          <button
            onClick={() => setPinned((p) => !p)}
            className="pin-btn glass-button"
            title={pinned ? i18nConfig.content?.unpin || 'Unpin' : i18nConfig.content?.pin || 'Pin'}
            style={{
              background: 'none',
              backdropFilter: 'blur(8px)',
              border: 'none',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              color: pinned ? '#22c55e' : '#64748b',
              marginRight: '8px',
            }}
          >
            <Pin size={14} style={{ transform: pinned ? 'scale(1.05)' : 'none' }} />
          </button>
        }

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '12px',
            color: 'rgb(149 155 164)',
            fontSize: '18px',
          }}
        >
          {isComplete ? (
            actionKey ? (
              (() => {
                const IconComponent = getActionIcon(actionKey);
                // Safety check for IconComponent
                if (!IconComponent) {
                  console.warn(
                    `[StreamingResult] IconComponent is undefined for actionKey: ${actionKey}`
                  );
                  return <Info size={18} />;
                }
                return <IconComponent size={18} />;
              })()
            ) : (
              <Info size={18} />
            )
          ) : (
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(100, 116, 139, 0.3)',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'sl-spin 1s linear infinite',
              }}
            />
          )}
        </div>
        <span
          style={{
            fontWeight: '600',
            fontSize: '15px',
            color: 'rgb(149 155 164)',
            flex: 1,
            letterSpacing: '0.02em',
            userSelect: 'none',
          }}
        >
          {/* {title} */}
        </span>

        {/* Action buttons moved to footer */}

        <button
          onClick={onClose}
          className="glass-button"
          style={{
            background: 'none',
            backdropFilter: 'blur(8px)',
            border: 'none',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#64748b',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        style={{
          padding: isDialogue ? '12px' : '12px',
          fontSize: '14px',
          color: '#374151',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowY: 'auto',
          maxHeight: isDialogue ? '280px' : '320px',
          background: 'rgba(248, 250, 252, 0.5)',
          flex: isDialogue ? 1 : 'none',
        }}
      >
        {isDialogue ? (
          // Dialogue mode: show conversation history
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Show selected text as context */}
            {selectedText && (
              <div
                className="sl-message-bubble sl-context-block"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.05))',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  cursor: 'text',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    color: '#374151',
                    lineHeight: '1.4',
                    fontStyle: 'italic',
                  }}
                >
                  <MarkdownRenderer content={selectedText} />
                </div>
              </div>
            )}

            {/* Show conversation history */}
            {conversationHistory.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  gap: '8px',
                }}
              >
                <div
                  className={`sl-message-bubble sl-role-${message.role}`}
                  style={{
                    background:
                      message.role === 'user' ? 'rgb(240 240 240)' : 'rgba(255, 255, 255, 0.9)',
                    color: '#374151',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    maxWidth: '85%',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                    cursor: 'text',
                  }}
                >
                  <MarkdownRenderer content={message.content} />
                </div>
              </div>
            ))}

            {/* Show current streaming content */}
            {content && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  className="sl-message-bubble sl-streaming-bubble"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#374151',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    maxWidth: '85%',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                    cursor: 'text',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <MarkdownRenderer content={content} />
                    </div>
                    {!isComplete && (
                      <span
                        style={{
                          opacity: 0.7,
                          animation: 'blink 1s infinite',
                          color: '#3b82f6',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}
                      >
                        &nbsp;
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Regular mode: show content
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MarkdownRenderer content={content} />
            </div>
            {!isComplete && (
              <span
                style={{
                  opacity: 0.7,
                  animation: 'blink 1s infinite',
                  color: '#3b82f6',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                &nbsp;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Input area for dialogue mode */}
      {isDialogue && (
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
            borderRadius: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={i18nConfig.content?.dialoguePlaceholder || 'Type your message...'}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#374151',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                opacity: isComplete ? 1 : 0.85,
                pointerEvents: 'auto',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !isComplete}
              className="send-btn glass-button"
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && isComplete ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                color: inputValue.trim() && isComplete ? '#3b82f6' : '#94a3b8',
                opacity: inputValue.trim() && isComplete ? 1 : 0.6,
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Footer action bar with status (always at the bottom) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '4px 12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: isDialogue ? '0 0 16px 16px' : '0 0 16px 16px',
        }}
      >
        {/* Status text */}
        {modelName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: 'rgb(149 155 164)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            <span>{modelName || ''}</span>
            {/* ({startedAt ? `${(elapsedMs / 1000).toFixed(isComplete ? 1 : 0)}s` : ''}) */}
            {/* <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ opacity: 0.5 }}>•</span> */}
            {/* <span>
            {'Cost'}: {typeof costUsd === 'number' ? `$${costUsd.toFixed(costUsd < 0.01 ? 4 : 3)}` : '--'}
          </span> */}
          </div>
        )}

        {/* Footer actions */}
        {!isError && isComplete && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {actionKey === 'translate' && (
              <button
                onClick={handleAddToDictionary}
                className="dict-btn glass-button"
                title={i18nConfig.content.addToDictionary}
                style={{
                  background: 'none',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: dicStatus === 'success' ? '#22c55e' : '#64748b',
                }}
              >
                <BookmarkPlus size={14} />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="copy-btn glass-button"
              style={{
                background: 'none',
                backdropFilter: 'blur(8px)',
                border: 'none',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0s cubic-bezier(0.4, 0, 0.2, 1)',
                color: copyStatus === 'success' ? '#22c55e' : '#64748b',
              }}
            >
              <Copy size={14} />
            </button>
            {canPaste && onPaste && (
              <button
                onClick={handlePaste}
                className="paste-btn glass-button"
                style={{
                  background: 'none',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: pasteStatus === 'success' ? '#22c55e' : '#64748b',
                }}
              >
                <ClipboardPaste size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
