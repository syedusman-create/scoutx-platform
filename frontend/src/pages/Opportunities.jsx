import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { listOpportunitiesApi, applyOpportunityApi, listMyApplicationsApi, createOpportunityApi } from '../api/opportunity.api'

export default function Opportunities() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const opportunitiesQ = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const res = await listOpportunitiesApi()
      return res.data.data || []
    }
  })

  const myAppsQ = useQuery({
    queryKey: ['my-applications'],
    enabled: user?.role === 'athlete',
    queryFn: async () => {
      const res = await listMyApplicationsApi()
      return res.data
    }
  })

  const applyM = useMutation({
    mutationFn: async (opportunityId) => applyOpportunityApi(opportunityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['my-applications'] })
    }
  })

  const myAppliedIds = new Set((myAppsQ?.data?.data || []).map((app) => String(app.opportunity_id)))
  const [clubForm, setClubForm] = React.useState({
    title: '',
    position: '',
    contract_type: '',
    trial_date: '',
    venue: '',
    description: '',
    min_fitness: ''
  })

  const createOppM = useMutation({
    mutationFn: async () =>
      createOpportunityApi({
        ...clubForm,
        min_fitness: clubForm.min_fitness === '' ? null : Number(clubForm.min_fitness),
        trial_date: clubForm.trial_date || null
      }),
    onSuccess: async () => {
      setClubForm({
        title: '',
        position: '',
        contract_type: '',
        trial_date: '',
        venue: '',
        description: '',
        min_fitness: ''
      })
      await qc.invalidateQueries({ queryKey: ['opportunities'] })
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="text-display text-3xl tracking-wide">Opportunities</div>
      <div className="text-text2">Trial listings and applications.</div>
      {user?.role === 'club' ? (
        <div className="card p-4">
          <div className="text-text1 font-semibold">Post new opportunity</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Title" value={clubForm.title} onChange={(e) => setClubForm((f) => ({ ...f, title: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Position" value={clubForm.position} onChange={(e) => setClubForm((f) => ({ ...f, position: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Contract type" value={clubForm.contract_type} onChange={(e) => setClubForm((f) => ({ ...f, contract_type: e.target.value }))} />
            <input type="datetime-local" className="rounded-md bg-raised border border-edge px-3 py-2" value={clubForm.trial_date} onChange={(e) => setClubForm((f) => ({ ...f, trial_date: e.target.value }))} />
            <input className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2" placeholder="Venue" value={clubForm.venue} onChange={(e) => setClubForm((f) => ({ ...f, venue: e.target.value }))} />
            <textarea className="rounded-md bg-raised border border-edge px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Description" value={clubForm.description} onChange={(e) => setClubForm((f) => ({ ...f, description: e.target.value }))} />
            <input type="number" className="rounded-md bg-raised border border-edge px-3 py-2" placeholder="Min fitness (optional)" value={clubForm.min_fitness} onChange={(e) => setClubForm((f) => ({ ...f, min_fitness: e.target.value }))} />
          </div>
          {createOppM.isError ? <div className="mt-2 text-ember text-sm">{createOppM.error?.response?.data?.error || 'Failed to create opportunity'}</div> : null}
          {createOppM.isSuccess ? <div className="mt-2 text-lime text-sm">Opportunity posted.</div> : null}
          <button className="mt-3 btn-primary text-xs" onClick={() => createOppM.mutate()} disabled={createOppM.isPending || !clubForm.title.trim()}>
            {createOppM.isPending ? 'Posting...' : 'Post opportunity'}
          </button>
        </div>
      ) : null}
      {applyM.isError ? (
        <div className="card p-3 text-ember text-sm">{applyM.error?.response?.data?.error || 'Application failed'}</div>
      ) : null}
      {applyM.isSuccess ? (
        <div className="card p-3 text-lime text-sm">Application submitted.</div>
      ) : null}

      {opportunitiesQ.isLoading ? (
        <div className="card p-4 text-text2">Loading opportunities...</div>
      ) : opportunitiesQ.isError ? (
        <div className="card p-4 text-ember">{opportunitiesQ.error?.response?.data?.error || 'Failed to load opportunities'}</div>
      ) : opportunitiesQ.data.length === 0 ? (
        <div className="card p-4 text-text2">No opportunities available.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {opportunitiesQ.data.map((opp) => (
            <div key={opp.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-text1 font-semibold text-lg">{opp.title}</div>
                  <div className="text-text2 text-sm">
                    {opp.club_name} • {opp.position || 'Any position'}
                  </div>
                </div>
                <div className="text-ember font-bold text-xl">{opp.min_fitness ? `FS >= ${opp.min_fitness}` : ''}</div>
              </div>

              <div className="mt-2 text-text2 text-sm">{opp.description || 'No description provided.'}</div>
              <div className="mt-2 text-text2 text-xs">
                {opp.venue && `Venue: ${opp.venue}`} {opp.trial_date && `• Trial: ${new Date(opp.trial_date).toLocaleDateString()}`}
              </div>

              {user?.role === 'athlete' ? (
                <button
                  onClick={() => applyM.mutate(opp.id)}
                  className="mt-3 btn-primary text-xs"
                  disabled={applyM.isPending || myAppliedIds.has(String(opp.id))}
                >
                  {myAppliedIds.has(String(opp.id)) ? 'Applied' : applyM.isPending ? 'Applying…' : 'Apply'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


