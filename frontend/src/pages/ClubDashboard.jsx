import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../api/supabase.js'
import PipelineBoard from '../components/club/PipelineBoard.jsx'

export default function ClubDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [errorMsg, setErrorMsg] = useState('')
  const [editing, setEditing] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [activeTab, setActiveTab] = useState('athletes')
  const [athleteFilters, setAthleteFilters] = useState({
    position: 'all',
    city: '',
    minFitnessScore: 0
  })
  const [form, setForm] = useState({
    club_name: '',
    league: '',
    city: '',
    state: '',
    founded_year: '',
    logo_url: '',
    bio: ''
  })

  const myClubQ = useQuery({
    queryKey: ['club-me', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (error) throw error
      return data
    }
  })

  const athletesQ = useQuery({
    queryKey: ['club-athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('id, user_id, full_name, position, city, state, fitness_score, headline, avatar_url, is_open')
        .order('fitness_score', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const pipelineQ = useQuery({
    queryKey: ['club-pipeline', myClubQ.data?.id],
    enabled: Boolean(myClubQ.data?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          opportunity_id,
          status,
          applied_at,
          opportunities!inner (
            id,
            title,
            club_id
          ),
          athlete_profiles (
            id,
            full_name,
            position,
            city,
            state,
            fitness_score,
            total_matches,
            total_goals
          )
        `)
        .eq('opportunities.club_id', myClubQ.data.id)
        .order('applied_at', { ascending: false })
      if (error) throw error
      return (data || []).map(a => ({
        id: a.id,
        opportunity_id: a.opportunity_id,
        opportunity_title: a.opportunities?.title || 'Opportunity',
        athlete_id: a.athlete_profiles?.id,
        full_name: a.athlete_profiles?.full_name || 'Athlete',
        position: a.athlete_profiles?.position || '—',
        city: a.athlete_profiles?.city || '',
        state: a.athlete_profiles?.state || '',
        fitness_score: a.athlete_profiles?.fitness_score || 0,
        stage: a.status || 'applied'
      }))
    }
  })

  const upsertM = useMutation({
    mutationFn: async ({ applicationId, stage }) => {
      const { data, error } = await supabase
        .from('applications')
        .update({ status: stage })
        .eq('id', applicationId)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['club-pipeline'] })
    },
    onError: (e) => {
      setErrorMsg(e?.message || 'Failed to update stage')
    }
  })

  React.useEffect(() => {
    if (!myClubQ.data) return
    const c = myClubQ.data
    setForm({
      club_name: c.club_name || '',
      league: c.league || '',
      city: c.city || '',
      state: c.state || '',
      founded_year: c.founded_year ?? '',
      logo_url: c.logo_url || '',
      bio: c.bio || ''
    })
  }, [myClubQ.data])

  const saveClubM = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('club_profiles')
        .update({
          club_name: form.club_name,
          league: form.league,
          city: form.city,
          state: form.state,
          founded_year: form.founded_year === '' ? null : Number(form.founded_year),
          logo_url: form.logo_url || null,
          bio: form.bio || null
        })
        .eq('user_id', user.id)
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: async () => {
      setSaveMsg('Club profile saved successfully')
      setEditing(false)
      await qc.invalidateQueries({ queryKey: ['club-me'] })
    },
    onError: (e) => {
      setSaveMsg(e?.message || 'Failed to save club profile')
    }
  })

  const athleteRows = useMemo(() => athletesQ.data || [], [athletesQ.data])
  const positionOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        athleteRows
          .map((athlete) => athlete.position)
          .filter(Boolean)
          .map((value) => String(value).trim())
      )
    )
    return values.sort((a, b) => a.localeCompare(b))
  }, [athleteRows])

  const filteredAthletes = useMemo(() => {
    const cityFilter = athleteFilters.city.trim().toLowerCase()
    return athleteRows.filter((athlete) => {
      const matchesPosition =
        athleteFilters.position === 'all' || String(athlete.position || '').trim() === athleteFilters.position
      const matchesCity =
        !cityFilter || String(athlete.city || '').toLowerCase().includes(cityFilter)
      const matchesFitness = Number(athlete.fitness_score || 0) >= Number(athleteFilters.minFitnessScore || 0)
      return matchesPosition && matchesCity && matchesFitness
    })
  }, [athleteFilters.city, athleteFilters.minFitnessScore, athleteFilters.position, athleteRows])

  const pipelineRows = useMemo(() => pipelineQ.data || [], [pipelineQ.data])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="text-display text-3xl tracking-wide">Club Dashboard</div>
        <div className="mt-2 text-text2 text-sm">Browse athletes, manage your club profile, and keep the pipeline moving.</div>
        {errorMsg ? <div className="mt-2 text-ember text-sm">{errorMsg}</div> : null}
      </div>

      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-display text-2xl tracking-wide">Club Profile</div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-md bg-raised border border-edge px-3 py-2 text-text1 font-bold tracking-wide uppercase text-xs"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {saveMsg ? <div className="mt-2 text-sm text-text2">{saveMsg}</div> : null}
        {myClubQ.isLoading ? <div className="mt-3 text-text2">Loading club profile…</div> : null}

        {editing ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Club name" value={form.club_name} onChange={(e) => setForm((f) => ({ ...f, club_name: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="League" value={form.league} onChange={(e) => setForm((f) => ({ ...f, league: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
            <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Founded year" value={form.founded_year} onChange={(e) => setForm((f) => ({ ...f, founded_year: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Logo URL" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} />
            <textarea className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2 min-h-[96px]" placeholder="Club bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            <div className="md:col-span-2">
              <button
                onClick={() => saveClubM.mutate()}
                disabled={saveClubM.isPending}
                className="rounded-md bg-lime text-background px-4 py-2 font-bold tracking-wide uppercase text-xs"
              >
                {saveClubM.isPending ? 'Saving...' : 'Save club profile'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="text-text2">Club</div><div className="text-text1">{myClubQ.data?.club_name || '—'}</div>
            <div className="text-text2">League</div><div className="text-text1">{myClubQ.data?.league || '—'}</div>
            <div className="text-text2">Location</div><div className="text-text1">{[myClubQ.data?.city, myClubQ.data?.state].filter(Boolean).join(', ') || '—'}</div>
            <div className="text-text2">Founded</div><div className="text-text1">{myClubQ.data?.founded_year || '—'}</div>
          </div>
        )}
      </div>

      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-display text-2xl tracking-wide">Athletes</div>
          <div className="text-text2 text-xs font-mono">{filteredAthletes.length} shown</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('athletes')}
            className={`rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wide ${activeTab === 'athletes' ? 'bg-lime text-background border-lime' : 'bg-raised border-edge text-text1'}`}
          >
            Athlete Browser
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wide ${activeTab === 'pipeline' ? 'bg-lime text-background border-lime' : 'bg-raised border-edge text-text1'}`}
          >
            Pipeline
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'athletes' ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-edge bg-background p-4">
                <div>
                  <label className="block text-text2 text-xs font-semibold uppercase tracking-wide mb-1.5">Position</label>
                  <select
                    className="input-base"
                    value={athleteFilters.position}
                    onChange={(e) => setAthleteFilters((f) => ({ ...f, position: e.target.value }))}
                  >
                    <option value="all">All positions</option>
                    {positionOptions.map((position) => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text2 text-xs font-semibold uppercase tracking-wide mb-1.5">City</label>
                  <input
                    className="input-base"
                    placeholder="Search city"
                    value={athleteFilters.city}
                    onChange={(e) => setAthleteFilters((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-text2 text-xs font-semibold uppercase tracking-wide mb-1.5">
                    Min fitness score: {athleteFilters.minFitnessScore}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    className="w-full accent-lime"
                    value={athleteFilters.minFitnessScore}
                    onChange={(e) => setAthleteFilters((f) => ({ ...f, minFitnessScore: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {athletesQ.isLoading ? (
                <div className="text-text2">Loading athletes…</div>
              ) : athletesQ.isError ? (
                <div className="text-ember">{athletesQ.error?.message || 'Failed to load athletes'}</div>
              ) : filteredAthletes.length === 0 ? (
                <div className="text-text2">No athletes match the current filters.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredAthletes.map((athlete) => (
                    <div key={athlete.id} className="rounded-xl border border-edge bg-raised p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-text1 font-semibold text-base">{athlete.full_name || 'Athlete'}</div>
                          <div className="text-text2 text-xs mt-1">{athlete.position || '—'}</div>
                        </div>
                        <div className="text-ember font-mono text-lg">{athlete.fitness_score ?? 0}</div>
                      </div>
                      <div className="text-text2 text-sm">
                        {[athlete.city, athlete.state].filter(Boolean).join(', ') || 'Location not listed'}
                      </div>
                      {athlete.headline ? <div className="text-text2 text-sm">{athlete.headline}</div> : null}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border ${athlete.is_open ? 'border-lime/20 bg-lime/10 text-lime' : 'border-edge bg-background text-text2'}`}>
                          {athlete.is_open ? 'Open to opportunities' : 'Private'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/messages?user=${athlete.user_id}`)}
                            title="Message"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-xs bg-edge/30 border border-edge hover:bg-lift text-text2 hover:text-ice transition-all"
                          >
                            💬
                          </button>
                          <Link to={`/athletes/${athlete.id}`} className="text-lime text-xs font-bold uppercase tracking-wide hover:underline">
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : pipelineQ.isLoading ? (
            <div className="text-text2">Loading pipeline…</div>
          ) : pipelineQ.isError ? (
            <div className="text-ember">
              {pipelineQ.error?.response?.data?.error || 'Failed to load pipeline'}
            </div>
          ) : (
            <PipelineBoard
              rows={pipelineRows}
              onUpdateStage={(applicationId, stage) => upsertM.mutate({ applicationId, stage })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
