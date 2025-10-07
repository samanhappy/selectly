import { AlertTriangle, Loader2 } from 'lucide-react';
import React from 'react';

import { useI18n } from '../../core/i18n/hooks/useI18n';
import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';

interface SubscriptionStatusProps {
  style?: {
    bg: string;
    surface: string;
    text: string;
    primary: string;
    success: string;
    warning: string;
    border: string;
    textSecondary: string;
    successSoft: string;
  };
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ style }) => {
  const { t } = useI18n();
  const service = SubscriptionServiceV2.getInstance();
  const [state, setState] = React.useState(() => service.getCurrentState());

  React.useEffect(() => {
    let unsub = () => {};
    service.initialize().then(() => {
      unsub = service.subscribe((s) => setState(s));
    });
    return () => unsub();
  }, [service]);

  const subscriptionStatus = state.status;
  const loading = state.loading;
  const error = state.error;

  if (!process.env.PLASMO_PUBLIC_API_URI) {
    return null;
  }

  if (error && !subscriptionStatus?.active) {
    return (
      <div
        style={{
          padding: '12px',
          backgroundColor: style?.surface || '#ffffff',
          border: `1px solid ${style?.border || '#e5e7eb'}`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <AlertTriangle size={16} color={style?.warning || '#f59e0b'} />
        <span
          style={{
            fontSize: '14px',
            color: style?.textSecondary || '#6b7280',
          }}
        >
          {t('popup.subscription.cannotVerify')}
        </span>
      </div>
    );
  }

  return null;
};
