/**
 * Updated Subscription management service with enhanced authentication
 */

import { authService } from '../auth/auth-service';
import type { SubscriptionStatus as ApiSubscriptionStatus } from '../premium-api-v2';
import { checkSubscription, initiateAuthentication, isAuthenticated } from '../premium-api-v2';
import { secureStorage } from '../storage/secure-storage';

type SubscriptionStatus = ApiSubscriptionStatus;

interface StoredSubscriptionInfo {
  status: SubscriptionStatus;
  lastChecked: number;
  userId?: string; // Add user ID for better cache management
}

type Listener = (state: {
  status: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  lastChecked: number | null;
  isAuthenticated: boolean;
  user: { email?: string; id?: string } | null;
}) => void;

class SubscriptionServiceV2 {
  private static instance: SubscriptionServiceV2;

  // Static memory cache to persist state across service instances
  private static cachedStatus: SubscriptionStatus | null = null;
  private static cachedLastChecked: number | null = null;

  private status: SubscriptionStatus | null = null;
  private lastChecked: number | null = null;
  private loading = false;
  private error: string | null = null;
  private initialized = false;
  private initializing?: Promise<void>;
  private inFlight?: Promise<void>;
  private startupRefreshed = false;

  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly INTERVAL_UNSUB_MS = 30 * 1000;
  private readonly INTERVAL_SUB_MS = 30 * 60 * 1000;
  private autoRefreshEnabled = false;

  private listeners = new Set<Listener>();
  private authStateUnsubscribe?: () => void;
  private cachedStateLoaded = false;

  private constructor() {
    // Load cached subscription state synchronously on construction
    this.status = SubscriptionServiceV2.cachedStatus;
    this.lastChecked = SubscriptionServiceV2.cachedLastChecked;
    this.loadCachedSubscriptionState();
  }

  static getInstance(): SubscriptionServiceV2 {
    if (!SubscriptionServiceV2.instance) {
      SubscriptionServiceV2.instance = new SubscriptionServiceV2();
    }
    return SubscriptionServiceV2.instance;
  }

