import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../context/AuthContext.jsx'
import { getMyAthleteApi, updateMyAthleteApi } from '../api/athlete.api'
import { getMyClubApi, updateMyClubApi } from '../api/club.api'
import { SPORT_OPTIONS } from '../constants/sports.js'

export default function Profile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [msg, setMsg] = useState('')

  const isAthlete = user?.role === 'athlete'
  const isClub = user?.role === 'club'

  const meQ = useQuery({
    queryKey: ['profile-me', user?.role],
    enabled: Boolean(isAthlete || isClub),
    queryFn: async () => {
      if (isAthlete) {
        const res = await getMyAthleteApi()
        return res.data.data
      }
      const res = await getMyClubApi()
      return res.data.data
    }
  })

  const [form, setForm] = useState({})
  useEffect(() => {
    if (!meQ.data) return
    setForm(meQ.data)
  }, [meQ.data])

  const saveM = useMutation({
    mutationFn: async () => {
      if (isAthlete) {
        return updateMyAthleteApi({
          full_name: form.full_name || '',
          sport: form.sport || 'football',
          position: form.position || '',
          city: form.city || '',
          state: form.state || '',
          preferred_foot: form.preferred_foot || null,
          height_cm: form.height_cm === '' ? null : Number(form.height_cm),
          weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
          headline: form.headline || '',
          bio: form.bio || '',
          avatar_url: form.avatar_url || undefined,
          is_open: Boolean(form.is_open)
        })
      }
      return updateMyClubApi({
        club_name: form.club_name || '',
        league: form.league || '',
        city: form.city || '',
        state: form.state || '',
        founded_year: form.founded_year === '' ? null : Number(form.founded_year),
        logo_url: form.logo_url || null,
        bio: form.bio || ''
      })
    },
    onSuccess: async () => {
      setMsg('Profile updated successfully')
      await qc.invalidateQueries({ queryKey: ['profile-me', user?.role] })
      await qc.invalidateQueries({ queryKey: ['club-me'] })
      await qc.invalidateQueries({ queryKey: ['athlete-me'] })
    },
    onError: (e) => {
      setMsg(e?.response?.data?.error || 'Failed to update profile')
    }
  })

  if (!isAthlete && !isClub) {
    return (
      <div className="bg-lift border border-edge rounded-xl p-6 text-text2">
        Profile is only available for athletes and clubs.
      </div>
    )
  }

  const publicPreview =
    isAthlete && form?.id
      ? { to: `/athletes/${form.id}`, label: 'Preview public athlete profile' }
      : isClub && form?.id
        ? { to: `/clubs/${form.id}`, label: 'Preview public club profile' }
        : null

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="bg-lift border border-edge rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl text-text1 font-semibold tracking-wide" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              My Profile
            </h1>
            <p className="text-text2 text-sm mt-1">
              {isAthlete ? 'How scouts and clubs see you in discovery and feed.' : 'Your club details for athletes and scouts.'}
            </p>
          </div>
          {publicPreview ? (
            <Link
              to={publicPreview.to}
              className="text-sm font-semibold text-lime hover:underline whitespace-nowrap"
            >
              {publicPreview.label} →
            </Link>
          ) : null}
        </div>
      </div>

      {meQ.isLoading ? (
        <div className="bg-lift border border-edge rounded-xl p-6 text-text2 animate-pulse">Loading profile…</div>
      ) : meQ.isError ? (
        <div className="bg-lift border border-ruby/20 rounded-xl p-6 text-ruby">
          {meQ.error?.response?.data?.error || 'Failed to load profile'}
        </div>
      ) : (
        <div className="bg-lift border border-edge rounded-xl p-6">
          <div className="section-heading">Details</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAthlete ? (
              <>
                <div className="md:col-span-2">
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Full name</label>
                  <input
                    className="input-base"
                    placeholder="Your name"
                    value={form.full_name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Sport</label>
                  <select
                    className="input-base"
                    value={form.sport || 'football'}
                    onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))}
                  >
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Position</label>
                  <input
                    className="input-base"
                    placeholder="e.g. Striker"
                    value={form.position || ''}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">City</label>
                  <input
                    className="input-base"
                    value={form.city || ''}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">State</label>
                  <input
                    className="input-base"
                    value={form.state || ''}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Preferred foot</label>
                  <select
                    className="input-base"
                    value={form.preferred_foot || ''}
                    onChange={(e) => setForm((f) => ({ ...f, preferred_foot: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    className="input-base"
                    value={form.height_cm ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    className="input-base"
                    value={form.weight_kg ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Headline</label>
                  <input
                    className="input-base"
                    placeholder="One line under your name"
                    value={form.headline || ''}
                    onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Avatar image URL</label>
                  <input
                    className="input-base"
                    placeholder="https://… (optional)"
                    value={form.avatar_url || ''}
                    onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Bio</label>
                  <textarea
                    className="input-base min-h-[120px] resize-y"
                    placeholder="Playing style, experience, goals…"
                    value={form.bio || ''}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </div>
                <label className="md:col-span-2 inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_open)}
                    onChange={(e) => setForm((f) => ({ ...f, is_open: e.target.checked }))}
                    className="accent-lime w-4 h-4"
                  />
                  <span className="text-text2 text-sm">Open to opportunities</span>
                </label>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Club name</label>
                  <input
                    className="input-base"
                    value={form.club_name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, club_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">League</label>
                  <input
                    className="input-base"
                    value={form.league || ''}
                    onChange={(e) => setForm((f) => ({ ...f, league: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Founded year</label>
                  <input
                    type="number"
                    className="input-base"
                    value={form.founded_year ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, founded_year: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">City</label>
                  <input
                    className="input-base"
                    value={form.city || ''}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">State</label>
                  <input
                    className="input-base"
                    value={form.state || ''}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Logo URL</label>
                  <input
                    className="input-base"
                    value={form.logo_url || ''}
                    onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Bio</label>
                  <textarea
                    className="input-base min-h-[120px] resize-y"
                    value={form.bio || ''}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          {msg ? (
            <div className={`mt-4 text-sm ${msg.toLowerCase().includes('fail') ? 'text-ruby' : 'text-lime'}`}>
              {msg}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending}
            className="mt-6 btn-primary"
          >
            {saveM.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      )}
    </div>
  )
}
