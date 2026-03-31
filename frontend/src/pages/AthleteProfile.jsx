import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import ProfileHero from '../components/athlete/ProfileHero.jsx'
import CareerTimeline from '../components/athlete/CareerTimeline.jsx'
import FitnessPanel from '../components/athlete/FitnessPanel.jsx'
import SkillsPanel from '../components/athlete/SkillsPanel.jsx'
import HighlightReel from '../components/athlete/HighlightReel.jsx'

import { useAthleteCareer, useAthleteFitness, useAthleteProfile } from '../hooks/useAthletes'
import useAuth from '../hooks/useAuth'
import { updateMyAthleteApi } from '../api/athlete.api'

// ── Skeleton ──────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-lift border border-edge rounded-xl overflow-hidden">
        <div className="h-40 bg-edge" />
        <div className="px-6 pb-6 -mt-8 space-y-3">
          <div className="w-20 h-20 rounded-full bg-edge border-4 border-background" />
          <div className="h-5 bg-edge rounded w-1/3" />
          <div className="h-3 bg-edge rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-lift border border-edge rounded-xl p-4">
            <div className="h-7 bg-edge rounded w-1/2 mx-auto" />
            <div className="h-2 bg-edge rounded w-3/4 mx-auto mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stats strip ───────────────────────────────────────────────
