import React, { createContext, useContext, useMemo, useEffect } from 'react'
import useStore from '../store/useStore'
import { supabase } from '../api/supabase.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const { token, user, setAuth, logout } = useStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('role, is_verified, onboarding_completed')
          .eq('id', session.user.id)
          .single()

        const fullUser = {
          id: session.user.id,
          email: session.user.email,
          role: dbUser?.role || 'athlete',
          is_verified: dbUser?.is_verified || false,
          onboarding_completed: dbUser?.onboarding_completed || false
        }
        setAuth(fullUser, session.access_token)
      } else {
        logout()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setAuth, logout])

  const value = useMemo(() => {
    return {
      token,
      user,
      login: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
      },
      signup: async ({ email, password, role }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: email.split('@')[0]
            }
          }
        })
        if (error) throw error
        return data
      },
      logout: async () => {
        await supabase.auth.signOut()
        logout()
      }
    }
  }, [token, user, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
