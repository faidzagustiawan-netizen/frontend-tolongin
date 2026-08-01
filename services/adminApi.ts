import { apiClient } from './api';

/**
 * Satu-satunya pintu ke endpoint /admin.
 *
 * Kesepuluh halaman admin dulu memanggil `fetch` mentah dengan
 * `readAuthToken()` sendiri-sendiri. Akibatnya seluruh perilaku yang dipasang
 * di `apiClient` tidak pernah berlaku di sana: 401 tidak memicu
 * `setSessionExpiredHandler`, sehingga token yang kedaluwarsa hanya
 * menampilkan tabel kosong tanpa penjelasan, dan galat lain berhenti di
 * `console.error` yang tidak dilihat siapa pun.
 */

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type AdminRole = 'TALENT' | 'COMPANY' | 'ADMIN';
export type AnnouncementType = 'INFO' | 'WARNING' | 'SUCCESS' | 'MAINTENANCE';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
}

const unwrap = async <T>(promise: Promise<{ data: T }>): Promise<T> =>
  (await promise).data;

export const adminApi = {
  // --- Dasbor ---
  getStats: () => unwrap<any>(apiClient.get('/admin/stats')),
  getAnalytics: () => unwrap<any>(apiClient.get('/admin/analytics')),
  getBilling: () => unwrap<any[]>(apiClient.get('/admin/billing')),
  getAuditLogs: () => unwrap<any[]>(apiClient.get('/admin/audit-logs')),

  // --- Verifikasi perusahaan ---
  getPendingCompanies: () =>
    unwrap<any[]>(apiClient.get('/admin/companies/pending')),
  verifyCompany: (companyId: string, status: 'VERIFIED' | 'FAILED', reason?: string) =>
    unwrap<any>(
      apiClient.post(`/admin/companies/${companyId}/verify`, { status, reason }),
    ),

  // --- Pengguna ---
  getUsers: (params: AdminListParams & { role?: AdminRole } = {}) =>
    unwrap<Paginated<any>>(apiClient.get('/admin/users', { params })),
  toggleBanUser: (userId: string, isBanned: boolean, reason?: string) =>
    unwrap<any>(apiClient.patch(`/admin/users/${userId}/ban`, { isBanned, reason })),
  sendWarning: (userId: string, message: string) =>
    unwrap<any>(apiClient.post(`/admin/users/${userId}/warning`, { message })),

  // --- Tinjauan identitas ---
  getIdentityReviews: () =>
    unwrap<any[]>(apiClient.get('/admin/identity-reviews')),
  resolveIdentityReview: (talentId: string, approve: boolean, note?: string) =>
    unwrap<any>(
      apiClient.post(`/admin/identity-reviews/${talentId}`, { approve, note }),
    ),

  // --- Moderasi studi kasus ---
  getChallenges: (params: AdminListParams = {}) =>
    unwrap<Paginated<any>>(apiClient.get('/admin/challenges', { params })),
  /**
   * Menurunkan studi kasus. Bukan DELETE: submisi dan portofolio talenta yang
   * sudah terbit tetap tersimpan, hanya studi kasusnya yang ditutup dan
   * ditandai.
   */
  takedownChallenge: (challengeId: string, reason: string) =>
    unwrap<any>(
      apiClient.post(`/admin/challenges/${challengeId}/takedown`, { reason }),
    ),
  restoreChallenge: (challengeId: string) =>
    unwrap<any>(apiClient.post(`/admin/challenges/${challengeId}/restore`)),

  // --- Pengumuman (CMS) ---
  getAnnouncements: (params: AdminListParams = {}) =>
    unwrap<Paginated<any>>(apiClient.get('/admin/announcements', { params })),
  createAnnouncement: (payload: {
    title: string;
    content: string;
    type?: AnnouncementType;
    isActive?: boolean;
    expiresAt?: string | null;
  }) => unwrap<any>(apiClient.post('/admin/announcements', payload)),
  deleteAnnouncement: (id: string) =>
    unwrap<any>(apiClient.delete(`/admin/announcements/${id}`)),

  // --- Tiket bantuan ---
  getTickets: (params: AdminListParams & { status?: TicketStatus } = {}) =>
    unwrap<Paginated<any>>(apiClient.get('/admin/tickets', { params })),
  getTicketReplies: (ticketId: string) =>
    unwrap<any[]>(apiClient.get(`/admin/tickets/${ticketId}/replies`)),
  replyToTicket: (ticketId: string, message: string) =>
    unwrap<any>(apiClient.post(`/admin/tickets/${ticketId}/replies`, { message })),
  closeTicket: (ticketId: string) =>
    unwrap<any>(apiClient.patch(`/admin/tickets/${ticketId}/close`)),
};

/** Endpoint publik, dipakai spanduk pengumuman di seluruh aplikasi. */
export const announcementsApi = {
  listActive: () =>
    unwrap<
      Array<{
        id: string;
        title: string;
        content: string;
        type: AnnouncementType;
        createdAt: string;
        expiresAt: string | null;
      }>
    >(apiClient.get('/announcements')),
};

/** Sisi pengguna dari tiket bantuan. */
export const supportApi = {
  createTicket: (payload: { subject: string; description: string }) =>
    unwrap<any>(apiClient.post('/support/tickets', payload)),
  listMyTickets: () => unwrap<any[]>(apiClient.get('/support/tickets')),
  getMyTicket: (id: string) => unwrap<any>(apiClient.get(`/support/tickets/${id}`)),
  replyToMyTicket: (id: string, message: string) =>
    unwrap<any>(apiClient.post(`/support/tickets/${id}/replies`, { message })),
};

/**
 * Pesan galat yang layak ditampilkan.
 *
 * Interceptor `apiClient` menolak dengan `error.response.data`, jadi bentuk
 * galat Nest (`{ message: string | string[] }`) sampai apa adanya — termasuk
 * larik pesan dari `ValidationPipe`.
 */
export const apiErrorMessage = (error: any, fallback: string): string => {
  const message = error?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return fallback;
};
