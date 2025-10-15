/**
 * Simplified SubscriptionManager with clean auth state management
 * Single source of truth: AuthService
 * No complex reducers, no state synchronization, no race conditions
 */

import {
  Check,
  CreditCard,
  Gift,
  Infinity,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { authService } from '../../core/auth/auth-service';
import { useI18n } from '../../core/i18n/hooks/useI18n';
import { redeemSubscriptionCode, type RedeemCodeResponse } from '../../core/premium-api-v2';
import { collectService } from '../../core/services/collect-service';
import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';
import { PremiumCrown } from '../shared/PremiumCrown';
import { Drawer } from './Drawer';

interface Props {
  palette: any;
}

export const SubscriptionManagerV3: React.FC<Props> = ({ palette }) => {
  const { t } = useI18n();
  const subscriptionService = SubscriptionServiceV2.getInstance();

  // Simple state - only what we need
  const [authState, setAuthState] = useState(() => authService.getState());
  const [subscriptionStatus, setSubscriptionStatus] = useState(() =>
    subscriptionService.getSubscriptionStatus()
  );
  const [dailyUsage, setDailyUsage] = useState<{
    usedCount: number;
    remainingCount: number;
    dailyLimit: number;
  }>({
    usedCount: 0,
    remainingCount: 10,
    dailyLimit: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingSubscription, setIsRefreshingSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redeem dialog state
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);
  const [redeemResult, setRedeemResult] = useState<null | {
    success: boolean;
    message: string;
    grantText?: string;
  }>(null);

  useEffect(() => {
    // Initialize services
    const initServices = async () => {
      await authService.initialize();
      await subscriptionService.initialize();

      // Update initial state after initialization
      setAuthState(authService.getState());
      setSubscriptionStatus(subscriptionService.getSubscriptionStatus());
    };

    initServices();

    // Subscribe to auth changes - single source of truth
    const unsubscribeAuth = authService.subscribe((newAuthState) => {
      console.log('Auth state changed:', newAuthState);
      setAuthState(newAuthState);

      // Clear error when auth state changes (e.g., after successful login)
      if (newAuthState.isAuthenticated && error) {
        setError(null);
      }
    });

    // Subscribe to subscription changes
    const unsubscribeSubscription = subscriptionService.subscribe((subState) => {
      // console.log('Subscription state changed:', subState)
      setSubscriptionStatus(subState.status);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSubscription();
    };
  }, [error]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.signIn();
      // Auth state will be updated via the subscription
      // After auth, refresh subscription
      await subscriptionService.refresh({ force: true, reason: 'post-auth' });
      subscriptionService.enableAutoRefresh();
      collectService.sync();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      console.error('Sign in error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      subscriptionService.disableAutoRefresh();
      await authService.signOut();
      // Auth state and subscription state will be updated via subscriptions
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      console.error('Sign out error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    if (!authState.isAuthenticated) return;

    setIsRefreshingSubscription(true);
    setError(null);

    try {
      await subscriptionService.refresh({ force: true, reason: 'manual-refresh' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refresh failed';
      console.error('Refresh error:', message);
      setError(message);
    } finally {
      setIsRefreshingSubscription(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'lifetime') => {
    try {
      const pricingLink = process.env.PLASMO_PUBLIC_PRICING_LINK;
      if (pricingLink) {
        if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
          chrome.tabs.create({ url: pricingLink });
        } else {
          window.open(pricingLink, '_blank', 'noopener,noreferrer');
        }
        return;
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Subscription failed. Please try again.');
    }
  };

  const formatGrantText = (resp: RedeemCodeResponse): string | undefined => {
    if (!resp.success || !resp.grant) return undefined;
    const { interval, period_end, quantity } = resp.grant;
    if (interval === 'one-time') {
      return t ? t('popup.subscription.redeemLifetime') : 'Lifetime membership activated';
    }
    if (quantity && quantity > 1) {
      const unit =
        interval === 'month' ? (t ? t('time.months') : 'months') : t ? t('time.years') : 'years';
      return `${quantity} ${unit}`;
    }
    if (period_end) {
      const date = new Date(period_end * 1000).toLocaleDateString();
      const label = t ? t('popup.subscription.expiresOn') : 'Expires on';
      return `${label} ${date}`;
    }
    const unitSingle =
      interval === 'month' ? (t ? t('time.month') : 'month') : t ? t('time.year') : 'year';
    return `1 ${unitSingle}`;
  };

  const handleRedeemSubmit = async () => {
    if (!redeemCode.trim()) return;

    setRedeemSubmitting(true);
    setRedeemResult(null);

    try {
      const result = await redeemSubscriptionCode(redeemCode.trim());
      const grantText = formatGrantText(result);

      if (result.success) {
        setRedeemResult({
          success: true,
          message:
            result.message || (t ? t('popup.subscription.redeemSuccess') : 'Redeemed successfully'),
          grantText,
        });
        // Refresh subscription
        await subscriptionService.refresh({ force: true, reason: 'redeem-success' });
      } else {
        const msg = result.message || (t ? t('popup.subscription.redeemFailed') : 'Redeem failed');
        setRedeemResult({ success: false, message: msg });
      }
    } catch (e: any) {
      const msg =
        e?.message || (t ? t('popup.subscription.redeemError') : 'Redeem error, please try again');
      setRedeemResult({ success: false, message: msg });
    } finally {
      setRedeemSubmitting(false);
    }
  };

  const formatExpiryDate = (timestamp: number) => {
    return timestamp > 0 ? new Date(timestamp * 1000).toLocaleDateString() : '';
  };

  const isActive = subscriptionStatus?.active;
  const isLifetime = isActive && subscriptionStatus?.interval === 'one-time';
  const isMonthly = isActive && subscriptionStatus?.interval === 'month';

  return (
    <div>
      {/* Error Section */}
      {error && (
        <div
          style={{
            padding: '12px',
            border: `1px solid ${palette.danger}`,
            borderRadius: '8px',
            backgroundColor: `${palette.danger}08`,
            marginBottom: '16px',
          }}
        >
          <p style={{ color: palette.text, fontSize: '13px', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Auth Section */}
      <div
        style={{
          padding: '16px',
          border: `1px solid ${palette.border}`,
          borderRadius: '8px',
          backgroundColor: palette.surface,
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color={palette.primary} />
            <div>
              {authState.isAuthenticated && authState.user?.email ? (
                <p
                  style={{
                    color: palette.textSecondary,
                    fontSize: '13px',
                    margin: 0,
                  }}
                >
                  {authState.user.email}
                </p>
              ) : (
                <p
                  style={{
                    color: palette.textSecondary,
                    fontSize: '13px',
                    margin: 0,
                  }}
                >
                  {t
                    ? t('popup.subscription.signInToAccess')
                    : 'Sign in to access premium features'}
                </p>
              )}
            </div>
          </div>

          {authState.isAuthenticated ? (
            <button
              className="sl-btn sl-btn-secondary"
              onClick={handleSignOut}
              disabled={isLoading}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
              {t ? t('popup.subscription.signOut') : 'Sign Out'}
            </button>
          ) : (
            <button
              className="sl-btn sl-btn-primary"
              onClick={handleSignIn}
              disabled={isLoading}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
              {t ? t('popup.subscription.signIn') : 'Sign In'}
            </button>
          )}
        </div>
      </div>

      {/* Subscription Section */}
      <div
        style={{
          padding: '16px',
          border: `1px solid ${palette.border}`,
          borderRadius: '8px',
          backgroundColor: palette.surface,
        }}
      >
        {/* Header */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: palette.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <PremiumCrown
                  active={authState.isAuthenticated && !!isActive}
                  size={18}
                  inactiveColor={palette.textSecondary}
                />
                {t ? t('popup.subscription.title') : 'Premium Subscription'}&nbsp;(
                {(t ? t('popup.subscription.credits') : 'Credits') +
                  ': $' +
                  (subscriptionStatus?.credits?.limit_remaining ?? 0)}
                )
              </h3>
              {isActive && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    marginTop: '12px',
                    color: palette.textSecondary,
                  }}
                >
                  <span style={{ color: palette.success || '#059669' }}>
                    {isLifetime
                      ? t
                        ? t('popup.subscription.premiumActiveLifetime')
                        : 'Premium Active (Lifetime)'
                      : t
                        ? t('popup.subscription.premiumActiveMonthly')
                        : 'Premium Active (Monthly)'}
                  </span>
                </p>
              )}

              {/* Expiry date */}
              {!!subscriptionStatus?.period_end &&
                subscriptionStatus.period_end !== 0 &&
                !isLifetime && (
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: palette.textSecondary,
                    }}
                  >
                    {(t ? t('popup.subscription.expiresOn') : 'Expires on') +
                      ' ' +
                      formatExpiryDate(subscriptionStatus.period_end)}
                  </p>
                )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {authState.isAuthenticated && (
                <button
                  onClick={handleRefreshSubscription}
                  className="sl-btn sl-btn-secondary"
                  disabled={isRefreshingSubscription}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isRefreshingSubscription ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {t ? t('popup.subscription.refreshStatus') : 'Refresh'}
                </button>
              )}
              <button
                onClick={async () => {
                  setRedeemResult(null);
                  if (!authState.isAuthenticated) {
                    await handleSignIn();
                    if (!authState.isAuthenticated) return;
                  }
                  setRedeemOpen(true);
                }}
                className="sl-btn sl-btn-secondary"
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Gift size={14} />
                {t ? t('popup.subscription.redeemEntry') : 'Redeem Code'}
              </button>
            </div>
          </div>
        </div>

        {
          <>
            {(!authState.isAuthenticated || !isActive) && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '12px',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    border: `1px solid ${palette.border}`,
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: palette.bg || '#ffffff',
                  }}
                >
                  {/* Features section */}
                  <ul
                    style={{
                      margin: '0',
                      paddingLeft: '0',
                      paddingBottom: '6px',
                      listStyle: 'none',
                      fontSize: '13px',
                      color: palette.text,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      columnGap: '12px',
                    }}
                  >
                    <li
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <Check size={12} color={palette.primary} />
                      {t
                        ? t('popup.subscription.featuresModels')
                        : 'Advanced Models Access (pay-as-you-go)'}
                    </li>
                    <li
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <Check size={12} color={palette.primary} />
                      {t
                        ? t('popup.subscription.featuresSync')
                        : 'Unlimited cloud sync across devices'}
                    </li>
                    <li
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <Check size={12} color={palette.primary} />
                      {t ? t('popup.subscription.featuresSupport') : 'Priority customer support'}
                    </li>
                  </ul>

                  <button
                    onClick={() => handleSubscribe('monthly')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: palette.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    {t ? t('popup.subscription.subscribeMonthly') : 'Subscribe Monthly'}
                  </button>
                </div>
              </div>
            )}
          </>
        }
      </div>

      {/* Redeem Drawer */}
      <Drawer
        open={redeemOpen}
        title={t ? t('popup.subscription.redeemTitle') : 'Redeem Membership Code'}
        onClose={() => setRedeemOpen(false)}
      >
        <div style={{ padding: 12 }}>
          {!authState.isAuthenticated && (
            <div
              style={{
                marginBottom: 12,
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.surface,
                padding: 10,
                borderRadius: 8,
                fontSize: 13,
                color: palette.text,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                {t ? t('popup.subscription.loginRequired') : 'Please log in first'}
              </div>
              <button className="sl-btn sl-btn-primary" onClick={handleSignIn} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : t ? (
                  t('popup.subscription.signIn')
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          )}
          <div style={{ marginBottom: 8, fontSize: 13, color: palette.textSecondary }}>
            {t
              ? t('popup.subscription.redeemDesc')
              : 'Enter your redeem code to activate premium membership'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder={t ? t('popup.subscription.redeemPlaceholder') : 'Enter redeem code'}
              style={{
                flex: 1,
                border: `1px solid ${palette.border}`,
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 13,
              }}
              disabled={redeemSubmitting || !authState.isAuthenticated}
            />
            <button
              className="sl-btn sl-btn-primary"
              onClick={handleRedeemSubmit}
              disabled={redeemSubmitting || !redeemCode.trim() || !authState.isAuthenticated}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {redeemSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : t ? (
                t('popup.subscription.redeemSubmit')
              ) : (
                'Redeem'
              )}
            </button>
          </div>

          {redeemResult && (
            <div
              style={{
                marginTop: 12,
                border: `1px solid ${redeemResult.success ? palette.success || '#10b981' : palette.danger || '#ef4444'}`,
                backgroundColor: redeemResult.success ? '#ecfdf5' : '#fef2f2',
                color: palette.text,
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {redeemResult.success ? (
                  <Check size={16} color={palette.success || '#10b981'} />
                ) : (
                  <User size={16} color={palette.danger || '#ef4444'} />
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{redeemResult.message}</div>
                  {redeemResult.grantText && (
                    <div style={{ marginTop: 4, color: palette.textSecondary }}>
                      {redeemResult.grantText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="sl-btn sl-btn-secondary" onClick={() => setRedeemOpen(false)}>
              {t ? t('common.close') : 'Close'}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default SubscriptionManagerV3;
