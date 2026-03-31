import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { getAthleteAnalyticsApi } from '../api/athlete.api'
import { axiosInstance } from '../api/axios'

export default function Analytics() {
  const { user } = useAuth()
  const [athleteId, setAthleteId] = useState(null)

  const { data: athlete, isLoading: athleteLoading } = useQuery({
    queryKey: ['my-athlete'],
    queryFn: async () => {
      if (user?.role !== 'athlete') return null
      const res = await axiosInstance.get('/api/athletes/me')
      return res.data.data
    },
    enabled: user?.role === 'athlete'
  })

  const profileId = user?.role === 'athlete' ? athlete?.id : athleteId

  const analyticsQ = useQuery({
    queryKey: ['athlete-analytics', profileId],
    queryFn: async () => {
      if (!profileId) return null
      const res = await getAthleteAnalyticsApi(profileId)
      return res.data.data
    },
    enabled: !!profileId
  })

  useEffect(() => {
    if (athlete?.id) setAthleteId(athlete.id)
  }, [athlete])

  return (
    <div className="flex flex-col gap-4">
      <div className="text-display text-3xl tracking-wide">Analytics</div>
      <div className="text-text2">Profile stats + club performance (Phase 4).</div>

      {user?.role === 'club' && (
        <div className="card p-4">
          <div className="text-text2">View athlete analytics</div>
          <input
            value={athleteId || ''}
            onChange={(e) => setAthleteId(e.target.value)}
            placeholder="Athlete ID"
            className="mt-2 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          />
        </div>
      )}

      {analyticsQ.isLoading ? (
        <div className="card p-4 text-text2">Loading analytics...</div>
      ) : analyticsQ.isError ? (
        <div className="card p-4 text-ember">{analyticsQ.error?.response?.data?.error || 'Failed to load analytics'}</div>
      ) : analyticsQ.data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="text-text2 uppercase text-xs">Total Views</div>
            <div className="text-ember text-3xl font-bold">{analyticsQ.data.totalViews}</div>
          </div>
          <div className="card p-4">
            <div className="text-text2 uppercase text-xs">Views This Week</div>
            <div className="text-ember text-3xl font-bold">{analyticsQ.data.viewsThisWeek}</div>
          </div>
          <div className="card p-4">
            <div className="text-text2 uppercase text-xs">By Role</div>
            <div className="text-text1 text-sm mt-2">
              {Object.entries(analyticsQ.data.byRole || {}).map(([role, count]) => (
                <div key={role}>
                  <span className="font-bold capitalize">{role}:</span> {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-4 text-text2">No analytics available yet.</div>
      )}
    </div>
  )
}


