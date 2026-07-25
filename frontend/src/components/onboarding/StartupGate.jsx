import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext.jsx'

export default function StartupGate({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role
  const isAthleteOrClub = role === 'athlete' || role === 'club'

  if (location.pathname === '/startup' && !isAthleteOrClub) {
    return <Navigate to="/feed" replace />
  }

  if (!isAthleteOrClub) {
    return children
  }

  const needsOnboarding = user?.onboarding_completed !== true
  const onStartupPage = location.pathname === '/startup'

  if (needsOnboarding && !onStartupPage) {
    return <Navigate to="/startup" replace />
  }

  if (!needsOnboarding && onStartupPage) {
    return <Navigate to={role === 'club' ? '/club/dashboard' : '/feed'} replace />
  }

  return children
}
