/**
 * Content script styles definition
 * These styles are injected into Shadow DOM to ensure isolation
 */

export const contentStyles = `
  @keyframes sl-selectlySlideIn {
    from {
      opacity: 0;
      transform: translateY(-12px) scale(0.9);
      filter: blur(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  @keyframes sl-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  @keyframes sl-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes sl-ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes sl-glow {
    0%, 100% {
      box-shadow:
        0 0 5px rgba(96, 165, 250, 0.3),
        0 2px 10px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    50% {
      box-shadow:
        0 0 20px rgba(96, 165, 250, 0.6),
        0 2px 20px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
  }

  @keyframes sl-fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes sl-slideInScale {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Reading progress bar */
  .selectly-progress-host {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    z-index: 1000000;
    pointer-events: none;
  }

  .selectly-progress-bar {
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.08);
  }

  .selectly-progress-bar__fill {
    width: 0%;
    height: 100%;
    background: var(--selectly-progress-color, #60a5fa);
    transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
  }

  /* Manual reading progress save button */
  .selectly-global-actions {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 1000000;
    pointer-events: auto;
  }

  .selectly-global-action-btn {
    all: unset;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #334155;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(15, 23, 42, 0.12);
    box-shadow:
      0 6px 14px rgba(15, 23, 42, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .selectly-global-action-btn:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.95);
    box-shadow:
      0 10px 20px rgba(15, 23, 42, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .selectly-global-action-btn:active {
    transform: translateY(0);
    background: rgba(248, 250, 252, 0.95);
  }

  .selectly-global-action-btn.is-saved {
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow:
      0 8px 16px rgba(34, 197, 94, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }


  /* Glass morphism button base styles */
  .selectly-buttons .action-btn {
    all: unset;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #0f172a; /* ensure icon (currentColor) has strong contrast by default */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  animation: sl-selectlySlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    animation-delay: var(--delay, 0s);
    animation-fill-mode: both;
  }

  /* Neumorphism concave/convex effects */
  .selectly-buttons .action-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    background: linear-gradient(145deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.02) 50%,
      rgba(0, 0, 0, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* Hover effects */
  .selectly-buttons .action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px) scale(1.05);
    color: #60a5fa;
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.25),
      0 0 20px rgba(96, 165, 250, 0.3),
      inset 0 0 0 rgba(255, 255, 255, 0.2),
      inset 0 0 0 rgba(0, 0, 0, 0.1);
  }

  .selectly-buttons .action-btn:hover::before {
    opacity: 1;
  }

  /* Click effects */
  .selectly-buttons .action-btn:active {
    transform: translateY(0) scale(0.98);
    background: rgba(255, 255, 255, 0.2);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.2),
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Click ripple effect */
  .selectly-buttons .action-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(96, 165, 250, 0.6) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .selectly-buttons .action-btn:active::after {
    width: 120px;
    height: 120px;
  animation: sl-ripple 0.6s ease-out;
  }

  /* Selected state highlight gradient border */
  .selectly-buttons .action-btn.selected {
    background: rgba(96, 165, 250, 0.15);
    border: 2px solid transparent;
    background-image:
      linear-gradient(rgba(20, 20, 20, 0.7), rgba(20, 20, 20, 0.7)),
      linear-gradient(135deg, #60a5fa, #a855f7, #ec4899);
    background-origin: border-box;
    background-clip: content-box, border-box;
  animation: sl-glow 2s ease-in-out infinite;
  }

  /* Copy success state styles */
  .selectly-buttons .action-btn.btn-success {
    color: #22c55e;
  }

  /* Copy error state styles */
  .selectly-buttons .action-btn.btn-error {
    color: #ef4444;
  }

  /* Remove highlight state styles */
  .selectly-buttons .action-btn.btn-remove {
    color: #f97316;
  }

  /* Glass button common styles */
  .glass-button {
    position: relative;
    overflow: hidden;
  }

  .glass-button.btn-success {
    color: #22c55e;
  }

  .glass-button:hover {
    background: rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(0, 0, 0, 0.15) !important;
  }

  .glass-button:active {
    transform: translateY(0) !important;
    background: rgba(0, 0, 0, 0.03) !important;
  }

  .paste-btn:hover {
    background: rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(0, 0, 0, 0.15) !important;
    transform: translateY(-1px);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
  }

  .paste-btn:active {
    transform: translateY(0) !important;
    background: rgba(59, 130, 246, 0.08) !important;
  }

  /* Streaming result window style optimization */
  .selectly-streaming-result {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  /* Hide in certain special elements */
  input .selectly-buttons,
  textarea .selectly-buttons,
  [contenteditable] .selectly-buttons {
    display: none !important;
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .selectly-buttons {
      padding: 8px !important;
      gap: 4px !important;
    }


    .selectly-buttons .action-btn {
      width: 40px !important;
      height: 40px !important;
    }

    .selectly-streaming-result {
      min-width: 280px !important;
      max-width: calc(100vw - 40px) !important;
      left: 20px !important;
      right: 20px !important;
    }
  }

  /* Dark mode adjustments for better contrast */
  @media (prefers-color-scheme: dark) {
    .selectly-buttons .action-btn {
      background: rgba(17, 24, 39, 0.7); /* slate-900 with alpha */
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      color: #e5e7eb; /* slate-200 for icon visibility */
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow:
        0 2px 10px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.04),
        inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    }

    .selectly-buttons .action-btn:active {
      background: rgba(30, 41, 59, 0.55);
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.5),
        inset 0 2px 4px rgba(0, 0, 0, 0.35),
        inset 0 -1px 0 rgba(255, 255, 255, 0.05);
    }

    .selectly-buttons .action-btn::before {
      background: linear-gradient(145deg,
        rgba(255, 255, 255, 0.03) 0%,
        rgba(255, 255, 255, 0.02) 50%,
        rgba(0, 0, 0, 0.35) 100%);
    }

    .selectly-buttons .action-btn.selected {
      background: rgba(59, 130, 246, 0.18);
      border: 2px solid transparent;
      background-image:
        linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)),
        linear-gradient(135deg, #60a5fa, #a855f7, #ec4899);
      background-origin: border-box;
      background-clip: content-box, border-box;
    }

    /* Keep semantic states vivid on dark */
    .selectly-buttons .action-btn.btn-success { color: #22c55e; }
    .selectly-buttons .action-btn.btn-error { color: #ef4444; }
    .selectly-buttons .action-btn.btn-remove { color: #f97316; }

    .selectly-progress-bar {
      background: rgba(15, 23, 42, 0.4);
    }
  }
`;
