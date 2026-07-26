import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'

import useAuth from '../hooks/useAuth'
import { supabase } from '../api/supabase.js'
import { resolvePostAuthRoute } from '../utils/authFlow.js'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['athlete', 'club'])
})

export default function Signup() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'athlete'
    }
  })

  const onSubmit = async (values) => {
    setErrorMsg('')
    try {
      const result = await auth.signup(values)
      if (!result?.session?.access_token || !result?.user?.id) {
        setErrorMsg('Account created. Check your email to confirm the signup before logging in.')
        return
      }
      const user = result?.user
      const { data: dbUser } = user
        ? await supabase
            .from('users')
            .select('role, onboarding_completed')
            .eq('id', user.id)
            .single()
        : { data: null }

      navigate(resolvePostAuthRoute(dbUser?.role || values.role, Boolean(dbUser?.onboarding_completed)), { replace: true })
    } catch (e) {
      setErrorMsg(e?.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-edge">
      <div className="hidden lg:flex relative bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          autoPlay
          muted
          loop
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 p-10 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-10 w-10 object-contain" />
            <div className="text-white text-2xl font-semibold">ScoutX</div>
          </div>
          <div>
            <div className="text-white text-4xl font-semibold leading-tight max-w-md">Build your profile. Get verified. Get discovered.</div>
            <div className="mt-4 text-white/70 text-sm max-w-md">Fast onboarding flow with role-based setup for athletes and clubs.</div>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 sm:p-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-9 w-9 object-contain" />
            <div className="text-display text-2xl">ScoutX</div>
          </div>
          <div className="mt-4 text-display text-3xl">Create account</div>
          <div className="mt-2 text-text2 text-sm">Choose your role to get the right experience.</div>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-text2 text-xs">Email</label>
              <input
                {...register('email')}
                className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
                placeholder="you@example.com"
              />
              {errors.email ? <div className="text-text3 text-xs mt-1">{errors.email.message}</div> : null}
            </div>

            <div>
              <label className="text-text2 text-xs">Password</label>
              <input
                {...register('password')}
                type="password"
                className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
                placeholder="Minimum 8 characters"
              />
              {errors.password ? <div className="text-text3 text-xs mt-1">{errors.password.message}</div> : null}
            </div>

            <div>
              <label className="text-text2 text-xs">Role</label>
              <select
                {...register('role')}
                className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
              >
                <option value="athlete">Athlete</option>
                <option value="club">Club</option>
              </select>
              {errors.role ? <div className="text-text3 text-xs mt-1">{errors.role.message}</div> : null}
            </div>

            {errorMsg ? <div className="text-ember text-sm">{errorMsg}</div> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 btn-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create account'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-edge/40" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-3 text-text3 text-xs">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => auth.signInWithGoogle(watch('role'))}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-edge bg-raised/50 px-4 py-2.5 text-text1 text-sm font-semibold hover:bg-raised hover:border-line transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <div className="mt-4 text-text2 text-sm">
            Already have an account?{' '}
            <Link className="text-lime underline" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
