import { axiosInstance } from './axios'

export const getAdminOverviewApi = async () => axiosInstance.get('/api/admin/overview')
export const listAdminUsersApi = async (params = {}) => axiosInstance.get('/api/admin/users', { params })
export const updateAdminUserRoleApi = async ({ userId, role }) =>
  axiosInstance.put(`/api/admin/users/${userId}/role`, { role })
export const verifyAthleteApi = async ({ athleteId, is_verified }) =>
  axiosInstance.put(`/api/admin/athletes/${athleteId}/verify`, { age_verified: is_verified })
export const verifyClubApi = async ({ clubId, is_verified }) =>
  axiosInstance.put(`/api/admin/clubs/${clubId}/verify`, { is_verified })
export const listAuditLogsApi = async (params = {}) => axiosInstance.get('/api/admin/audit-logs', { params })

export const listAthletesForAdminApi = async (params = {}) => axiosInstance.get('/api/admin/athletes', { params })
export const listClubsForAdminApi = async (params = {}) => axiosInstance.get('/api/admin/clubs', { params })

