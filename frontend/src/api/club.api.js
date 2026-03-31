import { axiosInstance } from './axios'

export const discoverAthletesApi = async (params = {}) => {
  return axiosInstance.get('/api/athletes', { params })
}

export const getMyClubApi = async () => {
  return axiosInstance.get('/api/clubs/me')
}

export const getClubByIdApi = async (clubId) => {
  return axiosInstance.get(`/api/clubs/${clubId}`)
}

export const updateMyClubApi = async (updates) => {
  return axiosInstance.put('/api/clubs/me', updates)
}

export const listShortlistsApi = async () => {
  return axiosInstance.get('/api/opportunities/shortlists')
}

export const upsertShortlistApi = async ({ athleteId, stage, notes }) => {
  return axiosInstance.post(`/api/opportunities/shortlists/${athleteId}`, { stage, notes })
}


