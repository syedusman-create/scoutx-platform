import { useQuery } from '@tanstack/react-query'

import { getAthleteByIdApi, getCareerApi, getFitnessTestsApi } from '../api/athlete.api'

export const useAthleteProfile = (athleteId) => {
  return useQuery({
    queryKey: ['athlete', athleteId],
    enabled: Boolean(athleteId),
    queryFn: async () => {
      const res = await getAthleteByIdApi(athleteId)
      return res.data.data
    }
  })
}

export const useAthleteCareer = (athleteId) => {
  return useQuery({
    queryKey: ['career', athleteId],
    enabled: Boolean(athleteId),
    queryFn: async () => {
      const res = await getCareerApi(athleteId)
      return res.data.data
    }
  })
}

export const useAthleteFitness = (athleteId) => {
  return useQuery({
    queryKey: ['fitness', athleteId],
    enabled: Boolean(athleteId),
    queryFn: async () => {
      const res = await getFitnessTestsApi(athleteId)
      return res.data.data
    }
  })
}

export default function useAthletes() {
  return {}
}

