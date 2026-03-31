import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '../context/AuthContext.jsx'
import { getMyAthleteApi, updateMyAthleteApi, createCareerApi, createFitnessTestApi } from '../api/athlete.api'
import { getMyClubApi, updateMyClubApi } from '../api/club.api'
import { SPORT_OPTIONS } from '../constants/sports.js'

const getRedirectPath = (role) => (role === 'club' ? '/club/dashboard' : '/feed')

const calcAge = (dob) => {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age >= 0 ? age : null
}

const toDateInputValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
    return ''
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

const fitnessTestTypes = [
  { value: 'Sprint 40m', label: 'Sprint 40m (seconds)' },
  { value: 'VO2 Max', label: 'VO2 Max (ml/kg/min)' },
  { value: 'Illinois Agility', label: 'Illinois Agility (seconds)' },
  { value: 'Vertical Jump', label: 'Vertical Jump (cm)' },
  { value: 'Yo-Yo Test', label: 'Yo-Yo Test (level/value)' }
]

export default function Startup() {
  const { user } = useAuth()
  const role = user?.role
  const navigate = useNavigate()
  const location = useLocation()

  const scaffoldQ = useQuery({
    queryKey: ['startup-page-scaffold', role],
    enabled: role === 'athlete' || role === 'club',
    queryFn: async () => {
      if (role === 'athlete') return (await getMyAthleteApi()).data?.data
      return (await getMyClubApi()).data?.data
    }
  })

  const [step, setStep] = React.useState(0)
  const [savingBasics, setSavingBasics] = React.useState(false)
  const [submittingAll, setSubmittingAll] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState('')

  const [athleteId, setAthleteId] = React.useState(null)
  const [clubSaved, setClubSaved] = React.useState(false)

  const scaffold = scaffoldQ.data || null
  const isReady = Boolean(role && scaffold)

  React.useEffect(() => {
    if (!scaffoldQ.data) return
    if (scaffoldQ.data.exists) {
      const redirectPath = getRedirectPath(role)
      if (location.pathname !== redirectPath) navigate(redirectPath, { replace: true })
    }
  }, [scaffoldQ.data, navigate, role, location.pathname])

  React.useEffect(() => {
    if (!isReady) return
    if (role === 'athlete') setAthleteForm(buildAthleteDefaults(scaffold))
    else setClubForm(buildClubDefaults(scaffold))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  const [athleteForm, setAthleteForm] = React.useState(null)
  const [clubForm, setClubForm] = React.useState(null)

  const steps = role === 'club' ? ['Basics', 'Review'] : ['Basics', 'History', 'Fitness', 'Review']

  const [careerEntries, setCareerEntries] = React.useState([])
  const [fitnessTests, setFitnessTests] = React.useState([])

  const canProceed = React.useMemo(() => {
    if (!athleteForm && role === 'athlete') return false
    if (!clubForm && role === 'club') return false
    if (step === 0) {
      if (role === 'club') return Boolean(clubForm?.club_name && clubForm?.league && clubForm?.city && clubForm?.state)
      return Boolean(
        athleteForm?.full_name &&
          athleteForm?.sport &&
          athleteForm?.date_of_birth
      )
    }
    return true
  }, [athleteForm, clubForm, role, step])

  const onSaveBasics = async () => {
    setErrorMsg('')
    if (!athleteForm && role === 'athlete') return
    if (!clubForm && role === 'club') return
    setSavingBasics(true)
    try {
      if (role === 'athlete') {
        const payload = sanitizeAthletePayload(athleteForm)
        const resp = await updateMyAthleteApi(payload)
        const next = resp.data?.data
        if (!next?.id) throw new Error('Athlete profile was not created.')
        setAthleteId(next.id)
      } else {
        const payload = sanitizeClubPayload(clubForm)
        await updateMyClubApi(payload)
        setClubSaved(true)
      }
      setStep((s) => s + 1)
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || e?.message || 'Unable to save basics')
    } finally {
      setSavingBasics(false)
    }
  }

  const onFinish = async () => {
    setErrorMsg('')
    setSubmittingAll(true)
    try {
      if (role === 'athlete') {
        if (!athleteId) throw new Error('Athlete profile is missing. Save basics first.')
        for (const entry of careerEntries) {
          if (!entry.club_name || !entry.competition || !entry.start_date) continue
          await createCareerApi(athleteId, sanitizeCareerPayload(entry))
        }
        for (const test of fitnessTests) {
          if (!test.test_type || test.score === '' || test.score === null) continue
          await createFitnessTestApi(athleteId, sanitizeFitnessPayload(test))
        }
      }
      navigate(getRedirectPath(role), { replace: true })
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || e?.message || 'Unable to complete onboarding')
    } finally {
      setSubmittingAll(false)
    }
  }

  if (!role) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-ember">Role not found.</div>
      </div>
    )
  }

  if (scaffoldQ.isLoading || !isReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-text2">Loading onboarding…</div>
      </div>
    )
  }

  if (scaffoldQ.isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-ember">Could not load onboarding details.</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <img src="/scoutx-logo.png" alt="ScoutX logo" className="h-12 w-12 object-contain" />
            <div>
            <div className="text-display text-3xl tracking-wide">Startup Wizard</div>
            <div className="text-text2 text-sm mt-1">
              Step {step + 1} of {steps.length} • {steps[step]}
            </div>
            </div>
          </div>
          <div className="rounded-xl border border-edge bg-background px-4 py-2">
            <div className="text-text3 text-xs font-mono">Age</div>
            <div className="text-display text-xl tracking-wide">
              {role === 'athlete' ? calcAge(athleteForm?.date_of_birth) ?? '—' : '—'}
            </div>
          </div>
        </div>
      </div>

      {errorMsg ? <div className="text-ember text-sm">{errorMsg}</div> : null}

      {role === 'club' ? (
        <ClubWizard
          step={step}
          clubForm={clubForm}
          savingBasics={savingBasics}
          onChange={setClubForm}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          canProceed={canProceed}
          onSaveBasics={onSaveBasics}
          onFinish={onFinish}
          submittingAll={submittingAll}
          clubSaved={clubSaved}
        />
      ) : (
        <AthleteWizard
          step={step}
          steps={steps}
          athleteForm={athleteForm}
          careerEntries={careerEntries}
          fitnessTests={fitnessTests}
          savingBasics={savingBasics}
          onChangeForm={setAthleteForm}
          onChangeCareer={setCareerEntries}
          onChangeFitness={setFitnessTests}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          canProceed={canProceed}
          onSaveBasics={onSaveBasics}
          onFinish={onFinish}
          submittingAll={submittingAll}
          athleteId={athleteId}
        />
      )}
    </div>
  )
}

