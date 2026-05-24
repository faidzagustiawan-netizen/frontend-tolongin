import { apiClient } from './api';

export interface UpgradeSubscriptionPayload {
  tier: 'STARTUP' | 'KONGLOMERAT' | 'CUSTOM';
  durationInMonths?: number;
}

export const subscriptionsService = {
  getStatus: async () => {
    const { data } = await apiClient.get('/subscriptions/status');
    return { data };
  },
  upgrade: async (payload: UpgradeSubscriptionPayload) => {
    const { data } = await apiClient.post('/subscriptions/upgrade', payload);
    return { data };
  },
};
