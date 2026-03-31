import axios from 'axios'
import useStore from '../store/useStore'

const envApiUrl = (import.meta.env.VITE_API_URL || '').trim()
const API_URL = envApiUrl
  ? (/^:\d+$/.test(envApiUrl) ? `http://localhost${envApiUrl}` : envApiUrl)
  : 'http://localhost:5000'

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

axiosInstance.interceptors.request.use((config) => {
  const { token } = useStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

