import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../api/supabase.js'

export default function AdminVerification() {
  const qc = useQueryClient()
  const [athleteQuery, setAthleteQuery] = useState('')
  const [clubQuery, setClubQuery] = useState('')

  const athletesQ = useQuery({
    queryKey: ['admin-athletes-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select(`
          *,
          users:user_id (email)
        `)
      if (error) throw error
      return (data || []).map(a => ({
        ...a,
        user_email: a.users?.email
      }))
    }
  })

  const clubsQ = useQuery({
    queryKey: ['admin-clubs-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_profiles')
        .select(`
          *,
          users:user_id (email)
        `)
      if (error) throw error
      return (data || []).map(c => ({
        ...c,
        user_email: c.users?.email
      }))
    }
  })

  const verifyAthleteM = useMutation({
    mutationFn: async ({ athleteId, is_verified }) => {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .update({ age_verified: is_verified })
        .eq('id', athleteId)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-athletes-verification'] })
  })

  const verifyClubM = useMutation({
    mutationFn: async ({ clubId, is_verified }) => {
      const { data, error } = await supabase
        .from('club_profiles')
        .update({ is_verified })
        .eq('id', clubId)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clubs-verification'] })
  })

  const athletes = athletesQ.data || []
  const clubs = clubsQ.data || []

  const filteredAthletes = useMemo(() => {
    if (!athleteQuery.trim()) return athletes
    const q = athleteQuery.trim().toLowerCase()
    return athletes.filter((a) => a.user_email?.toLowerCase().includes(q) || a.full_name?.toLowerCase().includes(q))
  }, [athletes, athleteQuery])

  const filteredClubs = useMemo(() => {
    if (!clubQuery.trim()) return clubs
    const q = clubQuery.trim().toLowerCase()
    return clubs.filter((c) => c.user_email?.toLowerCase().includes(q) || c.club_name?.toLowerCase().includes(q))
  }, [clubs, clubQuery])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-display text-2xl tracking-wide">Athlete Verification</div>
            <div className="text-text2 text-sm mt-1">Toggle `age_verified` for athlete profiles.</div>
          </div>
          <input
            className="rounded-md bg-raised border border-edge px-3 py-2 text-text1"
            placeholder="Search athlete..."
            value={athleteQuery}
            onChange={(e) => setAthleteQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-2">
          {filteredAthletes.map((a) => (
            <div key={a.id} className="rounded-md border border-edge p-3 bg-raised flex flex-wrap gap-3 items-center justify-between">
              <div>
                <div className="text-text1 text-sm font-semibold">{a.full_name || a.user_email}</div>
                <div className="text-text2 text-xs">{a.user_email} • {a.position || ''}</div>
              </div>
              <button
                className="btn-primary text-xs"
                disabled={verifyAthleteM.isPending}
                onClick={() => verifyAthleteM.mutate({ athleteId: a.id, is_verified: !(a.age_verified) })}
              >
                {a.age_verified ? 'Mark unverified' : 'Verify athlete'}
              </button>
            </div>
          ))}
          {filteredAthletes.length === 0 ? <div className="text-text2">No athletes found.</div> : null}
        </div>
      </div>

      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-display text-2xl tracking-wide">Club Verification</div>
            <div className="text-text2 text-sm mt-1">Toggle `is_verified` for club profiles.</div>
          </div>
          <input
            className="rounded-md bg-raised border border-edge px-3 py-2 text-text1"
            placeholder="Search club..."
            value={clubQuery}
            onChange={(e) => setClubQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-2">
          {filteredClubs.map((c) => (
            <div key={c.id} className="rounded-md border border-edge p-3 bg-raised flex flex-wrap gap-3 items-center justify-between">
              <div>
                <div className="text-text1 text-sm font-semibold">{c.club_name || c.user_email}</div>
                <div className="text-text2 text-xs">{c.user_email} • {c.league || ''}</div>
              </div>
              <button
                className="btn-primary text-xs"
                disabled={verifyClubM.isPending}
                onClick={() => verifyClubM.mutate({ clubId: c.id, is_verified: !(c.is_verified) })}
              >
                {c.is_verified ? 'Mark unverified' : 'Verify club'}
              </button>
            </div>
          ))}
          {filteredClubs.length === 0 ? <div className="text-text2">No clubs found.</div> : null}
        </div>
      </div>
    </div>
  )
}

