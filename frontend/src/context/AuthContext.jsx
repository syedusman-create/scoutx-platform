import React, { createContext, useContext, useMemo, useEffect } from 'react'
import useStore from '../store/useStore'
import { supabase } from '../api/supabase.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const { token, user, setAuth, logout } = useStore()

  useEffect(() => {
    let cancelled = false

    const handleSession = async (session) => {
      if (!session || cancelled) return

      let { data: dbUser } = await supabase
        .from('users')
        .select('role, is_verified, onboarding_completed')
        .eq('id', session.user.id)
        .single()

      // If user was created via Google OAuth and had a role stored before redirect
      if (!dbUser) {
        const storedRole = localStorage.getItem('scoutx:signup_role') || 'athlete'
        localStorage.removeItem('scoutx:signup_role')
        const { data: newUser } = await supabase
          .from('users')
          .insert({ id: session.user.id, email: session.user.email, role: storedRole, onboarding_completed: false })
          .select('role, is_verified, onboarding_completed')
          .single()
        dbUser = newUser
      }

      if (!cancelled) {
        const fullUser = {
          id: session.user.id,
          email: session.user.email,
          role: dbUser?.role || 'athlete',
          is_verified: dbUser?.is_verified || false,
          onboarding_completed: dbUser?.onboarding_completed || false
        }
        setAuth(fullUser, session.access_token)
      }
    }

    // 1. Check for existing session (handles OAuth redirect & page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session)
    })

    // 2. Listen for auth changes going forward
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // For SIGNED_IN from OAuth, also check stored role
        if (event === 'SIGNED_IN') {
          const storedRole = localStorage.getItem('scoutx:signup_role')
          localStorage.removeItem('scoutx:signup_role')
          if (storedRole) {
            // Update role before setting auth
            await supabase.from('users').update({ role: storedRole }).eq('id', session.user.id)
          }
        }
        handleSession(session)
      } else {
        if (!cancelled) logout()
      }
    })

    return () => {
      cancelled = true
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
      signInWithGoogle: async (role) => {
        if (role) {
          localStorage.setItem('scoutx:signup_role', role)
        }
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
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
