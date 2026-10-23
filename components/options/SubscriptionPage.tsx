/**
 * SubscriptionPage Component
 * Single responsibility: Display subscription status and management
 */

import React from 'react';

import { isCloudEnabled } from '../../core/config/cloud-services';
import { PALETTE } from './constants';
import SubscriptionManagerV3 from './SubscriptionManagerV3';
import { SubscriptionStatus } from './SubscriptionStatus';

export const SubscriptionPage: React.FC = () => {
  if (!isCloudEnabled()) return null;
  return (
    <div style={{ padding: '12px', background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <SubscriptionStatus style={PALETTE} />
      <SubscriptionManagerV3 palette={PALETTE} />
    </div>
  );
};
