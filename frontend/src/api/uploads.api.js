import { axiosInstance } from './axios'

export const uploadMediaApi = async (file) => {
  const form = new FormData()
  form.append('file', file)
  return axiosInstance.post('/api/uploads/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

