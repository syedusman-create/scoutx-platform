import { axiosInstance } from './axios'

export const getAthleteByIdApi = async (id) => {
  return axiosInstance.get(`/api/athletes/${id}`)
}

export const getMyAthleteApi = async () => {
  return axiosInstance.get('/api/athletes/me')
}

export const searchAthletesApi = async (params = {}) => {
  return axiosInstance.get('/api/athletes', { params })
}

export const updateAthleteApi = async ({ id, updates }) => {
  return axiosInstance.put(`/api/athletes/${id}`, updates)
}

export const updateMyAthleteApi = async (updates) => {
  return axiosInstance.put('/api/athletes/me', updates)
}

export const getCareerApi = async (athleteId) => {
  return axiosInstance.get(`/api/careers/${athleteId}`)
}

export const createCareerApi = async (athleteId, data) => {
  return axiosInstance.post(`/api/careers/${athleteId}`, data)
}

export const getFitnessTestsApi = async (athleteId) => {
  return axiosInstance.get(`/api/fitness/athlete/${athleteId}`)
}

export const createFitnessTestApi = async (athleteId, data) => {
  return axiosInstance.post(`/api/fitness/athlete/${athleteId}`, data)
}

export const getAthleteAnalyticsApi = async (athleteId) => {
  return axiosInstance.get(`/api/athletes/${athleteId}/analytics`)
}