function buildAthleteDefaults(scaffold) {
  return {
    full_name: scaffold?.full_name || '',
    sport: scaffold?.sport || 'football',
    position: scaffold?.position || '',
    city: scaffold?.city || '',
    state: scaffold?.state || '',
    date_of_birth: toDateInputValue(scaffold?.date_of_birth),
    preferred_foot: scaffold?.preferred_foot || '',
    height_cm: scaffold?.height_cm ?? '',
    weight_kg: scaffold?.weight_kg ?? '',
    bio: scaffold?.bio || '',
    headline: scaffold?.headline || '',
    is_open: Boolean(scaffold?.is_open)
  }
}

function buildClubDefaults(scaffold) {
  return {
    club_name: scaffold?.club_name || '',
    league: scaffold?.league || '',
    city: scaffold?.city || '',
    state: scaffold?.state || '',
    founded_year: scaffold?.founded_year ?? '',
    logo_url: scaffold?.logo_url || '',
    bio: scaffold?.bio || ''
  }
}

function sanitizeAthletePayload(form) {
  const payload = {
    full_name: form.full_name,
    sport: form.sport || 'football',
    position: form.position || undefined,
    city: form.city || undefined,
    state: form.state || undefined,
    preferred_foot: form.preferred_foot || undefined,
    date_of_birth: form.date_of_birth || undefined,
    bio: form.bio || undefined,
    headline: form.headline || undefined,
    is_open: Boolean(form.is_open)
  }

  if (form.height_cm !== '' && form.height_cm !== null && form.height_cm !== undefined) payload.height_cm = Number(form.height_cm)
  if (form.weight_kg !== '' && form.weight_kg !== null && form.weight_kg !== undefined) payload.weight_kg = Number(form.weight_kg)

  // Remove undefined keys for clean validation.
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
  return payload
}

