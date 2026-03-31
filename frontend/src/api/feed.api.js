import { axiosInstance } from './axios'

export const listPostsApi = async () => {
  return axiosInstance.get('/api/feed')
}

export const createPostApi = async (data) => {
  return axiosInstance.post('/api/feed', data)
}
