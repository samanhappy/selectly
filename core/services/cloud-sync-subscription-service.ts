/**
 * Cloud Sync Subscription Extensions
 * Adds cloud sync tier checking to existing subscription service
 */

import SubscriptionServiceV2 from './subscription-service-v2';

export interface CloudSyncSubscription {
  active: boolean;
  tier: 'free' | 'cloud_monthly' | 'cloud_yearly' | 'pro_onetime';
  features: {
    cloudSync: boolean;
    maxDevices: number;
    dataRetention: number; // days, -1 for indefinite
  };
  period_end?: number;
}

/**
 * Extended subscription service with cloud sync support
 */
export class CloudSyncSubscriptionService {
  private static instance: CloudSyncSubscriptionService;
  private subscriptionService: SubscriptionServiceV2;

  private constructor() {
    this.subscriptionService = SubscriptionServiceV2.getInstance();
  }

  static getInstance(): CloudSyncSubscriptionService {
    if (!CloudSyncSubscriptionService.instance) {
      CloudSyncSubscriptionService.instance = new CloudSyncSubscriptionService();
    }
    return CloudSyncSubscriptionService.instance;
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    await this.subscriptionService.initialize();
  }

  /**
   * Determine subscription tier from interval
   */
  private determineTier(interval: string): CloudSyncSubscription['tier'] {
    switch (interval) {
      case 'month':
        return 'cloud_monthly';
      case 'year':
        return 'cloud_yearly';
      case 'one-time':
        return 'pro_onetime';
      default:
        return 'free';
    }
  }

  /**
   * Get features for a subscription tier
   */
  private getFeaturesForTier(
    tier: CloudSyncSubscription['tier']
  ): CloudSyncSubscription['features'] {
    switch (tier) {
      case 'cloud_monthly':
        return {
          cloudSync: true,
          maxDevices: 3,
          dataRetention: 30, // 30 days
        };
      case 'cloud_yearly':
        return {
          cloudSync: true,
          maxDevices: -1, // unlimited
          dataRetention: -1, // indefinite
        };
      case 'pro_onetime':
        // Legacy one-time purchase - no cloud sync
        return {
          cloudSync: false,
          maxDevices: 0,
          dataRetention: 0,
        };
      case 'free':
      default:
        return {
          cloudSync: false,
          maxDevices: 0,
          dataRetention: 0,
        };
    }
  }
}

export const cloudSyncSubscriptionService = CloudSyncSubscriptionService.getInstance();
