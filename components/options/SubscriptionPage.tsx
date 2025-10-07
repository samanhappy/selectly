/**
 * SubscriptionPage Component
 * Single responsibility: Display subscription status and management
 */

import React from 'react';

import { PALETTE } from './constants';
import SubscriptionManagerV3 from './SubscriptionManagerV3';
import { SubscriptionStatus } from './SubscriptionStatus';

export const SubscriptionPage: React.FC = () => {
  return (
    <div style={{ padding: '12px', background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <SubscriptionStatus style={PALETTE} />
      <SubscriptionManagerV3 palette={PALETTE} />
    </div>
  );
};