  // Storage and initialization
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await secureStorage.get('subscriptionInfo');
      const stored = data.subscriptionInfo as StoredSubscriptionInfo | undefined;
      if (stored && stored.status) {
        // Validate that stored data matches current user
        const currentUser = authService.getState().user;
        if (!stored.userId || !currentUser || stored.userId === currentUser.id) {
          this.status = stored.status;
          this.lastChecked = stored.lastChecked || null;

          // Update static cache
          SubscriptionServiceV2.cachedStatus = this.status;
          SubscriptionServiceV2.cachedLastChecked = this.lastChecked;
        }
      }
    } catch (e) {
      console.warn('load subscriptionInfo from storage failed:', e);
    }
  }

  private async saveToStorage(): Promise<void> {
    if (!this.status || !this.lastChecked) return;

    // Update static cache immediately
    SubscriptionServiceV2.cachedStatus = this.status;
    SubscriptionServiceV2.cachedLastChecked = this.lastChecked;

    const currentUser = authService.getState().user;
    const payload: StoredSubscriptionInfo = {
      status: this.status,
      lastChecked: this.lastChecked,
      userId: currentUser?.id,
    };

    try {
      await secureStorage.set({ subscriptionInfo: payload });
    } catch (e) {
      console.warn('save subscriptionInfo to storage failed:', e);
    }
  }

  /**
   * Load cached subscription state synchronously on construction
   */
  private loadCachedSubscriptionState(): void {
    if (this.cachedStateLoaded) return;

    try {
      // Load cached subscription data asynchronously, but set flag immediately
      this.loadFromStorage()
        .then(() => {
          // If we have cached data, emit it immediately
          if (this.status) {
            console.log('Loaded cached subscription status:', this.status);
            this.emit();
          }
        })
        .catch((error) => {
          console.warn('Failed to load cached subscription state:', error);
        });

      // For immediate availability, try to get cached data synchronously using Chrome storage API
      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        // We need to set this flag immediately so getCurrentState works
        this.cachedStateLoaded = true;

        // Trigger background loading but don't block construction
        setTimeout(() => {
          this.loadFromStorage()
            .then(() => {
              if (this.status) {
                this.emit();
              }
            })
            .catch(() => {
              // Ignore cache loading errors
            });
        }, 0);
      }
    } catch (error) {
      console.warn('Failed to initiate cached subscription state loading:', error);
    }

    this.cachedStateLoaded = true;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.initializing) {
      this.initializing = (async () => {
        // Initialize auth service first
        await authService.initialize();

        // Set up auth state listener
        this.authStateUnsubscribe = authService.subscribe((authState) => {
          // When auth state changes, refresh subscription status
          if (authState.isAuthenticated) {
            // User signed in, refresh subscription
            this.refresh({ force: true, reason: 'auth-change' });
          } else {
            // User signed out, clear subscription data and disable auto-refresh
            this.disableAutoRefresh();
            this.clearCache();
          }
          this.emit();
        });

        // Load stored subscription data
        await this.loadFromStorage();

        // Listen for storage changes
        secureStorage.onChanged((changes) => {
          if ('subscriptionInfo' in changes) {
            const next = changes.subscriptionInfo?.newValue as StoredSubscriptionInfo | undefined;
            if (next && next.status) {
              const currentUser = authService.getState().user;
              if (!next.userId || !currentUser || next.userId === currentUser.id) {
                this.status = next.status;
                this.lastChecked = next.lastChecked || Date.now();

                // Update static cache
                SubscriptionServiceV2.cachedStatus = this.status;
                SubscriptionServiceV2.cachedLastChecked = this.lastChecked;

                this.emit();
                this.maybeEnsureAutoRefresh();
              }
            }
          }
        });

        this.initialized = true;
        this.maybeEnsureAutoRefresh();
      })();
    }
    return this.initializing;
  }

  /**
   * Start authentication flow for subscription management
   */
  async authenticate(): Promise<void> {
    try {
      await initiateAuthentication();
      // After successful authentication, refresh subscription status
      await this.refresh({ force: true, reason: 'auth-initiated' });
    } catch (error) {
      console.error('Authentication failed:', error);
      this.error = error instanceof Error ? error.message : 'Authentication failed';
      this.emit();
      throw error;
    }
  }

  /**
   * Sign out and clear subscription data
   */
  async signOut(): Promise<void> {
    try {
      await authService.signOut();
      this.clearCache();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  // Subscription and notifications
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    this.emit();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const authState = authService.getState();
    const state = {
      status: this.status,
      loading: this.loading,
      error: this.error,
      lastChecked: this.lastChecked,
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Subscription listener error:', error);
      }
    });
  }

  // Auto-refresh logic
  private maybeEnsureAutoRefresh(): void {
    if (!this.initialized) return;

    // Only auto-refresh if user is authenticated
    const authState = authService.getState();
    if (!authState.isAuthenticated) {
      // If user is not authenticated, disable auto-refresh
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
      return;
    }

    const shouldRefresh = this.isSubscriptionActive();
    const newInterval = shouldRefresh ? this.INTERVAL_SUB_MS : this.INTERVAL_UNSUB_MS;

    if (this.autoRefreshEnabled) {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
      this.refreshTimer = setInterval(() => {
        this.refresh({ force: false, reason: 'auto' });
      }, newInterval);
    }
  }

  enableAutoRefresh(): void {
    this.autoRefreshEnabled = true;
    this.maybeEnsureAutoRefresh();
  }

  disableAutoRefresh(): void {
    this.autoRefreshEnabled = false;
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Status checking
  isSubscriptionActive(): boolean {
    if (!this.status) return false;
    if (!this.status.active) return false;

    // Check expiration
    if (this.status.period_end) {
      const now = Math.floor(Date.now() / 1000);
      return this.status.period_end > now;
    }

    return true;
  }

  getSubscriptionStatus(): SubscriptionStatus | null {
    return this.status ? { ...this.status } : null;
  }

  isLoading(): boolean {
    return this.loading;
  }

  getError(): string | null {
    return this.error;
  }

  getLastChecked(): number | null {
    return this.lastChecked;
  }

  // Refresh logic
  async refresh(options: { force?: boolean; reason?: string } = {}): Promise<void> {
    await this.initialize();

    const { force = false, reason = 'manual' } = options;

    // Skip if not authenticated and not forcing
    if (!force && !isAuthenticated()) {
      return;
    }

    // Skip if already loading
    if (this.loading) {
      return this.inFlight || Promise.resolve();
    }

    // Skip if recently checked (unless forced)
    if (!force && this.lastChecked) {
      const timeSinceCheck = Date.now() - this.lastChecked;
      const minInterval = this.isSubscriptionActive()
        ? this.INTERVAL_SUB_MS
        : this.INTERVAL_UNSUB_MS;

      if (timeSinceCheck < minInterval) {
        return;
      }
    }

    this.loading = true;
    this.error = null;
    this.emit();

    this.inFlight = (async () => {
      try {
        const next = await checkSubscription();
        this.status = {
          active: !!next.active,
          interval: next.interval || (next.active ? 'month' : 'none'),
          period_end: next.period_end,
        };
        this.lastChecked = Date.now();

        // Update static cache
        SubscriptionServiceV2.cachedStatus = this.status;
        SubscriptionServiceV2.cachedLastChecked = this.lastChecked;
        await this.saveToStorage();
        this.maybeEnsureAutoRefresh();
      } catch (err: any) {
        // Handle authentication errors
        if (err?.message?.includes('Authentication failed')) {
          this.error = 'Please sign in to check subscription status';
        } else {
          const message = err?.message || 'Subscription check failed';
          this.error = message;
        }
      } finally {
        this.loading = false;
        this.emit();
      }
    })();

    return this.inFlight;
  }

  async refreshOnceAtStartup(): Promise<void> {
    await this.initialize();
    if (this.startupRefreshed) return;
    this.startupRefreshed = true;
    return this.refresh({ force: true, reason: 'startup' });
  }

  clearCache(): void {
    this.status = null;
    this.lastChecked = null;
    this.error = null;

    // Clear static cache as well
    SubscriptionServiceV2.cachedStatus = null;
    SubscriptionServiceV2.cachedLastChecked = null;

    // Also clear storage to prevent cross-user data leakage
    secureStorage.remove(['subscriptionInfo']).catch((error) => {
      console.warn('Failed to clear subscription info from storage:', error);
    });

    this.emit();
    this.maybeEnsureAutoRefresh();
  }

  // Feature access methods
  async canExecutePremiumAction(_actionKey?: string): Promise<boolean> {
    // If not authenticated, cannot use premium features
    if (!isAuthenticated()) {
      return false;
    }

    return this.isSubscriptionActive();
  }

  async canUseAdvancedFeatures(): Promise<boolean> {
    if (!isAuthenticated()) {
      return false;
    }

    return this.isSubscriptionActive();
  }

  requiresSubscription(functionConfig: { isPremium?: boolean }): boolean {
    return functionConfig.isPremium === true;
  }

  async getSubscriptionInfo(): Promise<{
    active: boolean;
    needsUpgrade: boolean;
    needsAuth: boolean;
    message?: string;
  }> {
    const authenticated = isAuthenticated();

    if (!authenticated) {
      return {
        active: false,
        needsUpgrade: false,
        needsAuth: true,
        message: 'Please sign in to access premium features',
      };
    }

    const isActive = this.isSubscriptionActive();
    return {
      active: isActive,
      needsUpgrade: !isActive,
      needsAuth: false,
      message: isActive ? 'Premium features activated' : 'Upgrade to premium for more features',
    };
  }

  /**
   * Check if user needs to authenticate for premium features
   */
  needsAuthentication(): boolean {
    return !isAuthenticated();
  }

  /**
   * Get current user information
   */
  getCurrentUser() {
    return authService.getState().user;
  }

  /**
   * Get current complete state synchronously
   */
  getCurrentState() {
    const authState = authService.getState();
    return {
      status: this.status,
      loading: this.loading,
      error: this.error,
      lastChecked: this.lastChecked,
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disableAutoRefresh();
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
    }
    this.listeners.clear();
  }
}

export default SubscriptionServiceV2;