function StatStrip({ athlete }) {
  const stats = [
    { label: 'Matches', value: athlete?.total_matches ?? '—', color: 'text-text1' },
    { label: 'Goals', value: athlete?.total_goals ?? '—', color: 'text-lime' },
    { label: 'Assists', value: athlete?.total_assists ?? '—', color: 'text-text1' },
    { label: 'Fitness', value: athlete?.fitness_score ? `${athlete.fitness_score}` : '—', color: 'text-ember' },
  ]
  return (
    <div className="grid grid-cols-4 gap-0 bg-lift border border-edge rounded-xl overflow-hidden">
      {stats.map((s, i) => (
        <div key={s.label} className={`px-4 py-4 text-center ${i < 3 ? 'border-r border-edge' : ''}`}>
          <div className={`text-3xl font-bold leading-none ${s.color}`} style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            {s.value}
          </div>
          <div className="text-text3 text-xs font-semibold tracking-widest uppercase mt-1.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Detail row ────────────────────────────────────────────────
function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <>
      <div className="text-text3 text-xs font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-text1 text-sm">{value}</div>
    </>
  )
}

// ── Edit modal ────────────────────────────────────────────────
function EditModal({ athlete, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({
    full_name: athlete?.full_name || '',
    position: athlete?.position || '',
    city: athlete?.city || '',
    state: athlete?.state || '',
    preferred_foot: athlete?.preferred_foot || '',
    height_cm: athlete?.height_cm ?? '',
    weight_kg: athlete?.weight_kg ?? '',
    headline: athlete?.headline || '',
    bio: athlete?.bio || '',
    is_open: Boolean(athlete?.is_open)
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    onSave({
      ...form,
      height_cm: form.height_cm === '' ? null : Number(form.height_cm),
      weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
      preferred_foot: form.preferred_foot || null
    })
  }

  const inputCls = 'w-full rounded-lg bg-raise border border-edge px-3 py-2.5 text-text1 text-sm outline-none focus:border-lime/60 transition-colors placeholder:text-text3'
  const labelCls = 'block text-text3 text-xs font-semibold uppercase tracking-wide mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-edge rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge sticky top-0 bg-surface z-10">
          <div className="text-text1 font-bold text-lg" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
            Edit Profile
          </div>
          <button onClick={onClose} className="text-text3 hover:text-text1 transition-colors text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} placeholder="Your full name" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Headline</label>
            <input className={inputCls} placeholder="e.g. Central Midfielder · FC Hyderabad B" value={form.headline} onChange={e => set('headline', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <input className={inputCls} placeholder="e.g. Striker" value={form.position} onChange={e => set('position', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Preferred Foot</label>
            <select className={inputCls} value={form.preferred_foot} onChange={e => set('preferred_foot', e.target.value)}>
              <option value="">Select</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input className={inputCls} placeholder="Telangana" value={form.state} onChange={e => set('state', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Height (cm)</label>
            <input type="number" className={inputCls} placeholder="175" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Weight (kg)</label>
            <input type="number" className={inputCls} placeholder="70" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Bio</label>
            <textarea
              className={`${inputCls} min-h-[100px] resize-none`}
              placeholder="Tell clubs and scouts about your playing style, experience, and goals…"
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => set('is_open', !form.is_open)}
                className={[
                  'w-11 h-6 rounded-full transition-all duration-200 relative flex-shrink-0',
                  form.is_open ? 'bg-lime' : 'bg-edge'
                ].join(' ')}
              >
                <div className={[
                  'absolute top-1 w-4 h-4 rounded-full bg-background shadow transition-all duration-200',
                  form.is_open ? 'left-6' : 'left-1'
                ].join(' ')} />
              </div>
              <div>
                <div className="text-text1 text-sm font-semibold">Open to Opportunities</div>
                <div className="text-text3 text-xs">Scouts and clubs can see you're available</div>
              </div>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-edge flex gap-3 justify-end sticky bottom-0 bg-surface">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text2 text-sm font-semibold hover:text-text1 hover:bg-lift transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-lime text-background text-sm font-bold tracking-wide uppercase hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function AthleteProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null) // { type: 'success'|'error', text }

  const profileQ = useAthleteProfile(id)
  const careerQ = useAthleteCareer(id)
  const fitnessQ = useAthleteFitness(id)

  const athlete = profileQ.data
  const canEdit = Boolean(user?.role === 'athlete' && athlete?.user_id && user?.id === athlete?.user_id)
  const canMessage = !canEdit && athlete?.user_id

  const saveM = useMutation({
    mutationFn: updateMyAthleteApi,
    onSuccess: async () => {
      setSaveMsg({ type: 'success', text: 'Profile updated!' })
      setEditOpen(false)
      await qc.invalidateQueries({ queryKey: ['athlete', id] })
      await qc.invalidateQueries({ queryKey: ['athlete-me'] })
      setTimeout(() => setSaveMsg(null), 3000)
    },
    onError: (e) => {
      setSaveMsg({ type: 'error', text: e?.response?.data?.error || 'Save failed' })
      setTimeout(() => setSaveMsg(null), 4000)
    }
  })

  if (profileQ.isLoading) return <ProfileSkeleton />

  if (profileQ.isError) {
    return (
      <div className="bg-lift border border-edge rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">😕</div>
        <div className="text-text1 font-semibold">Profile not found</div>
        <div className="text-text2 text-sm mt-1">{profileQ.error?.response?.data?.error || 'This athlete profile could not be loaded.'}</div>
        <button onClick={() => navigate(-1)} className="mt-4 text-lime text-sm underline">← Go back</button>
      </div>
    )
  }

  return (
    <>
      {/* Toast notification */}
      {saveMsg && (
        <div className={[
          'fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border text-sm font-semibold shadow-2xl',
          'transition-all duration-300 animate-fade-up',
          saveMsg.type === 'success'
            ? 'bg-lift border-lime/30 text-lime'
            : 'bg-lift border-ruby/30 text-ruby'
        ].join(' ')}>
          {saveMsg.type === 'success' ? '✓ ' : '✕ '}{saveMsg.text}
        </div>
      )}

      {/* Edit modal */}
      {editOpen && (
        <EditModal
          athlete={athlete}
          onClose={() => setEditOpen(false)}
          onSave={saveM.mutate}
          isSaving={saveM.isPending}
        />
      )}

      <div className="flex flex-col gap-4">

        {/* Hero */}
        <ProfileHero athlete={athlete} />

        {/* Action bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {canEdit && (
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 rounded-lg bg-lime text-background text-sm font-bold tracking-wide uppercase hover:brightness-110 transition-all"
            >
              Edit Profile
            </button>
          )}
          {canMessage && (
            <Link
              to={`/messages?user=${athlete.user_id}`}
              className="px-4 py-2 rounded-lg bg-lift border border-edge text-text1 text-sm font-semibold hover:border-line transition-all flex items-center gap-2"
            >
              💬 Message
            </Link>
          )}
          {!canEdit && (
            <button className="px-4 py-2 rounded-lg bg-lift border border-edge text-text1 text-sm font-semibold hover:border-line transition-all flex items-center gap-2">
              + Connect
            </button>
          )}
          {athlete?.is_open && (
            <div className="ml-auto flex items-center gap-1.5 text-lime text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse inline-block" />
              Open to Opportunities
            </div>
          )}
        </div>

        {/* Stats strip */}
        <StatStrip athlete={athlete} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          {/* Left: career + highlights */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* About */}
            {athlete?.bio && (
              <div className="bg-lift border border-edge rounded-xl p-5">
                <div className="text-text3 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-lime inline-block" />
                  About
                </div>
                <p className="text-text1 text-sm leading-relaxed">{athlete.bio}</p>
              </div>
            )}

            <CareerTimeline entries={careerQ.data || []} isLoading={careerQ.isLoading} />
            <HighlightReel />
          </div>

          {/* Right: fitness + skills + details */}
          <div className="flex flex-col gap-4">

            {/* Details card */}
            <div className="bg-lift border border-edge rounded-xl p-5">
              <div className="text-text3 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-lime inline-block" />
                Details
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <DetailRow label="Position" value={athlete?.position} />
                <DetailRow label="Foot" value={athlete?.preferred_foot} />
                <DetailRow
                  label="Height"
                  value={athlete?.height_cm ? `${athlete.height_cm} cm` : null}
                />
                <DetailRow
                  label="Weight"
                  value={athlete?.weight_kg ? `${athlete.weight_kg} kg` : null}
                />
                <DetailRow
                  label="Location"
                  value={[athlete?.city, athlete?.state].filter(Boolean).join(', ') || null}
                />
                {athlete?.age_verified && (
                  <>
                    <div className="text-text3 text-xs font-semibold uppercase tracking-wide">Age</div>
                    <div className="text-text1 text-sm flex items-center gap-1.5">
                      {athlete.date_of_birth
                        ? new Date().getFullYear() - new Date(athlete.date_of_birth).getFullYear()
                        : '—'}
                      <span className="tag-lime text-[9px] px-1 py-0.5">✓ Verified</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <FitnessPanel
              fitnessScore={athlete?.fitness_score || 0}
              tests={fitnessQ.data || []}
              isLoading={fitnessQ.isLoading}
            />
            <SkillsPanel skills={[]} />
          </div>
        </div>
      </div>
    </>
  )
}