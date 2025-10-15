/**
 * Updated premium API to use new AuthService
 */

import { authService } from './auth/auth-service';
import { secureStorage } from './storage/secure-storage';

/**
 * 调用需要认证的 API
 */
type RequestInitWithRetry = RequestInit & { __selectlyRetried?: boolean };

export const callAPI = async (endpoint: string, options: RequestInitWithRetry = {}) => {
  // Ensure user is authenticated and get valid access token
  const token = await authService.getAccessToken();

  const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URI}${endpoint}`, {
    ...options,
    headers: {
      // Merge caller headers first, then enforce Authorization to avoid accidental override
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle authentication errors
  if (response.status === 401) {
    // Avoid infinite loops: only retry once per call invocation
    const alreadyRetried = options.__selectlyRetried === true;
    if (alreadyRetried) {
      throw new Error('Unauthorized (401) after retry');
    }
    // Force token refresh via authService.getAccessToken again
    try {
      const newToken = await authService.getAccessToken();
      const retryOptions: RequestInitWithRetry = {
        ...options,
        __selectlyRetried: true,
        headers: {
          ...(options.headers || {}),
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
      };
      const retryResponse = await fetch(
        `${process.env.PLASMO_PUBLIC_API_URI}${endpoint}`,
        retryOptions
      );

      if (!retryResponse.ok) {
        throw new Error(`API call failed after token refresh: ${retryResponse.statusText}`);
      }

      return retryResponse.json();
    } catch (authError: any) {
      throw new Error(`Authentication/token refresh failed: ${authError?.message || authError}`);
    }
  }

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Redeem subscription code API
 */
export interface RedeemCodeResponse {
  // Business result
  success: boolean;
  // Human readable message
  message?: string;
  // When success = true, describe the benefit granted
  grant?: {
    // one-time means lifetime entitlement; month means monthly period, etc.
    interval: 'one-time' | 'month' | 'year';
    // Unix seconds of expiry when interval is not one-time; optional when lifetime
    period_end?: number;
    // Number of periods granted (e.g., 1 month, 3 months); optional for lifetime
    quantity?: number;
    // The code that was redeemed (for display/tracking)
    code?: string;
  };
  // Optional structured error code when success=false
  errorCode?:
    | 'INVALID_CODE'
    | 'CODE_EXPIRED'
    | 'CODE_USED'
    | 'NOT_ELIGIBLE'
    | 'RATE_LIMITED'
    | 'SERVER_ERROR';
}

export const redeemSubscriptionCode = async (code: string): Promise<RedeemCodeResponse> => {
  if (!code || !code.trim()) {
    throw new Error('Redeem code is required');
  }

  // Ensure auth (will prompt sign-in if needed)
  await authService.initialize();
  if (!authService.isAuthenticated()) {
    await authService.signIn();
  }

  const res = await callAPI('/api/redeem-code', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim() }),
  });

  // Expect server to return RedeemCodeResponse shape
  return res as RedeemCodeResponse;
};

/**
 * 订阅状态接口
 */
export interface SubscriptionStatus {
  active: boolean;
  interval: 'none' | 'month' | 'one-time';
  period_end?: number; // Unix timestamp
  credits?: {
    limit: number;
    limit_remaining: number;
    usage: number;
    usage_daily: number;
    usage_weekly: number;
    usage_monthly: number;
  };
}

/**
 * 检查用户订阅状态
 * 现在使用新的认证系统
 */
export const checkSubscription = async (): Promise<SubscriptionStatus> => {
  // Ensure auth service is initialized
  await authService.initialize();

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    // For subscription check, we don't automatically sign in
    // Return default inactive status
    return {
      active: false,
      interval: 'none',
    };
  }

  try {
    const result = await callAPI('/api/check-subscription');
    // Persist latest subscription status to cache for fallback usage
    try {
      const user = authService.getState().user;
      const payload = {
        status: {
          active: !!result.active,
          interval:
            (result.interval as SubscriptionStatus['interval']) ||
            (result.active ? 'month' : 'none'),
          period_end: result.period_end,
          credits: result.credits,
        } as SubscriptionStatus,
        lastChecked: Date.now(),
        userId: user?.id,
      };
      await secureStorage.set({ subscriptionInfo: payload });
    } catch (cacheErr) {
      console.warn('Failed to cache subscription status:', cacheErr);
    }
    return result;
  } catch (error) {
    console.warn('Subscription check failed:', error);
    // On error, attempt to read last known subscription status from cache
    try {
      const data = await secureStorage.get('subscriptionInfo');
      const cached = data.subscriptionInfo as
        | {
            status?: SubscriptionStatus;
            lastChecked?: number;
            userId?: string;
          }
        | undefined;
      if (cached && cached.status) {
        // Validate cache belongs to current user if userId recorded
        const currentUser = authService.getState().user;
        if (!cached.userId || (currentUser && cached.userId === currentUser.id)) {
          return cached.status;
        }
      }
    } catch (cacheReadErr) {
      console.warn('Failed to read cached subscription status:', cacheReadErr);
    }
    // Fallback default inactive status
    return { active: false, interval: 'none' };
  }
};

/**
 * 调用高级功能
 */
export const callPremiumFeature = async (data?: any): Promise<any> => {
  return callAPI('/api/premium-feature', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 启动认证流程（用于订阅管理）
 */
export const initiateAuthentication = async (): Promise<void> => {
  await authService.initialize();
  if (!authService.isAuthenticated()) {
    await authService.signIn();
  }
};

/**
 * 登出（用于订阅管理）
 */
export const signOut = async (): Promise<void> => {
  await authService.signOut();
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  const state = authService.getState();
  return state.user;
};

/**
 * 检查是否已认证
 */
export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};
