import { toBlob } from 'html-to-image';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { ShareImageRenderer } from '../../components/content/ShareImageRenderer';

export interface ShareImageOptions {
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface ShareImageDimensions {
  width: number;
  height: number;
  padding: number;
  headerHeight: number;
  footerHeight: number;
}

export class ImageGeneratorService {
  private static instance: ImageGeneratorService;

  static getInstance(): ImageGeneratorService {
    if (!ImageGeneratorService.instance) {
      ImageGeneratorService.instance = new ImageGeneratorService();
    }
    return ImageGeneratorService.instance;
  }

  private readonly DEFAULT_DIMENSIONS: ShareImageDimensions = {
    // Use OpenGraph-friendly width; height will be dynamic with 630px minimum
    width: 800,
    height: 630,
    padding: 48, // reduce outer padding to use space better
    // Header removed; keep key for compatibility but set to 0
    headerHeight: 0,
    footerHeight: 64,
  };

  private readonly DEFAULT_COLORS = {
    background: '#ffffff',
    // slightly more pronounced cool gray/blue gradient for depth
    bgFrom: '#f6f9ff',
    bgTo: '#ffffff',
    text: '#0f172a', // slate-900
    accent: '#2563eb',
    secondary: '#64748b', // slate-500
    border: '#e2e8f0', // slate-200
    contentBg: '#ffffff',
  };

  async generateShareImage(options: ShareImageOptions): Promise<Blob> {
    // Render a React component to an offscreen container in main DOM, then snapshot to image
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    const root = createRoot(container);
    const width = this.DEFAULT_DIMENSIONS.width;

    // Optional: QR code generation temporarily disabled to avoid bundler resolution issues
    // You can re-enable with a dynamic import when bundler supports it reliably.
    let qrDataUrl: string | undefined = undefined;

    root.render(
      React.createElement(ShareImageRenderer, {
        selectedText: options.selectedText,
        pageTitle: options.pageTitle,
        pageUrl: options.pageUrl,
        qrDataUrl,
        width,
        padding: this.DEFAULT_DIMENSIONS.padding,
        backgroundColor: options.backgroundColor || this.DEFAULT_COLORS.background,
        textColor: options.textColor || this.DEFAULT_COLORS.text,
        accentColor: options.accentColor || this.DEFAULT_COLORS.accent,
      })
    );

    // Ensure React commit + layout and fonts are fully flushed
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if ((document as any).fonts && typeof (document as any).fonts.ready?.then === 'function') {
      try {
        await (document as any).fonts.ready;
      } catch {}
    }

    try {
      const target = (container.firstElementChild as HTMLElement) || container;
      const blob = await toBlob(target, {
        pixelRatio: Math.min(2, window.devicePixelRatio || 1),
        backgroundColor: this.DEFAULT_COLORS.background,
      });
      if (!blob) throw new Error('Failed to generate image blob');
      return blob;
    } finally {
      try {
        root.unmount();
      } catch {}
      container.remove();
    }
  }

  async downloadImage(blob: Blob, filename?: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename || `selectly-share-${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    URL.revokeObjectURL(url);
  }
}

export const imageGeneratorService = ImageGeneratorService.getInstance();
