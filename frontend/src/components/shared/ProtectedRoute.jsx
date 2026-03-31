import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import useAuth from '../../hooks/useAuth'

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles.length > 0) {
    const role = user?.role
    if (!role || !allowedRoles.includes(role)) {
      const fallback = role === 'admin' ? '/admin/erp/overview' : '/feed'
      return <Navigate to={fallback} replace />
    }
  }

  return <Outlet />
}

