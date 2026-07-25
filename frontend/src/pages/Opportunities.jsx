import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../api/supabase.js'

export default function Opportunities() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const opportunitiesQ = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          club_profiles (
            club_name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

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
        .select('*')
        .eq('athlete_id', profile.id)
      
      if (error) throw error
      return data || []
    }
  })

  const applyM = useMutation({
    mutationFn: async (opportunityId) => {
      const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) throw new Error('Athlete profile not found')

      const { data, error } = await supabase
        .from('applications')
        .insert({
          opportunity_id: opportunityId,
          athlete_id: profile.id
        })
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['my-applications'] })
    }
  })

  const myAppliedIds = new Set((myAppsQ?.data || []).map((app) => String(app.opportunity_id)))
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
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) throw new Error('Club profile not found')

      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          club_id: profile.id,
          title: clubForm.title,
          position: clubForm.position,
          contract_type: clubForm.contract_type,
          trial_date: clubForm.trial_date || null,
          venue: clubForm.venue,
          description: clubForm.description,
          min_fitness: clubForm.min_fitness === '' ? null : Number(clubForm.min_fitness)
        })
        .select()
      
      if (error) throw error
      return data
    },
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
          {createOppM.isError ? <div className="mt-2 text-ember text-sm">{createOppM.error?.message || 'Failed to create opportunity'}</div> : null}
          {createOppM.isSuccess ? <div className="mt-2 text-lime text-sm">Opportunity posted.</div> : null}
          <button className="mt-3 btn-primary text-xs" onClick={() => createOppM.mutate()} disabled={createOppM.isPending || !clubForm.title.trim()}>
            {createOppM.isPending ? 'Posting...' : 'Post opportunity'}
          </button>
        </div>
      ) : null}
      {applyM.isError ? (
        <div className="card p-3 text-ember text-sm">{applyM.error?.message || 'Application failed'}</div>
      ) : null}
      {applyM.isSuccess ? (
        <div className="card p-3 text-lime text-sm">Application submitted.</div>
      ) : null}

      {opportunitiesQ.isLoading ? (
        <div className="card p-4 text-text2">Loading opportunities...</div>
      ) : opportunitiesQ.isError ? (
        <div className="card p-4 text-ember">{opportunitiesQ.error?.message || 'Failed to load opportunities'}</div>
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
                    {opp.club_profiles?.club_name || 'Club'} • {opp.position || 'Any position'}
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


