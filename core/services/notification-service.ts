import { i18n } from '../i18n';

export interface NotificationOptions {
  title: string;
  content: string;
  type?: 'success' | 'error' | 'info' | 'loading';
  duration?: number;
  copyable?: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, HTMLElement> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.addStyles();
  }

  show(options: NotificationOptions): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = this.createNotification(id, options);

    document.body.appendChild(notification);
    this.notifications.set(id, notification);

    // Entry animation
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    });

    // Auto dismiss
    if (options.type !== 'loading') {
      const duration = options.duration || 5000;
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return id;
  }

  hide(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications.delete(id);
      }, 300);
    }
  }

  update(id: string, options: Partial<NotificationOptions>): void {
    const notification = this.notifications.get(id);
    if (notification) {
      if (options.title) {
        const titleEl = notification.querySelector('.notification-title');
        if (titleEl) titleEl.textContent = options.title;
      }

      if (options.content) {
        const contentEl = notification.querySelector('.notification-content');
        if (contentEl) contentEl.textContent = options.content;
      }

      if (options.type) {
        notification.className = `selectly-notification ${options.type}`;
      }
    }
  }

  showLoading(title: string): string {
    return this.show({
      title,
      content: i18n.t('content.processing'),
      type: 'loading',
    });
  }

  showSuccess(title: string, content?: string, copyable = false): string {
    return this.show({
      title,
      content,
      type: 'success',
      copyable,
    });
  }

  showError(title: string, content: string): string {
    return this.show({
      title,
      content,
      type: 'error',
      duration: 8000,
    });
  }

  private createNotification(id: string, options: NotificationOptions): HTMLElement {
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `selectly-notification ${options.type || 'info'}`;

    const typeIcons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      loading: '⏳',
    };

    const icon = typeIcons[options.type || 'info'];

    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-icon">${icon}</span>
        <span class="notification-title">${options.title}</span>
        <button class="notification-close" onclick="this.closest('.selectly-notification').style.transform='translateX(100%)'; this.closest('.selectly-notification').style.opacity='0'; setTimeout(() => this.closest('.selectly-notification').remove(), 300)">×</button>
      </div>
      ${options.content ? `<div class="notification-content">${options.content}</div>` : ''}
      ${options.copyable ? `<button class="notification-copy">${i18n.t('common.copy')}</button>` : ''}
    `;

    // Add copy functionality
    if (options.copyable) {
      const copyBtn = notification.querySelector('.notification-copy') as HTMLButtonElement;
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(options.content);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = i18n.t('common.copy');
          }, 1000);
        } catch (error) {
          console.error('Copy failed:', error);
        }
      });
    }

    return notification;
  }

  private addStyles(): void {
    if (document.getElementById('selectly-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'selectly-notification-styles';
    style.textContent = `
      .selectly-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        max-width: 350px;
        min-width: 250px;
        z-index: 10001;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease-out;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .selectly-notification + .selectly-notification {
        top: calc(20px + var(--notification-offset, 0) * 80px);
      }

      .selectly-notification.success {
        border-left: 4px solid #4CAF50;
      }

      .selectly-notification.error {
        border-left: 4px solid #f44336;
      }

      .selectly-notification.info {
        border-left: 4px solid #2196F3;
      }

      .selectly-notification.loading {
        border-left: 4px solid #FF9800;
      }

      .notification-header {
        display: flex;
        align-items: center;
        padding: 12px 16px 8px 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }

      .notification-icon {
        font-size: 16px;
        margin-right: 8px;
      }

      .notification-title {
        font-weight: 600;
        font-size: 14px;
        color: #333;
        flex: 1;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        transition: all 0.2s;
      }

      .notification-close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
      }

      .notification-content {
        padding: 8px 16px 12px 16px;
        font-size: 13px;
        color: #555;
        line-height: 1.4;
        word-break: break-word;
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
      }

      .notification-copy {
        margin: 0 16px 12px 16px;
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .notification-copy:hover {
        background: #e0e0e0;
      }

      .loading .notification-icon {
        animation: sl-spin 1s linear infinite;
      }

      @keyframes sl-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Convenient export
export const notification = NotificationService.getInstance();
