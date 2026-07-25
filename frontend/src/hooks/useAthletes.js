import { useQuery } from '@tanstack/react-query'
import { supabase } from '../api/supabase.js'

export const useAthleteProfile = (athleteId) => {
  return useQuery({
    queryKey: ['athlete', athleteId],
    enabled: Boolean(athleteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('id', athleteId)
        .single()
      
      if (error) throw error
      return data
    }
  })
}

export const useAthleteCareer = (athleteId) => {
  return useQuery({
    queryKey: ['career', athleteId],
    enabled: Boolean(athleteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('career_entries')
        .select('*')
        .eq('athlete_id', athleteId)
      
      if (error) throw error
      return data || []
    }
  })
}

export const useAthleteFitness = (athleteId) => {
  return useQuery({
    queryKey: ['fitness', athleteId],
    enabled: Boolean(athleteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fitness_tests')
        .select('*')
        .eq('athlete_id', athleteId)
      
      if (error) throw error
      return data || []
    }
  })
}

export default function useAthletes() {
  return {}
}

