import React, { createContext, useContext, useMemo } from 'react'

import useStore from '../store/useStore'
import { loginApi, registerApi } from '../api/auth.api'

const AuthContext = createContext(null)

const decodeJwtRole = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload?.role || null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const { token, user, setAuth, logout } = useStore()

  const value = useMemo(() => {
    return {
      token,
      user,
      login: async ({ email, password }) => {
        const res = await loginApi({ email, password })
        const { token: nextToken, user: nextUser } = res.data.data
        setAuth(nextUser, nextToken)
        return res
      },
      signup: async ({ email, password, role }) => {
        await registerApi({ email, password, role })
        const resLogin = await loginApi({ email, password })
        const { token: nextToken, user: nextUser } = resLogin.data.data
        setAuth(nextUser, nextToken)
        return resLogin
      },
      logout
    }
  }, [logout, setAuth, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext

