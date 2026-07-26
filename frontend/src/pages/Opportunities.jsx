import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../api/supabase.js'

const PAGE_SIZE = 10

export default function Opportunities() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  // ── Club form state ──────────────────────────────────────────
  const [clubForm, setClubForm] = useState({
    title: '',
    position: '',
    contract_type: '',
    trial_date: '',
    venue: '',
    description: '',
    min_fitness: '',
    max_age: '',
    min_height_cm: '',
    expires_at: ''
  })

  // ── Fetch opportunities ──────────────────────────────────────
  const opportunitiesQ = useQuery({
    queryKey: ['opportunities', page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('opportunities')
        .select(`
          *,
          club_profiles (
            club_name,
            logo_url
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return { data: data || [], count: count || 0 }
    }
  })

  const opportunities = opportunitiesQ.data?.data || []
  const totalCount = opportunitiesQ.data?.count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // ── Athlete: my applications ─────────────────────────────────
  const myAppsQ = useQuery({
    queryKey: ['my-applications'],
    enabled: user?.role === 'athlete',
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return []

      const { data, error } = await supabase
        .from('applications')
        .select('opportunity_id, status, applied_at')
        .eq('athlete_id', profile.id)
        .order('applied_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  const myAppliedIds = new Set((myAppsQ?.data || []).map((app) => String(app.opportunity_id)))
  const myAppStatusMap = Object.fromEntries(
    (myAppsQ?.data || []).map((app) => [String(app.opportunity_id), app.status])
  )

  // ── Athlete: apply ───────────────────────────────────────────
  const applyM = useMutation({
    mutationFn: async (opportunityId) => {
      const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) throw new Error('Complete your athlete profile first')

      const { data, error } = await supabase
        .from('applications')
        .insert({ opportunity_id: opportunityId, athlete_id: profile.id })
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] })
    }
  })

  // ── Club: create opportunity ─────────────────────────────────
  const createOppM = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) throw new Error('Club profile not found')

      const payload = {
        club_id: profile.id,
        title: clubForm.title,
        position: clubForm.position || null,
        contract_type: clubForm.contract_type || null,
        trial_date: clubForm.trial_date || null,
        venue: clubForm.venue || null,
        description: clubForm.description || null,
        min_fitness: clubForm.min_fitness === '' ? null : Number(clubForm.min_fitness),
        max_age: clubForm.max_age === '' ? null : Number(clubForm.max_age),
        min_height_cm: clubForm.min_height_cm === '' ? null : Number(clubForm.min_height_cm),
        expires_at: clubForm.expires_at || null
      }

      // Remove nulls
      Object.keys(payload).forEach((k) => payload[k] === null && delete payload[k])

      const { data, error } = await supabase
        .from('opportunities')
        .insert(payload)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setClubForm({
        title: '', position: '', contract_type: '', trial_date: '',
        venue: '', description: '', min_fitness: '', max_age: '',
        min_height_cm: '', expires_at: ''
      })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    }
  })

  // ── Apply status per card ────────────────────────────────────
  const [applyingId, setApplyingId] = useState(null)

  const handleApply = async (oppId) => {
    setApplyingId(oppId)
    try {
      await applyM.mutateAsync(oppId)
    } finally {
      setApplyingId(null)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-display text-3xl tracking-wide">Opportunities</div>
            <div className="text-text2 text-sm mt-1">Trial listings and scout opportunities.</div>
          </div>
          {user?.role === 'club' && (
            <Link
              to="/club/dashboard"
              className="text-sm font-semibold text-lime hover:underline"
            >
              View applicants in Dashboard →
            </Link>
          )}
        </div>
      </div>

      {/* ── Club: Post form ── */}
      {user?.role === 'club' && (
        <div className="bg-surface border border-edge rounded-xl p-5">
          <div className="text-display text-2xl tracking-wide">Post new opportunity</div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="input-base md:col-span-2"
              placeholder="Title *"
              value={clubForm.title}
              onChange={(e) => setClubForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="input-base"
              placeholder="Position"
              value={clubForm.position}
              onChange={(e) => setClubForm((f) => ({ ...f, position: e.target.value }))}
            />
            <input
              className="input-base"
              placeholder="Contract type (e.g. Full-time, Trial)"
              value={clubForm.contract_type}
              onChange={(e) => setClubForm((f) => ({ ...f, contract_type: e.target.value }))}
            />
            <div>
              <label className="block text-text3 text-[11px] font-semibold uppercase mb-1">Trial Date</label>
              <input
                type="date"
                className="input-base w-full"
                value={clubForm.trial_date}
                onChange={(e) => setClubForm((f) => ({ ...f, trial_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-text3 text-[11px] font-semibold uppercase mb-1">Expires At</label>
              <input
                type="date"
                className="input-base w-full"
                value={clubForm.expires_at}
                onChange={(e) => setClubForm((f) => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
            <input
              className="input-base"
              placeholder="Venue"
              value={clubForm.venue}
              onChange={(e) => setClubForm((f) => ({ ...f, venue: e.target.value }))}
            />
            <input
              type="number"
              className="input-base"
              placeholder="Min fitness score"
              value={clubForm.min_fitness}
              onChange={(e) => setClubForm((f) => ({ ...f, min_fitness: e.target.value }))}
            />
            <input
              type="number"
              className="input-base"
              placeholder="Max age"
              value={clubForm.max_age}
              onChange={(e) => setClubForm((f) => ({ ...f, max_age: e.target.value }))}
            />
            <input
              type="number"
              className="input-base"
              placeholder="Min height (cm)"
              value={clubForm.min_height_cm}
              onChange={(e) => setClubForm((f) => ({ ...f, min_height_cm: e.target.value }))}
            />
            <textarea
              className="input-base min-h-[90px] md:col-span-3"
              placeholder="Description"
              value={clubForm.description}
              onChange={(e) => setClubForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {createOppM.isError && (
            <div className="mt-3 text-ember text-sm">
              {createOppM.error?.message || 'Failed to create opportunity'}
            </div>
          )}
          {createOppM.isSuccess && (
            <div className="mt-3 text-lime text-sm font-semibold">✓ Opportunity posted successfully!</div>
          )}

          <button
            className="mt-4 btn-primary text-xs"
            onClick={() => createOppM.mutate()}
            disabled={createOppM.isPending || !clubForm.title.trim()}
          >
            {createOppM.isPending ? 'Posting...' : 'Post opportunity'}
          </button>
        </div>
      )}

      {/* ── Athlete: My application statuses ── */}
      {user?.role === 'athlete' && myAppsQ.data && myAppsQ.data.length > 0 && (
        <details className="bg-surface border border-edge rounded-xl p-5 group">
          <summary className="text-display text-lg tracking-wide cursor-pointer list-none flex items-center gap-2">
            My Applications ({myAppsQ.data.length})
            <span className="text-text3 text-xs group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 space-y-2">
            {myAppsQ.data.map((app) => (
              <div key={app.opportunity_id} className="flex items-center justify-between rounded-lg border border-edge bg-background px-4 py-2.5 text-sm">
                <span className="text-text1 font-medium">Opportunity</span>
                <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                  app.status === 'applied' ? 'bg-ice/10 text-ice border border-ice/20' :
                  app.status === 'reviewing' ? 'bg-ember/10 text-ember border border-ember/20' :
                  app.status === 'invited' ? 'bg-lime/10 text-lime border border-lime/20' :
                  app.status === 'rejected' ? 'bg-ruby/10 text-ruby border border-ruby/20' :
                  app.status === 'signed' ? 'bg-lime/10 text-lime border border-lime/20' :
                  'bg-edge text-text2 border border-edge'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Opportunities list ── */}
      {opportunitiesQ.isLoading ? (
        <div className="bg-surface border border-edge rounded-xl p-5 text-text2">Loading opportunities...</div>
      ) : opportunitiesQ.isError ? (
        <div className="bg-surface border border-edge rounded-xl p-5 text-ember">
          {opportunitiesQ.error?.message || 'Failed to load opportunities'}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-surface border border-edge rounded-xl p-5 text-text2">No opportunities available right now.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {opportunities.map((opp) => {
            const alreadyApplied = myAppliedIds.has(String(opp.id))
            const appStatus = myAppStatusMap[String(opp.id)]
            const isApplying = applyingId === opp.id

            return (
              <div key={opp.id} className="bg-surface border border-edge rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-text1 font-semibold text-lg">{opp.title}</div>
                      {opp.min_fitness && (
                        <div className="text-ember font-bold text-xs border border-ember/20 bg-ember/5 px-2 py-0.5 rounded">
                          FS ≥ {opp.min_fitness}
                        </div>
                      )}
                    </div>
                    <div className="text-text2 text-sm mt-0.5">
                      {opp.club_profiles?.club_name || 'Club'} {opp.position ? `• ${opp.position}` : ''}
                    </div>
                  </div>

                  {/* Action area */}
                  {user?.role === 'athlete' && (
                    <div className="flex-shrink-0">
                      {alreadyApplied ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded border ${
                            appStatus === 'applied' ? 'bg-ice/10 text-ice border-ice/20' :
                            appStatus === 'reviewing' ? 'bg-ember/10 text-ember border-ember/20' :
                            appStatus === 'invited' ? 'bg-lime/10 text-lime border-lime/20' :
                            appStatus === 'signed' ? 'bg-lime/10 text-lime border-lime/20' :
                            appStatus === 'rejected' ? 'bg-ruby/10 text-ruby border-ruby/20' :
                            'bg-edge text-text2 border-edge'
                          }`}>
                            {appStatus || 'Applied'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(opp.id)}
                          disabled={isApplying}
                          className="btn-primary text-xs whitespace-nowrap"
                        >
                          {isApplying ? 'Applying…' : 'Apply'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 text-text2 text-sm">{opp.description || 'No description provided.'}</div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-text3 text-xs">
                  {opp.venue && <span>📍 {opp.venue}</span>}
                  {opp.trial_date && <span>📅 Trial: {new Date(opp.trial_date).toLocaleDateString()}</span>}
                  {opp.contract_type && <span>📋 {opp.contract_type}</span>}
                  {opp.max_age && <span>🔞 Max age: {opp.max_age}</span>}
                  {opp.min_height_cm && <span>📏 Min height: {opp.min_height_cm}cm</span>}
                  {opp.expires_at && (
                    <span className={new Date(opp.expires_at) < new Date() ? 'text-ruby' : ''}>
                      ⏰ {new Date(opp.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-xs px-4 py-2"
              >
                ← Prev
              </button>
              <span className="text-text2 text-xs font-mono px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn-primary text-xs px-4 py-2"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
