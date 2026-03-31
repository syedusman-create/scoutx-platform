import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'

import useAuth from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
})

export default function Login() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (values) => {
    setErrorMsg('')
    try {
      const res = await auth.login(values)
      const role = res?.data?.data?.user?.role || auth.user?.role
      if (role === 'club') navigate('/club/dashboard')
      else navigate('/feed')
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || 'Login failed')
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
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 p-10 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-10 w-10 rounded-lg object-cover" />
            <div className="text-white text-2xl font-semibold">ScoutX</div>
          </div>
          <div>
            <div className="text-white text-4xl font-semibold leading-tight max-w-md">Where athletes get found and clubs move faster.</div>
            <div className="mt-4 text-white/70 text-sm max-w-md">Inspired by clean product UX patterns: sharp hierarchy, focused forms, and low-friction actions.</div>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 sm:p-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-9 w-9 rounded-md object-cover" />
            <div className="text-display text-2xl">ScoutX</div>
          </div>
          <div className="mt-4 text-display text-3xl">Welcome back</div>
          <div className="mt-2 text-text2 text-sm">Enter your credentials to continue.</div>

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
                placeholder="••••••••"
              />
              {errors.password ? <div className="text-text3 text-xs mt-1">{errors.password.message}</div> : null}
            </div>

            {errorMsg ? <div className="text-ember text-sm">{errorMsg}</div> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 btn-primary"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-text2 text-sm">
            Don&apos;t have an account?{' '}
            <Link className="text-lime underline" to="/signup">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

