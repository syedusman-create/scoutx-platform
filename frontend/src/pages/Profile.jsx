import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../context/AuthContext.jsx'
import { SPORT_OPTIONS } from '../constants/sports.js'
import { PostCard } from './Feed.jsx'
import { supabase } from '../api/supabase.js'

export default function Profile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState(false)

  const isAthlete = user?.role === 'athlete'
  const isClub = user?.role === 'club'

  const meQ = useQuery({
    queryKey: ['profile-me', user?.role],
    enabled: Boolean(isAthlete || isClub),
    queryFn: async () => {
      if (isAthlete) {
        const { data, error } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (error) throw error
        return data
      }
    }
  })

  const [form, setForm] = useState({})
  useEffect(() => {
    if (!meQ.data) return
    setForm(meQ.data)
    setEditing(false)
  }, [meQ.data])

  const fitnessTestsQ = useQuery({
    queryKey: ['profile-fitness-tests', form?.id],
    enabled: Boolean(isAthlete && form?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fitness_tests')
        .select('*')
        .eq('athlete_id', form.id)
      if (error) throw error
      return data || []
    }
  })

  const myPostsQ = useQuery({
    queryKey: ['my-posts', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          user_id,
          users:user_id (
            email,
            role,
            athlete_profiles (id, full_name, headline),
            club_profiles (id, club_name, league)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error

      return (data || []).map((post) => {
        const authorUser = post.users
        const athleteProfile = authorUser?.athlete_profiles?.[0]
        const clubProfile = authorUser?.club_profiles?.[0]
        return {
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          media_url: post.media_url,
          media_type: post.media_type,
          created_at: post.created_at,
          author_email: authorUser?.email,
          author_role: authorUser?.role,
          author_name: authorUser?.role === 'athlete' ? athleteProfile?.full_name : clubProfile?.club_name,
          author_headline: authorUser?.role === 'athlete' ? athleteProfile?.headline : clubProfile?.league,
          author_athlete_id: athleteProfile?.id,
          author_club_id: clubProfile?.id
        }
      })
    }
  })

  const saveM = useMutation({
    mutationFn: async () => {
      if (isAthlete) {
        const { data, error } = await supabase
          .from('athlete_profiles')
          .update({
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
          .eq('user_id', user.id)
          .select()
        if (error) throw error
        return data[0]
      } else {
        const { data, error } = await supabase
          .from('club_profiles')
          .update({
            club_name: form.club_name || '',
            league: form.league || '',
            city: form.city || '',
            state: form.state || '',
            founded_year: form.founded_year === '' ? null : Number(form.founded_year),
            logo_url: form.logo_url || null,
            bio: form.bio || ''
          })
          .eq('user_id', user.id)
          .select()
        if (error) throw error
        return data[0]
      }
    },
    onSuccess: async () => {
      setMsg('Profile updated successfully')
      await qc.invalidateQueries({ queryKey: ['profile-me', user?.role] })
      await qc.invalidateQueries({ queryKey: ['club-me'] })
      await qc.invalidateQueries({ queryKey: ['athlete-me'] })
    },
    onError: (e) => {
      setMsg(e?.message || 'Failed to update profile')
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

  const testDaysSet = useMemo(() => {
    const set = new Set()
    for (const t of fitnessTestsQ.data || []) {
      if (!t?.tested_at) continue
      const d = new Date(t.tested_at)
      if (Number.isNaN(d.getTime())) continue
      set.add(d.toISOString().slice(0, 10))
    }
    return set
  }, [fitnessTestsQ.data])

  const streak = useMemo(() => {
    if (testDaysSet.size === 0) return 0
    let count = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().slice(0, 10)
      if (!testDaysSet.has(key)) break
      count += 1
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [testDaysSet])

  const recentCalendar = useMemo(() => {
    const out = []
    const start = new Date()
    start.setDate(start.getDate() - 34)
    for (let i = 0; i < 35; i += 1) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      out.push({
        key,
        active: testDaysSet.has(key),
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      })
    }
    return out
  }, [testDaysSet])

  const bestScores = useMemo(() => {
    const best = new Map()
    for (const t of fitnessTestsQ.data || []) {
      const type = String(t.test_type || 'Unknown')
      const score = Number(t.score || 0)
      if (!best.has(type) || score > best.get(type).score) {
        best.set(type, { type, score, unit: t.unit || '', testedAt: t.tested_at })
      }
    }
    return Array.from(best.values()).sort((a, b) => b.score - a.score)
  }, [fitnessTestsQ.data])

  const profileMetric = useMemo(() => {
    const fitness = Number(form?.fitness_score || 0)
    const consistency = Math.min(100, (testDaysSet.size / 35) * 100)
    return Number((fitness * 0.7 + consistency * 0.3).toFixed(2))
  }, [form?.fitness_score, testDaysSet.size])

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
          <div className="flex items-center justify-between gap-3">
            <div className="section-heading mb-0">Profile</div>
            <button type="button" className="btn-ghost text-xs" onClick={() => setEditing((v) => !v)}>
              {editing ? 'View Details' : 'Edit Profile'}
            </button>
          </div>

          {isAthlete ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <MetricTile label="Fitness Score" value={Number(form?.fitness_score || 0)} />
              <MetricTile label="Matches Played" value={form?.total_matches ?? 0} />
              <MetricTile label="Goals / Assists" value={`${form?.total_goals ?? 0} / ${form?.total_assists ?? 0}`} />
            </div>
          ) : null}

          {isAthlete && !editing ? (
            <div className="mt-4 flex flex-col gap-4">
              {/* Competition Performances */}
              <div className="rounded-xl border border-edge bg-background p-4">
                <div className="text-text3 text-xs font-bold uppercase tracking-wider mb-3">Competition Performances</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-raised border border-edge rounded-lg p-3">
                    <div className="text-text3 text-[10px] uppercase font-bold tracking-wide">Total Matches</div>
                    <div className="text-xl font-bold text-text1 mt-1">{form.total_matches ?? 0}</div>
                  </div>
                  <div className="bg-raised border border-edge rounded-lg p-3">
                    <div className="text-text3 text-[10px] uppercase font-bold tracking-wide">Goals Scored</div>
                    <div className="text-xl font-bold text-lime mt-1">{form.total_goals ?? 0}</div>
                  </div>
                  <div className="bg-raised border border-edge rounded-lg p-3">
                    <div className="text-text3 text-[10px] uppercase font-bold tracking-wide">Total Assists</div>
                    <div className="text-xl font-bold text-ice mt-1">{form.total_assists ?? 0}</div>
                  </div>
                  <div className="bg-raised border border-edge rounded-lg p-3">
                    <div className="text-text3 text-[10px] uppercase font-bold tracking-wide">Fitness Rating</div>
                    <div className="text-xl font-bold text-ember mt-1">{form.fitness_score ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Best fitness benchmarks */}
              <div className="rounded-xl border border-edge bg-background p-4">
                <div className="text-text3 text-xs font-bold uppercase tracking-wider mb-2">All-time fitness benchmarks</div>
                {bestScores.length === 0 ? (
                  <div className="text-text2 text-sm mt-1">No fitness tests certified yet.</div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {bestScores.map((b) => (
                      <div key={b.type} className="rounded-lg border border-edge px-3 py-2 flex justify-between items-center bg-raised/30">
                        <div className="text-text1 text-xs font-semibold">{b.type}</div>
                        <div className="text-lime text-xs font-bold">
                          {b.score} {b.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal & Physical Details */}
              <div className="rounded-xl border border-edge bg-background p-4 space-y-3">
                <div className="text-text3 text-xs font-bold uppercase tracking-wider">Profile Details</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-text3 block">Position</span>
                    <span className="text-text1 font-semibold">{form.position || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text3 block">Age</span>
                    <span className="text-text1 font-semibold">
                      {form.date_of_birth ? `${new Date().getFullYear() - new Date(form.date_of_birth).getFullYear()} yrs` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text3 block">Gender</span>
                    <span className="text-text1 font-semibold capitalize">{form.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text3 block">Height / Weight</span>
                    <span className="text-text1 font-semibold">
                      {[form.height_cm ? `${form.height_cm} cm` : null, form.weight_kg ? `${form.weight_kg} kg` : null].filter(Boolean).join(' / ') || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text3 block">Preferred Foot</span>
                    <span className="text-text1 font-semibold capitalize">{form.preferred_foot || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text3 block">Location</span>
                    <span className="text-text1 font-semibold">{[form.city, form.state].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                </div>

                {form.strengths && (
                  <div className="pt-2 border-t border-edge/40">
                    <span className="text-text3 text-xs block mb-1.5 font-bold uppercase">Strengths</span>
                    <div className="flex flex-wrap gap-1.5">
                      {String(form.strengths).split(',').map((s) => (
                        <span key={s.trim()} className="px-2 py-0.5 rounded bg-lime/10 border border-lime/20 text-lime text-[11px] font-semibold">
                          ⚡ {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-edge/40">
                  <span className="text-text3 text-xs block mb-1 font-bold uppercase">Bio</span>
                  <p className="text-text1 text-xs whitespace-pre-wrap">{form.bio || 'No bio added yet.'}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-xl border border-edge bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-text3 text-xs font-bold uppercase tracking-wider">My Posts</div>
              <div className="text-text2 text-xs font-mono">{myPostsQ.data?.length || 0}</div>
            </div>

            {myPostsQ.isLoading ? (
              <div className="mt-3 text-text2 text-sm">Loading your posts…</div>
            ) : myPostsQ.isError ? (
              <div className="mt-3 text-ruby text-sm">
                {myPostsQ.error?.message || 'Failed to load posts'}
              </div>
            ) : (myPostsQ.data || []).length === 0 ? (
              <div className="mt-3 text-text2 text-sm">You have not posted anything yet.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4">
                {myPostsQ.data.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
                      currentUserId: user?.id,
                      queryClient: qc
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {editing ? <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="e.g. Striker / Winger"
                    value={form.position || ''}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    className="input-base"
                    value={form.date_of_birth ? form.date_of_birth.slice(0, 10) : ''}
                    onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Gender</label>
                  <select
                    className="input-base"
                    value={form.gender || ''}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
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
                  <label className="block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5">Key Strengths (comma separated)</label>
                  <input
                    className="input-base"
                    placeholder="e.g. Pace, Finishing, Aerial Duels, High Press"
                    value={form.strengths || ''}
                    onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
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
          </div> : null}

          {msg ? (
            <div className={`mt-4 text-sm ${msg.toLowerCase().includes('fail') ? 'text-ruby' : 'text-lime'}`}>
              {msg}
            </div>
          ) : null}

          {editing ? (
            <button
              type="button"
              onClick={() => saveM.mutate()}
              disabled={saveM.isPending}
              className="mt-6 btn-primary"
            >
              {saveM.isPending ? 'Saving…' : 'Save profile'}
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

function MetricTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-edge bg-background p-3">
      <div className="text-text3 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-text1 text-lg font-semibold mt-1">{value}</div>
      {hint ? <div className="text-text3 text-[11px] mt-1">{hint}</div> : null}
    </div>
  )
}
