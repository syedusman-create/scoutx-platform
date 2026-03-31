import { axiosInstance } from './axios'

export const loginApi = async ({ email, password }) => {
  return axiosInstance.post('/api/auth/login', { email, password })
}

export const registerApi = async ({ email, password, role }) => {
  return axiosInstance.post('/api/auth/register', { email, password, role })
}


