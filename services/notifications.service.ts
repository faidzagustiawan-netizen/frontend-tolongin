import { apiClient } from './api';

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsService = {
  getMyNotifications: async () => {
    const { data } = await apiClient.get('/notifications');
    return { data };
  },
  markAsRead: async (id: string) => {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return { data };
  },
  markAllAsRead: async () => {
    const { data } = await apiClient.patch('/notifications/read-all');
    return { data };
  },
};