function sanitizeClubPayload(form) {
  const payload = {
    club_name: form.club_name,
    league: form.league,
    city: form.city,
    state: form.state,
    founded_year: form.founded_year === '' ? null : Number(form.founded_year),
    logo_url: form.logo_url || null,
    bio: form.bio || null
  }
  return payload
}

function sanitizeCareerPayload(entry) {
  const payload = {
    club_name: entry.club_name,
    role: entry.role || null,
    competition: entry.competition,
    start_date: entry.start_date,
    end_date: entry.end_date === '' ? null : entry.end_date,
    matches: entry.matches === '' ? undefined : Number(entry.matches),
    goals: entry.goals === '' ? undefined : Number(entry.goals),
    assists: entry.assists === '' ? undefined : Number(entry.assists),
    clean_sheets: entry.clean_sheets === '' ? undefined : Number(entry.clean_sheets),
    pass_accuracy: entry.pass_accuracy === '' ? undefined : Number(entry.pass_accuracy),
    avg_rating: entry.avg_rating === '' ? undefined : Number(entry.avg_rating),
    is_verified: entry.is_verified ? true : undefined,
    is_current: entry.is_current ? true : undefined
  }
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
  return payload
}

function sanitizeFitnessPayload(test) {
  const payload = {
    test_type: test.test_type,
    score: Number(test.score),
    unit: test.unit || undefined,
    tested_at: test.tested_at || undefined,
    location: test.location || undefined,
    notes: test.notes || undefined
  }
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
  return payload
}

