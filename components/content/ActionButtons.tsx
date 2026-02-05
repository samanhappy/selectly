import { useEffect, useRef, useState } from 'react';

import { getFunctionDisplayFields, type UserConfig } from '../../core/config/llm-config';
import { i18n } from '../../core/i18n';
import { actionService } from '../../core/services/action-service';
import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';
import { getActionIcon, isValidIconKey } from '../../utils/icon-utils';
import { isValidUrl } from '../../utils/url-utils';

interface ActionButtonsProps {
  selectedText: string;
  x: number;
  y: number;
  onClose: () => void;
  onSelectionUpdate?: (newSelectedText: string) => void;
  userConfig: UserConfig;
}

/**
 * Action buttons component
 * Displays floating action buttons for text processing operations
 */
export const ActionButtons = ({
  selectedText,
  x,
  y,
  onClose,
  onSelectionUpdate,
  userConfig,
}: ActionButtonsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [i18nConfig, setI18nConfig] = useState(i18n.getConfig());
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [dailyUsage, setDailyUsage] = useState<{
    usedCount: number;
    remainingCount: number;
    dailyLimit: number;
  }>({
    usedCount: 0,
    remainingCount: 10,
    dailyLimit: 10,
  });
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [collectStatus, setCollectStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSelectionHighlighted, setIsSelectionHighlighted] = useState(false);

  const subscriptionService = SubscriptionServiceV2.getInstance();

  // Track click timers to distinguish single vs double clicks
  const clickTimersRef = useRef<Map<string, number>>(new Map());

  // Initialize internationalization
  useEffect(() => {
    const initI18n = async () => {
      await i18n.initialize();
      setI18nConfig(i18n.getConfig());
    };
    initI18n();
    checkSubscriptionStatus();

    const selectlyInstance = (window as any).selectlyInstance;
    if (selectlyInstance) {
      selectlyInstance.notifyCopySuccess = () => {
        setCopyStatus('success');
      };
      selectlyInstance.notifyCopyError = () => {
        setCopyStatus('error');
      };
      selectlyInstance.notifyCollectSuccess = () => {
        setCollectStatus('success');
      };
      selectlyInstance.notifyCollectError = () => {
        setCollectStatus('error');
      };
      selectlyInstance.notifyShareSuccess = () => {
        setShareStatus('success');
      };
      selectlyInstance.notifyShareError = () => {
        setShareStatus('error');
      };
    }
    // cleanup to avoid stale handlers
    return () => {
      const inst = (window as any).selectlyInstance;
      if (inst) {
        if (inst.notifyCopySuccess) inst.notifyCopySuccess = undefined;
        if (inst.notifyCopyError) inst.notifyCopyError = undefined;
        if (inst.notifyCollectSuccess) inst.notifyCollectSuccess = undefined;
        if (inst.notifyCollectError) inst.notifyCollectError = undefined;
        if (inst.notifyShareSuccess) inst.notifyShareSuccess = undefined;
        if (inst.notifyShareError) inst.notifyShareError = undefined;
      }
      // Clear any pending click timers
      clickTimersRef.current.forEach((timer) => clearTimeout(timer));
      clickTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.selectly-buttons')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const newSelectedText = selection?.toString().trim() || '';
      console.log('Selection changed:', { newSelectedText, previous: selectedText });
      if (newSelectedText === '') {
        onClose();
      } else if (newSelectedText !== selectedText) {
        if (onSelectionUpdate) {
          onSelectionUpdate(newSelectedText);
        }
      }

      setIsSelectionHighlighted(checkSelectionHasHighlight(selection));
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [selectedText, onClose, onSelectionUpdate]);

  useEffect(() => {
    const selection = window.getSelection();
    setIsSelectionHighlighted(checkSelectionHasHighlight(selection));
  }, [selectedText]);

  const checkSubscriptionStatus = async () => {
    try {
      const isActive = await subscriptionService.isSubscriptionActive();
      setIsSubscribed(isActive);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      setIsSubscribed(false);
    }
  };

  const handleSingleClick = (buttonKey: string, event: React.MouseEvent) => {
    // Clear any existing timer for this button
    const existingTimer = clickTimersRef.current.get(buttonKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set a delay to check if this is a double-click
    const timer = window.setTimeout(() => {
      clickTimersRef.current.delete(buttonKey);
      handleAction(buttonKey, event, false);
    }, 250); // 250ms delay to detect double-click

    clickTimersRef.current.set(buttonKey, timer);
  };

  const handleDoubleClick = (buttonKey: string, event: React.MouseEvent) => {
    // Clear the single-click timer to prevent it from firing
    const existingTimer = clickTimersRef.current.get(buttonKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      clickTimersRef.current.delete(buttonKey);
    }

    // Execute the action with keepButtonsOpen = true
    handleAction(buttonKey, event, true);
  };

  const handleAction = async (
    actionKey: string,
    event: React.MouseEvent,
    keepButtonsOpen: boolean
  ) => {
    console.log(`Action triggered: ${actionKey}, keepButtonsOpen: ${keepButtonsOpen}`);
    // Prevent event bubbling to avoid triggering text selection handling
    event.preventDefault();
    event.stopPropagation();

    const config = userConfig.functions[actionKey];
    if (!config || !config.enabled) {
      return;
    }

    // Use current actual selected text instead of potentially stale prop
    const currentSelection = window.getSelection();
    const currentSelectedText = currentSelection?.toString().trim() || selectedText;

    // Update cached selection state before executing action so that
    // restoreFocusSelection() will restore the current selection, not the original one
    const selectlyInstance = (window as any).selectlyInstance;
    if (selectlyInstance && typeof selectlyInstance.updateCachedSelection === 'function') {
      selectlyInstance.updateCachedSelection();
    }

    try {
      await actionService.executeAction(actionKey, currentSelectedText, config);

      // Update daily usage count after successful action
      // if (config.isPremium && !isSubscribed) {
      //   await updateDailyUsage()
      // }
    } catch (error) {
      console.error(`Error performing ${actionKey}:`, error);
    }

    // Only close buttons if autoCloseButtons is enabled (default to true for backward compatibility)
    if (!keepButtonsOpen && config.autoCloseButtons !== false) {
      onClose();
    }
  };

  if (!isVisible) return null;

  // Determine ordered keys
  const orderedKeys =
    userConfig.functionOrder && userConfig.functionOrder.length
      ? userConfig.functionOrder.filter((k) => k in userConfig.functions)
      : Object.keys(userConfig.functions);

  const visibleButtons = [] as { key: string; icon: JSX.Element; title: string }[];
  const collapsedButtons = [] as { key: string; icon: JSX.Element; title: string }[];
  orderedKeys.forEach((key) => {
    const config = userConfig.functions[key];
    if (!config?.enabled) return;

    // Handle premium features logic
    // if (config.isPremium && !isSubscribed) {
    //   // For non-subscribed users, check if they have remaining daily usage
    //   if (dailyUsage.remainingCount <= 0) return
    // }

    if (key === 'open' && !isValidUrl(selectedText)) return;
    // Domain filtering: if displayDomains provided, ensure current hostname matches
    if (config.displayDomains && config.displayDomains.length) {
      const host = window.location.hostname.toLowerCase();
      const matches = config.displayDomains.some((d) => {
        const domain = d.toLowerCase();
        if (!domain) return false;
        if (domain.startsWith('.')) {
          // Leading dot => subdomain wildcard only
          return host.endsWith(domain) && host !== domain.slice(1);
        }
        // Exact or suffix match (allow subdomains)
        return host === domain || host.endsWith('.' + domain);
      });
      if (!matches) return;
    }

    let IconComponent =
      config.icon && isValidIconKey(config.icon) ? getActionIcon(config.icon) : getActionIcon(key);

    if (key === 'highlight' && isSelectionHighlighted) {
      IconComponent = getActionIcon('eraser');
    }

    if (!IconComponent) {
      console.warn(`[ActionButtons] IconComponent is undefined for key: ${key}`);
      return;
    }

    // Modify title for premium functions when user is not subscribed
    const { title: localizedTitle } = getFunctionDisplayFields(key, config, i18nConfig);
    let buttonTitle = localizedTitle;
    // if (config.isPremium && !isSubscribed) {
    //   buttonTitle = `${config.title} (${dailyUsage.remainingCount}/${dailyUsage.dailyLimit})`
    // }

    const btn = { key, icon: <IconComponent size={18} />, title: buttonTitle };
    if (config.collapsed) {
      collapsedButtons.push(btn);
    } else {
      visibleButtons.push(btn);
    }
  });
  const [showCollapsed, setShowCollapsed] = useState(false);
  // Small delay when leaving the collapsed area to prevent flicker when moving cursor
  const hideTimeoutRef = useRef<number | null>(null);

  const handleCollapsedEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowCollapsed(true);
  };

  const handleCollapsedLeave = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowCollapsed(false);
      hideTimeoutRef.current = null;
    }, 150);
  };

  return (
    <div
      className="selectly-buttons"
      onMouseDown={(e) => {
        // Prevent focus from moving away from editable element
        e.preventDefault();
        e.stopPropagation();
        // Note: We don't call restoreFocusSelection here to avoid interfering
        // with current text selection. The focus will be properly restored after actions complete.
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 10000,
        display: 'flex',
        gap: '3px',
        animation: 'sl-selectlySlideIn 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {visibleButtons.map((button, index) => {
        let className = calcClass(
          button,
          copyStatus,
          collectStatus,
          shareStatus,
          isSelectionHighlighted
        );
        return (
          <button
            key={button.key}
            onMouseDown={(e) => {
              // Avoid stealing focus when clicking buttons
              e.preventDefault();
              e.stopPropagation();
              // Note: We don't call restoreFocusSelection here to avoid interfering
              // with current text selection. It will be called after the action completes.
            }}
            onClick={(event) => handleSingleClick(button.key, event)}
            onDoubleClick={(event) => handleDoubleClick(button.key, event)}
            className={className}
            title={button.title}
            style={
              {
                animation: 'sl-selectlySlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '--delay': `${index * 0.03}s`,
              } as React.CSSProperties
            }
          >
            {button.icon}
          </button>
        );
      })}
      {collapsedButtons.length > 0 && (
        <div
          style={{ position: 'relative' }}
          onMouseEnter={handleCollapsedEnter}
          onMouseLeave={handleCollapsedLeave}
        >
          <button
            className="action-btn"
            title={i18nConfig?.popup?.functions?.labels?.collapsed || 'More'}
            // Keep click handler minimal to avoid toggling; hover controls visibility
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={
              {
                animation: 'sl-selectlySlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '--delay': `${visibleButtons.length * 0.03}s`,
              } as React.CSSProperties
            }
          >
            ⋯
          </button>
          {showCollapsed && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 2,
                display: 'flex',
                gap: 3,
                paddingTop: 3,
              }}
            >
              {collapsedButtons.map((btn) => {
                let className = calcClass(
                  btn,
                  copyStatus,
                  collectStatus,
                  shareStatus,
                  isSelectionHighlighted
                );
                return (
                  <button
                    key={btn.key}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Note: We don't call restoreFocusSelection here to avoid interfering
                      // with current text selection. It will be called after the action completes.
                    }}
                    onClick={(event) => {
                      setShowCollapsed(false);
                      handleSingleClick(btn.key, event);
                    }}
                    onDoubleClick={(event) => {
                      setShowCollapsed(false);
                      handleDoubleClick(btn.key, event);
                    }}
                    className={className}
                    title={btn.title}
                    style={{
                      animation: 'sl-selectlySlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {btn.icon}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
function calcClass(
  btn: { key: string; icon: JSX.Element; title: string },
  copyStatus: string,
  collectStatus: string,
  shareStatus: string,
  isSelectionHighlighted: boolean
) {
  let className = 'action-btn';
  if (btn.key === 'copy') {
    if (copyStatus === 'success') {
      className += ' btn-success';
    } else if (copyStatus === 'error') {
      className += ' btn-error';
    }
  } else if (btn.key === 'collect') {
    if (collectStatus === 'success') {
      className += ' btn-success';
    } else if (collectStatus === 'error') {
      className += ' btn-error';
    }
  } else if (btn.key === 'share') {
    if (shareStatus === 'success') {
      className += ' btn-success';
    } else if (shareStatus === 'error') {
      className += ' btn-error';
    }
  } else if (btn.key === 'highlight') {
    if (isSelectionHighlighted) {
      className += ' btn-remove';
    }
  }
  return className;
}

function checkSelectionHasHighlight(selection: Selection | null): boolean {
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return false;

  const getClosestHighlight = (node: Node | null): HTMLElement | null => {
    if (!node) return null;
    const el = node instanceof HTMLElement ? node : node.parentElement;
    if (!el || !el.closest) return null;
    return el.closest('.selectly-highlight') as HTMLElement | null;
  };

  if (getClosestHighlight(range.startContainer)) return true;
  if (getClosestHighlight(range.endContainer)) return true;

  const rootNode =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as Element)
      : range.commonAncestorContainer.parentElement || document.body;

  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_SKIP;
      if (!node.classList.contains('selectly-highlight')) return NodeFilter.FILTER_SKIP;
      try {
        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      } catch {
        return NodeFilter.FILTER_SKIP;
      }
    },
  });

  return !!walker.nextNode();
}
