import { axiosInstance } from './axios'

export const listOpportunitiesApi = async () => {
  return axiosInstance.get('/api/opportunities')
}

export const applyOpportunityApi = async (opportunityId) => {
  return axiosInstance.post(`/api/opportunities/${opportunityId}/apply`)
}

export const listMyApplicationsApi = async () => {
  return axiosInstance.get('/api/opportunities/applications/me')
}

export const createOpportunityApi = async (data) => {
  return axiosInstance.post('/api/opportunities', data)
}

export const updateOpportunityApi = async (opportunityId, data) => {
  return axiosInstance.put(`/api/opportunities/${opportunityId}`, data)
}

export const deleteOpportunityApi = async (opportunityId) => {
  return axiosInstance.delete(`/api/opportunities/${opportunityId}`)
}
