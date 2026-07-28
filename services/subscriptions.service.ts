import { apiClient } from './api';

/**
 * Penyesuaian paket secara manual — khusus admin.
 *
 * Perusahaan meningkatkan paketnya lewat pembayaran Midtrans
 * (`PaymentsService.subscribePremium`), bukan lewat sini.
 */
export interface UpgradeSubscriptionPayload {
  companyId: string;
  tier: 'STARTUP' | 'KONGLOMERAT' | 'CUSTOM';
  durationInMonths?: number;
  reason?: string;
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
