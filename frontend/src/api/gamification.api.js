import { axiosInstance } from './axios'

export const listChallengesApi = async () => axiosInstance.get('/api/challenges')
export const createChallengeApi = async (payload) => axiosInstance.post('/api/challenges', payload)
export const joinChallengeApi = async (challengeId) => axiosInstance.post(`/api/challenges/${challengeId}/join`)
export const leaveChallengeApi = async (challengeId) => axiosInstance.post(`/api/challenges/${challengeId}/leave`)
export const listMyChallengeProgressApi = async () => axiosInstance.get('/api/challenges/me')

export const listLeaderboardsApi = async (params = {}) => axiosInstance.get('/api/leaderboards', { params })
export const listSportLeaderboardsApi = async (params = {}) => axiosInstance.get('/api/leaderboards/sports', { params })

export const listAchievementsApi = async () => axiosInstance.get('/api/achievements')
export const listMyAchievementsApi = async () => axiosInstance.get('/api/achievements/me')
