import { axiosInstance } from './axios'

export const listSocialPostsApi = async () => axiosInstance.get('/api/social/posts')
export const createSocialPostApi = async (payload) => axiosInstance.post('/api/social/posts', payload)
export const publishSocialPostApi = async (postId, providers = []) =>
  axiosInstance.post(`/api/social/posts/${postId}/publish`, { providers })
export const listIntegrationsApi = async () => axiosInstance.get('/api/integrations')

