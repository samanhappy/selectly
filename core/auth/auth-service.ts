/**
 * Enhanced Authentication Service
 * Implements OAuth2 authorization code flow using chrome.identity.launchWebAuthFlow
 * Supports token refresh and cross-browser compatibility
 */

import { secureStorage } from '../storage/secure-storage';

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  user: {
    email?: string;
    id?: string;
    uuid?: string;
  } | null;
}

type AuthListener = (state: AuthState) => void;

export class AuthService {
  private static instance: AuthService;
  private state: AuthState = {
    isAuthenticated: false,
    loading: false,
    error: null,
    user: null,
  };
  private listeners = new Set<AuthListener>();
  private tokenData: TokenData | null = null;
  private initialized = false;
  private initializing?: Promise<void>;
  private apiBaseUrl: string;
  private cachedStateLoaded = false;
  private subscribedToStorageChanges = false;

  private constructor() {
    this.apiBaseUrl = process.env.PLASMO_PUBLIC_API_URI || 'http://localhost:8472';
    // Try to load cached state synchronously on construction
    this.loadCachedState();
    // Ensure cross-context synchronization of token data
    this.subscribeToStorageChanges();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Subscribe to secure storage changes so updates to authTokenData
   * (from other extension contexts) immediately reflect in-memory state.
   */
  private subscribeToStorageChanges(): void {
    if (this.subscribedToStorageChanges) return;
    try {
      secureStorage.onChanged((changes) => {
        if ('authTokenData' in changes) {
          const { newValue } = changes.authTokenData || {};
          // Update in-memory token
          this.tokenData = (newValue as any) || null;

          // Update auth state accordingly
          const isAuthed = !!this.tokenData;
          const changed = this.state.isAuthenticated !== isAuthed;
          this.state.isAuthenticated = isAuthed;

          // Emit state if changed, or if token was replaced
          if (changed) {
            this.emit();
          }
        }
      });
      this.subscribedToStorageChanges = true;
    } catch (error) {
      console.warn('Failed to subscribe to storage changes for auth tokens:', error);
    }
  }

  /**
   * Initialize the auth service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        // Load stored token data
        await this.loadTokenFromStorage();

        // Validate existing token if available
        if (this.tokenData) {
          const isValid = await this.validateToken();
          if (isValid) {
            await this.updateUserInfo();
            this.state.isAuthenticated = true;
          } else {
            // Try to refresh if we have a refresh token
            if (this.tokenData.refreshToken) {
              try {
                await this.refreshAccessToken();
                // After refresh, attempt to update user info but don't fail init if this fails
                await this.updateUserInfo().catch(() => {});
                this.state.isAuthenticated = true;
              } catch (refreshErr) {
                // Do not loop on repeated init attempts when server is down
                // Preserve tokens (might be transient) but mark unauthenticated for now
                this.state.isAuthenticated = false;
                // Keep state.error with a friendly message
                const msg =
                  refreshErr instanceof Error ? refreshErr.message : 'Token refresh failed';
                this.state.error = msg;
              }
            } else {
              await this.clearTokenData();
              this.state.isAuthenticated = false;
            }
          }
        }
      } catch (error) {
        console.error('Auth service initialization failed:', error);
        this.state.error = 'Authentication initialization failed';
      } finally {
        // Mark as initialized to avoid tight loops from repeated callers (e.g., polling UIs)
        this.initialized = true;
        this.emit();
      }
    })();

    return this.initializing;
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && this.tokenData !== null;
  }

  /**
   * Check if the auth service has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current access token (refreshes if needed).
   * Always uses in-memory tokenData, which is kept in sync with storage to avoid stale tokens across contexts.
   */
  async getAccessToken(): Promise<string> {
    if (!this.tokenData) {
      throw new Error('No authentication token available');
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes

    if (this.tokenData.expiresAt <= now + bufferTime) {
      // Token is expired or will expire soon, try to refresh
      if (this.tokenData.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error('Access token expired and no refresh token available');
      }
    }

    return this.tokenData.accessToken;
  }

  /**
   * Start OAuth2 authentication flow
   */
  async signIn(): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    this.emit();

    try {
      // Use fallback to getAuthToken if launchWebAuthFlow fails
      let authCode: string;

      try {
        authCode = await this.launchOAuthFlow();
      } catch (webAuthError) {
        console.warn('WebAuthFlow failed, falling back to getAuthToken:', webAuthError);
        // await this.fallbackToGetAuthToken()
        return;
      }

      // Exchange authorization code for tokens
      const tokenData = await this.exchangeCodeForTokens(authCode);

      // Store token data (update in-memory first to avoid race with consumers)
      this.tokenData = tokenData;
      // Persist to storage for cross-context sync
      await this.saveTokenToStorage();

      // Update user info
      await this.updateUserInfo();

      this.state.isAuthenticated = true;
      this.state.loading = false;
      this.emit();
    } catch (error) {
      console.error('Sign in failed:', error);
      this.state.error = error instanceof Error ? error.message : 'Authentication failed';
      this.state.loading = false;
      this.emit();
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    this.state.loading = true;
    this.emit();

    try {
      // Revoke token on server if possible
      if (this.tokenData) {
        try {
          await this.revokeToken(this.tokenData.accessToken);
        } catch (error) {
          console.warn('Token revocation failed:', error);
        }
      }

      // Clear local data
      await this.clearTokenData();
      await this.clearUserInfoFromStorage();

      this.state.isAuthenticated = false;
      this.state.user = null;
      this.state.loading = false;
      this.emit();
    } catch (error) {
      console.error('Sign out failed:', error);
      this.state.error = 'Sign out failed';
      this.state.loading = false;
      this.emit();
    }
  }

  /**
   * Launch OAuth2 web auth flow
   */
  private async launchOAuthFlow(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.identity) {
        reject(new Error('Chrome Identity API not available'));
        return;
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      const clientId = process.env.PLASMO_PUBLIC_OAUTH_CLIENT_ID;

      if (!clientId) {
        reject(new Error('OAuth client ID not configured'));
        return;
      }

      // Generate redirect URI (without trailing slash)
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;

      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(7);

      // Set OAuth parameters
      const scopes =
        'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.href,
          interactive: true,
        },
        (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            reject(
              new Error(
                `WebAuthFlow failed: ${chrome.runtime.lastError?.message || 'Unknown error'}`
              )
            );
            return;
          }

          try {
            const params = new URLSearchParams(redirectUrl.split('?')[1]);
            const code = params.get('code');
            const returnedState = params.get('state');

            if (!code) {
              reject(new Error('No authorization code received'));
              return;
            }

            if (returnedState !== state) {
              reject(new Error('State mismatch - possible CSRF attack'));
              return;
            }

            resolve(code);
          } catch (error) {
            reject(new Error(`Failed to parse OAuth response: ${error}`));
          }
        }
      );
    });
  }

  /**
   * Fallback to legacy getAuthToken method
   */
  private async fallbackToGetAuthToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.identity) {
        reject(new Error('Chrome Identity API not available'));
        return;
      }

      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (token) {
          // Store as legacy token (no refresh token available)
          this.tokenData = {
            accessToken: token,
            expiresAt: Math.floor(Date.now() / 1000) + 3600, // Assume 1 hour expiry
          };
          this.saveTokenToStorage();
          this.updateUserInfo();
          this.state.isAuthenticated = true;
          this.state.loading = false;
          this.emit();
          resolve();
        } else {
          reject(new Error('Failed to get access token'));
        }
      });
    });
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<TokenData> {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/google/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: `https://${chrome.runtime.id}.chromiumapp.org`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      tokenType: data.tokenType || 'Bearer',
    };
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokenData?.refreshToken) {
      throw new Error('No refresh token available');
    }

    let response: Response;
    try {
      response = await fetch(`${this.apiBaseUrl}/api/auth/google/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.tokenData.refreshToken,
        }),
      });
    } catch (networkErr: any) {
      // Network or server unreachable. Preserve existing tokens and cached user/subscription info.
      // Surface a transient error to the caller without logging the user out.
      const message = networkErr?.message || 'Network error during token refresh';
      this.state.error = message;
      // Do NOT clear token/user info here
      throw new Error(message);
    }

    if (!response.ok) {
      // Only clear auth data for credential/permission errors. Preserve cache on server errors.
      // 400/401/403 typically indicate invalid/expired refresh token or revoked consent.
      if ([400, 401, 403].includes(response.status)) {
        await this.clearTokenData();
        // Keep cached user info and subscription info; full sign-out is user-initiated only.
        this.state.isAuthenticated = false;
        this.emit();
        // Provide a clearer message upstream so UI can prompt re-auth.
        throw new Error(`Token refresh rejected (${response.status}). Please sign in again.`);
      }

      // For 5xx/429/timeouts etc, keep tokens and cached state; let caller retry later.
      const transientMsg = `Auth server unavailable (${response.status}). Try again later.`;
      this.state.error = transientMsg;
      throw new Error(transientMsg);
    }

    const data = await response.json();

    // Update token data (keep existing refresh token)
    this.tokenData = {
      ...this.tokenData,
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
    };

    await this.saveTokenToStorage();
    // Notify listeners that token has changed to prevent stale usage
    this.emit();
  }

  /**
   * Revoke token on server
   */
  private async revokeToken(token: string): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/api/auth/google/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.warn('Token revocation request failed:', error);
    }
  }

  /**
   * Validate current token
   */
  private async validateToken(): Promise<boolean> {
    if (!this.tokenData) return false;

    try {
      // Make a simple API call to validate the token
      const response = await fetch(`${this.apiBaseUrl}/api/auth/google/user`, {
        headers: {
          Authorization: `Bearer ${this.tokenData.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Unauthorized - token invalid; do not throw to avoid cascaded retries
        return false;
      }
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update user information from Google API
   */
  private async updateUserInfo(): Promise<void> {
    if (!this.tokenData) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/google/user`, {
        headers: {
          Authorization: `Bearer ${this.tokenData.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Don't attempt further actions; background may refresh later
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (!result.success) {
          throw new Error('Failed to fetch user info');
        }
        const userInfo = result.data;
        this.state.user = {
          email: userInfo.email,
          id: userInfo.id,
          uuid: userInfo.uuid,
        };

        // Save user info to storage for quick access
        await this.saveUserInfoToStorage();

        // Emit state change after updating user info
        this.emit();
      }
    } catch (error) {
      console.warn('Failed to fetch user info:', error);
    }
  }

  /**
   * Save user info to storage
   */
  private async saveUserInfoToStorage(): Promise<void> {
    try {
      await secureStorage.set({ authUserInfo: this.state.user });
    } catch (error) {
      console.error('Failed to save user info to storage:', error);
    }
  }

  /**
   * Clear user info from storage
   */
  private async clearUserInfoFromStorage(): Promise<void> {
    try {
      await secureStorage.remove(['authUserInfo']);
    } catch (error) {
      console.warn('Failed to clear user info from storage:', error);
    }
  }

  /**
   * Load token data from secure storage
   */
  private async loadTokenFromStorage(): Promise<void> {
    try {
      const data = await secureStorage.get('authTokenData');
      this.tokenData = data.authTokenData as TokenData | null;
    } catch (error) {
      console.warn('Failed to load token from storage:', error);
      this.tokenData = null;
    }
  }

  /**
   * Save token data to secure storage
   */
  private async saveTokenToStorage(): Promise<void> {
    try {
      await secureStorage.set({ authTokenData: this.tokenData });
    } catch (error) {
      console.error('Failed to save token to storage:', error);
    }
  }

  /**
   * Clear token data from storage
   */
  private async clearTokenData(): Promise<void> {
    this.tokenData = null;
    try {
      await secureStorage.remove(['authTokenData']);
    } catch (error) {
      console.warn('Failed to clear token from storage:', error);
    }
  }

  /**
   * Load cached state synchronously on construction
   * This uses synchronous Chrome storage API to get immediate state
   */
  private loadCachedState(): void {
    if (this.cachedStateLoaded) return;

    try {
      // Try to get cached state synchronously from Chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        // For Chrome extension environment, we need to use the async API
        // but we'll trigger it and update state in background
        this.loadTokenFromStorage()
          .then(() => {
            if (this.tokenData) {
              // Quick validation - if token exists and not obviously expired, assume authenticated
              const now = Math.floor(Date.now() / 1000);
              if (!this.tokenData.expiresAt || this.tokenData.expiresAt > now) {
                this.state.isAuthenticated = true;
                // Try to get cached user info
                this.loadUserInfoFromStorage()
                  .then(() => {
                    this.emit();
                  })
                  .catch(() => {
                    // If user info loading fails, we'll get it during full initialization
                  });
              }
            }
          })
          .catch(() => {
            // Loading failed, keep default state
          });
      }
    } catch (error) {
      console.warn('Failed to load cached state:', error);
    }

    this.cachedStateLoaded = true;
  }

  /**
   * Load user info from storage
   */
  private async loadUserInfoFromStorage(): Promise<void> {
    try {
      const data = await secureStorage.get('authUserInfo');
      const userInfo = data.authUserInfo as {
        email?: string;
        id?: string;
      } | null;
      if (userInfo) {
        this.state.user = userInfo;
      }
    } catch (error) {
      console.warn('Failed to load user info from storage:', error);
    }
  }

  /**
   * Emit state changes to listeners
   */
  private emit(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  /**
   * Legacy compatibility method
   */
  async getAccessTokenLegacy(): Promise<string> {
    if (this.isAuthenticated() && this.tokenData) {
      return this.getAccessToken();
    } else {
      // If not authenticated, try to sign in
      await this.signIn();
      return this.getAccessToken();
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
