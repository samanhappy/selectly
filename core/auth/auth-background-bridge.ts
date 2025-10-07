/**
 * Auth Background Bridge
 * Provides a bridge between popup/content scripts and background script for authentication
 */

interface AuthResponse {
  success: boolean;
  error?: string;
  authState?: {
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    user: { email?: string; id?: string } | null;
  };
}

/**
 * Authenticate user via background script
 */
export const authenticateInBackground = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'authenticate' }, (response: AuthResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || 'Authentication failed'));
      }
    });
  });
};

/**
 * Sign out user via background script
 */
export const signOutInBackground = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'signOut' }, (response: AuthResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || 'Sign out failed'));
      }
    });
  });
};

/**
 * Get current auth state from background script
 */
export const getAuthStateFromBackground = async (): Promise<{
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  user: { email?: string; id?: string } | null;
}> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getAuthState' }, (response: AuthResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response.success && response.authState) {
        resolve(response.authState);
      } else {
        reject(new Error(response.error || 'Failed to get auth state'));
      }
    });
  });
};
