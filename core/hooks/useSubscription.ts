import { useEffect, useMemo, useState } from 'react';

import type { SubscriptionStatus } from '../premium-api-v2';
import SubscriptionServiceV2 from '../services/subscription-service-v2';

export const useSubscription = () => {
  const service = useMemo(() => SubscriptionServiceV2.getInstance(), []);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};
    service.initialize().then(() => {
      unsub = service.subscribe(({ status, loading, error }) => {
        setSubscriptionStatus(status);
        setLoading(loading);
        setError(error);
      });
    });
    return () => unsub();
  }, [service]);

  return {
    subscriptionStatus,
    loading,
    error,
    refetch: () => service.refresh({ force: true }),
  };
};