function AthleteWizard({
  step,
  athleteForm,
  careerEntries,
  fitnessTests,
  steps,
  savingBasics,
  onChangeForm,
  onChangeCareer,
  onChangeFitness,
  onBack,
  onNext,
  canProceed,
  onSaveBasics,
  onFinish,
  submittingAll,
  athleteId
}) {
  if (!athleteForm) return null

  return (
    <div className="flex flex-col gap-4">
      {step === 0 ? (
        <div className="bg-surface border border-edge rounded-xl p-5">
          <div className="text-display text-2xl tracking-wide">Athlete basics</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Full name" value={athleteForm.full_name} onChange={(e) => onChangeForm((f) => ({ ...f, full_name: e.target.value }))} />
            <select className="rounded-md bg-raised border border-edge px-3 py-2" value={athleteForm.sport} onChange={(e) => onChangeForm((f) => ({ ...f, sport: e.target.value }))}>
              {SPORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Position (optional)" value={athleteForm.position} onChange={(e) => onChangeForm((f) => ({ ...f, position: e.target.value }))} />
            <select className="rounded-md bg-raised border border-edge px-3 py-2" value={athleteForm.preferred_foot} onChange={(e) => onChangeForm((f) => ({ ...f, preferred_foot: e.target.value }))}>
              <option value="">Preferred foot</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="both">Both</option>
            </select>

            <input type="date" className="rounded-md bg-raised border border-edge px-3 py-2" value={athleteForm.date_of_birth} onChange={(e) => onChangeForm((f) => ({ ...f, date_of_birth: e.target.value }))} />

            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="City (optional)" value={athleteForm.city} onChange={(e) => onChangeForm((f) => ({ ...f, city: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="State (optional)" value={athleteForm.state} onChange={(e) => onChangeForm((f) => ({ ...f, state: e.target.value }))} />

            <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Height cm (optional)" value={athleteForm.height_cm} onChange={(e) => onChangeForm((f) => ({ ...f, height_cm: e.target.value }))} />
            <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Weight kg (optional)" value={athleteForm.weight_kg} onChange={(e) => onChangeForm((f) => ({ ...f, weight_kg: e.target.value }))} />

            <input className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2" placeholder="Headline (optional)" value={athleteForm.headline} onChange={(e) => onChangeForm((f) => ({ ...f, headline: e.target.value }))} />
            <textarea className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Bio (optional)" value={athleteForm.bio} onChange={(e) => onChangeForm((f) => ({ ...f, bio: e.target.value }))} />

            <label className="inline-flex items-center gap-2 text-text2 text-sm md:col-span-2">
              <input type="checkbox" checked={Boolean(athleteForm.is_open)} onChange={(e) => onChangeForm((f) => ({ ...f, is_open: e.target.checked }))} className="accent-lime" />
              Open to opportunities
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={onSaveBasics}
              disabled={!canProceed || savingBasics}
              className="btn-primary text-xs"
            >
              {savingBasics ? 'Saving…' : 'Save basics & Continue'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="bg-surface border border-edge rounded-xl p-5">
          <div className="text-display text-2xl tracking-wide">History & achievements</div>
          <div className="mt-2 text-text2 text-sm">Add career entries (clubs, roles, competitions). You can add as many as you want.</div>

          <div className="mt-4 space-y-3">
            {careerEntries.length === 0 ? (
              <div className="text-text2 text-sm">No entries yet. Add your first achievement below.</div>
            ) : null}

            {careerEntries.map((entry, idx) => (
              <div key={idx} className="rounded-xl border border-edge bg-background p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-text1 font-semibold text-sm">Entry {idx + 1}</div>
                  <button
                    type="button"
                    onClick={() => onChangeCareer((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-ember text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Club name *" value={entry.club_name} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, club_name: e.target.value } : p)))} />
                  <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Role (optional)" value={entry.role} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, role: e.target.value } : p)))} />
                  <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Competition *" value={entry.competition} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, competition: e.target.value } : p)))} />
                  <input type="date" className="rounded-md bg-raised border border-edge px-3 py-2" value={entry.start_date} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, start_date: e.target.value } : p)))} />
                  <input type="date" className="rounded-md bg-raised border border-edge px-3 py-2" value={entry.end_date} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, end_date: e.target.value } : p)))} />
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Matches" value={entry.matches} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, matches: e.target.value } : p)))} />
                    <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Goals" value={entry.goals} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, goals: e.target.value } : p)))} />
                    <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Assists" value={entry.assists} onChange={(e) => onChangeCareer((prev) => prev.map((p, i) => (i === idx ? { ...p, assists: e.target.value } : p)))} />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                onChangeCareer((prev) => [
                  ...prev,
                  {
                    club_name: '',
                    role: '',
                    competition: '',
                    start_date: '',
                    end_date: '',
                    matches: '',
                    goals: '',
                    assists: '',
                    clean_sheets: '',
                    pass_accuracy: '',
                    avg_rating: '',
                    is_verified: false,
                    is_current: false
                  }
                ])
              }
              className="btn-ghost text-xs"
            >
              Add career entry
            </button>
          </div>

          <div className="mt-4 flex justify-between gap-3">
            <button onClick={onBack} className="btn-ghost text-xs">Back</button>
            <button className="btn-primary text-xs" onClick={onNext}>Continue</button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="bg-surface border border-edge rounded-xl p-5">
          <div className="text-display text-2xl tracking-wide">Fitness baseline</div>
          <div className="mt-2 text-text2 text-sm">Add a few fitness tests. Fitness score will be recalculated after each test is saved.</div>

          <div className="mt-4 space-y-3">
            {fitnessTests.length === 0 ? (
              <div className="text-text2 text-sm">No tests yet. Add your first test below.</div>
            ) : null}

            {fitnessTests.map((test, idx) => (
              <div key={idx} className="rounded-xl border border-edge bg-background p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-text1 font-semibold text-sm">Test {idx + 1}</div>
                  <button
                    type="button"
                    onClick={() => onChangeFitness((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-ember text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    className="rounded-md bg-raised border border-edge px-3 py-2"
                    value={test.test_type}
                    onChange={(e) => onChangeFitness((prev) => prev.map((p, i) => (i === idx ? { ...p, test_type: e.target.value } : p)))}
                  >
                    <option value="">Select test type</option>
                    {fitnessTestTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    className="rounded-md bg-raised border border-edge px-3 py-2"
                    placeholder="Score *"
                    value={test.score}
                    onChange={(e) => onChangeFitness((prev) => prev.map((p, i) => (i === idx ? { ...p, score: e.target.value } : p)))}
                  />

                  <input
                    className="rounded-md bg-raised border border-edge px-3 py-2"
                    placeholder="Unit (optional)"
                    value={test.unit}
                    onChange={(e) => onChangeFitness((prev) => prev.map((p, i) => (i === idx ? { ...p, unit: e.target.value } : p)))}
                  />
                  <input
                    type="date"
                    className="rounded-md bg-raised border border-edge px-3 py-2"
                    value={test.tested_at}
                    onChange={(e) => onChangeFitness((prev) => prev.map((p, i) => (i === idx ? { ...p, tested_at: e.target.value } : p)))}
                  />

                  <input
                    className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2"
                    placeholder="Location (optional)"
                    value={test.location}
                    onChange={(e) => onChangeFitness((prev) => prev.map((p, i) => (i === idx ? { ...p, location: e.target.value } : p)))}
                  />

                  <textarea
                    className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2 min-h-[80px]"
                    placeholder="Notes (optional)"
                    value={test.notes}
                    onChange={(e) => onChangeFitness((prev) => prev.map((p, i) => (i === idx ? { ...p, notes: e.target.value } : p)))}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                onChangeFitness((prev) => [
                  ...prev,
                  { test_type: '', score: '', unit: '', tested_at: '', location: '', notes: '' }
                ])
              }
              className="btn-ghost text-xs"
            >
              Add fitness test
            </button>
          </div>

          <div className="mt-4 flex justify-between gap-3">
            <button onClick={onBack} className="btn-ghost text-xs">Back</button>
            <button onClick={onNext} className="btn-primary text-xs">Continue</button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="bg-surface border border-edge rounded-xl p-5">
          <div className="text-display text-2xl tracking-wide">Review & finish</div>
          <div className="mt-2 text-text2 text-sm">
            We’ll save your career entries and fitness tests, then take you to the app.
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-edge bg-background p-4">
              <div className="text-text2 text-xs uppercase tracking-widest">Athlete profile</div>
              <div className="mt-2 text-text1 font-semibold">{athleteForm.full_name}</div>
              <div className="text-text2 text-sm mt-1">{athleteForm.sport} • {athleteForm.position || 'Position TBD'}</div>
            </div>
            <div className="rounded-xl border border-edge bg-background p-4">
              <div className="text-text2 text-xs uppercase tracking-widest">What will be saved</div>
              <div className="mt-2 text-text2 text-sm">
                {careerEntries.length} career entries
                <br />
                {fitnessTests.length} fitness tests
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between gap-3">
            <button onClick={onBack} className="btn-ghost text-xs">Back</button>
            <button onClick={onFinish} disabled={submittingAll} className="btn-primary text-xs">
              {submittingAll ? 'Saving…' : 'Finish onboarding'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ClubWizard({
  step,
  clubForm,
  savingBasics,
  onChange,
  onBack,
  canProceed,
  onSaveBasics,
  onFinish,
  submittingAll,
  clubSaved
}) {
  if (!clubForm) return null

  return (
    <div className="flex flex-col gap-4">
      {step === 0 ? (
        <div className="bg-surface border border-edge rounded-xl p-5">
          <div className="text-display text-2xl tracking-wide">Club basics</div>
          <div className="mt-2 text-text2 text-sm">Help clubs post trials and shortlist athletes faster.</div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Club name *" value={clubForm.club_name} onChange={(e) => onChange((f) => ({ ...f, club_name: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="League *" value={clubForm.league} onChange={(e) => onChange((f) => ({ ...f, league: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="City *" value={clubForm.city} onChange={(e) => onChange((f) => ({ ...f, city: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="State *" value={clubForm.state} onChange={(e) => onChange((f) => ({ ...f, state: e.target.value }))} />
            <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Founded year (optional)" value={clubForm.founded_year} onChange={(e) => onChange((f) => ({ ...f, founded_year: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Logo URL (optional)" value={clubForm.logo_url} onChange={(e) => onChange((f) => ({ ...f, logo_url: e.target.value }))} />
            <textarea className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Club bio (optional)" value={clubForm.bio} onChange={(e) => onChange((f) => ({ ...f, bio: e.target.value }))} />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onSaveBasics} disabled={!canProceed || savingBasics} className="btn-primary text-xs">
              {savingBasics ? 'Saving…' : 'Save club & Continue'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="bg-surface border border-edge rounded-xl p-5">
          <div className="text-display text-2xl tracking-wide">Review & finish</div>
          <div className="mt-2 text-text2 text-sm">Your club profile is ready. Finish onboarding to enter the app.</div>

          <div className="mt-4 rounded-xl border border-edge bg-background p-4">
            <div className="text-text1 font-semibold">{clubForm.club_name}</div>
            <div className="text-text2 text-sm mt-1">{clubForm.league} • {clubForm.city}, {clubForm.state}</div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onFinish} disabled={submittingAll || !clubSaved} className="btn-primary text-xs">
              {submittingAll ? 'Entering…' : 'Enter app'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

