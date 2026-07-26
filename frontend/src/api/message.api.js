import { axiosInstance } from './axios'

export const listConversationsApi = async () => {
  return axiosInstance.get('/api/messages/conversations')
}

export const getConversationApi = async (otherUserId) => {
  return axiosInstance.get(`/api/messages/conversations/${otherUserId}`)
}

export const sendMessageApi = async (otherUserId, body) => {
  return axiosInstance.post(`/api/messages/conversations/${otherUserId}`, { body })
}

export const markConversationReadApi = async (otherUserId) => {
  return axiosInstance.put(`/api/messages/conversations/${otherUserId}/read`)
}

export const searchUsersApi = async (query) => {
  return axiosInstance.get('/api/users/search', { params: { q: query } })
}
