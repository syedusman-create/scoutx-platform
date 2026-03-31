import { axiosInstance } from './axios'

export const startIntegrationApi = async (provider) => {
  return axiosInstance.get(`/api/integrations/${provider}/oauth/start`)
}

