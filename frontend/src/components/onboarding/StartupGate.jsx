import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '../../context/AuthContext.jsx'
import { getMyAthleteApi } from '../../api/athlete.api'
import { getMyClubApi } from '../../api/club.api'

export default function StartupGate({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role
  const isAthleteOrClub = role === 'athlete' || role === 'club'

  const scaffoldQ = useQuery({
    queryKey: ['startup-scaffold', role],
    enabled: Boolean(isAthleteOrClub),
    queryFn: async () => {
      if (role === 'athlete') {
        const res = await getMyAthleteApi()
        return res.data?.data || null
      }
      const res = await getMyClubApi()
      return res.data?.data || null
    }
  })

  if (location.pathname === '/startup' && !isAthleteOrClub) {
    return <Navigate to="/feed" replace />
  }

  if (!isAthleteOrClub) {
    return children
  }

  if (scaffoldQ.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-text2">Preparing your profile…</div>
      </div>
    )
  }

  const exists = scaffoldQ.data?.exists
  const needsOnboarding = exists === false
  const onStartupPage = location.pathname === '/startup'

  if (needsOnboarding && !onStartupPage) {
    return <Navigate to="/startup" replace />
  }

  return children
}

