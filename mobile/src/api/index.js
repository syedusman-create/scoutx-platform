import axios from 'axios'

const API_URL = process.env.API_URL || 'http://localhost:5000'

export const mobileApi = axios.create({
  baseURL: API_URL,
  timeout: 10000
})

const authConfig = (token) => ({
  headers: {
    Authorization: token ? `Bearer ${token}` : undefined
  }
})

export const login = (payload) => mobileApi.post('/api/auth/login', payload)
export const register = (payload) => mobileApi.post('/api/auth/register', payload)

export const getMyAthleteProfile = (token) => mobileApi.get('/api/athletes/me', authConfig(token))
export const updateMyAthleteProfile = (token, updates) => mobileApi.put('/api/athletes/me', updates, authConfig(token))
export const searchAthletes = (token) => mobileApi.get('/api/athletes', authConfig(token))
export const getAthleteProfile = (id, token) => mobileApi.get(`/api/athletes/${id}`, authConfig(token))
export const getAthleteAnalytics = (id, token) => mobileApi.get(`/api/athletes/${id}/analytics`, authConfig(token))

export const getMyClubProfile = (token) => mobileApi.get('/api/clubs/me', authConfig(token))
export const updateMyClubProfile = (token, updates) => mobileApi.put('/api/clubs/me', updates, authConfig(token))
export const listClubShortlists = (token) => mobileApi.get('/api/opportunities/shortlists', authConfig(token))
export const upsertClubShortlist = (token, athleteId, payload) =>
  mobileApi.post(`/api/opportunities/shortlists/${athleteId}`, payload, authConfig(token))

export const getOpportunities = (token) => mobileApi.get('/api/opportunities', authConfig(token))
export const getMyApplications = (token) => mobileApi.get('/api/opportunities/applications/me', authConfig(token))
export const createOpportunity = (token, payload) => mobileApi.post('/api/opportunities', payload, authConfig(token))

export const listPosts = (token) => mobileApi.get('/api/feed', authConfig(token))
export const createPost = (token, data) => mobileApi.post('/api/feed', data, authConfig(token))

export const listMessages = (token) => mobileApi.get('/api/messages/conversations', authConfig(token))
export const getConversation = (token, otherUserId) => mobileApi.get(`/api/messages/conversations/${otherUserId}`, authConfig(token))
export const sendMessage = (token, otherUserId, body) => mobileApi.post(`/api/messages/conversations/${otherUserId}`, { body }, authConfig(token))
export const markConversationRead = (token, otherUserId) => mobileApi.put(`/api/messages/conversations/${otherUserId}/read`, {}, authConfig(token))

export const applyToOpportunity = (token, opportunityId) => mobileApi.post(`/api/opportunities/${opportunityId}/apply`, {}, authConfig(token))

export const getAdminOverview = (token) => mobileApi.get('/api/admin/overview', authConfig(token))
export const getAdminUsers = (token) => mobileApi.get('/api/admin/users', authConfig(token))
export const getAdminAuditLogs = (token) => mobileApi.get('/api/admin/audit-logs', authConfig(token))
export const getIntegrations = (token) => mobileApi.get('/api/integrations', authConfig(token))
export const getSocialPosts = (token) => mobileApi.get('/api/social/posts', authConfig(token))
export const createSocialPost = (token, payload) => mobileApi.post('/api/social/posts', payload, authConfig(token))
export const publishSocialPost = (token, postId) => mobileApi.post(`/api/social/posts/${postId}/publish`, {}, authConfig(token))


