import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../api/supabase.js'
import { SPORT_OPTIONS } from '../constants/sports'

export default function Leaderboards() {
  const [sport, setSport] = React.useState('')

  const lbQ = useQuery({
    queryKey: ['sport-leaderboards', sport],
    queryFn: async () => {
      let query = supabase
        .from('athlete_profiles')
        .select(`
          id,
          full_name,
          sport,
          position,
          city,
          state,
          fitness_score,
          total_goals,
          total_assists
        `)
      
      if (sport) {
        query = query.eq('sport', sport)
      }

      const { data, error } = await query
      if (error) throw error

      const grouped = {}
      ;(data || []).forEach(athlete => {
        const aSport = athlete.sport || 'football'
        if (!grouped[aSport]) {
          grouped[aSport] = []
        }

        const perfScore = (athlete.total_goals || 0) * 3 + (athlete.total_assists || 0) * 2
        const combinedScore = (athlete.fitness_score || 0) + perfScore

        grouped[aSport].push({
          athleteId: athlete.id,
          fullName: athlete.full_name,
          position: athlete.position,
          city: athlete.city,
          state: athlete.state,
          fitnessScore: athlete.fitness_score || 0,
          performanceScore: perfScore,
          leaderboardMetric: combinedScore
        })
      })

      return Object.keys(grouped).map(sportName => {
        const sortedEntries = grouped[sportName]
          .sort((a, b) => b.leaderboardMetric - a.leaderboardMetric)
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1
          }))
        
        return {
          sport: sportName,
          metric: 'Combined Score (Fitness + Stats)',
          entries: sortedEntries
        }
      })
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <div className="text-display text-3xl tracking-wide">Leaderboards</div>
        <div className="text-text2 text-sm mt-1">
          Separate rankings per sport using combined metric (fitness + performance).
        </div>
      </div>

      <div className="card p-5">
        <label className="text-text2 text-xs">Filter sport</label>
        <select
          className="mt-1 input-base max-w-xs"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
        >
          <option value="">All sports</option>
          {SPORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {lbQ.isLoading ? (
        <div className="card p-5 text-text2">Loading leaderboards...</div>
      ) : lbQ.isError ? (
        <div className="card p-5 text-ruby">{lbQ.error?.message || 'Failed to load leaderboards'}</div>
      ) : lbQ.data.length === 0 ? (
        <div className="card p-5 text-text2">No leaderboard entries yet.</div>
      ) : (
        lbQ.data.map((board) => (
          <div key={board.sport} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="text-text1 text-lg font-semibold capitalize">{board.sport}</div>
              <div className="text-text3 text-xs">{board.metric}</div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text3 border-b border-edge">
                    <th className="text-left py-2">#</th>
                    <th className="text-left py-2">Athlete</th>
                    <th className="text-left py-2">Fitness</th>
                    <th className="text-left py-2">Performance</th>
                    <th className="text-left py-2">Metric</th>
                  </tr>
                </thead>
                <tbody>
                  {board.entries.map((e) => (
                    <tr key={`${board.sport}-${e.athleteId}`} className="border-b border-edge/40">
                      <td className="py-2 text-text2">{e.rank}</td>
                      <td className="py-2">
                        <Link to={`/athletes/${e.athleteId}`} className="text-text1 hover:text-lime">
                          {e.fullName}
                        </Link>
                        <div className="text-text3 text-xs">{[e.position, e.city, e.state].filter(Boolean).join(' • ')}</div>
                      </td>
                      <td className="py-2 text-text1">{e.fitnessScore}</td>
                      <td className="py-2 text-text1">{e.performanceScore.toFixed(1)}</td>
                      <td className="py-2 text-lime font-semibold">{e.leaderboardMetric.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
