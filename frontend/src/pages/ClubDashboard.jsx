import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import PipelineBoard from '../components/club/PipelineBoard.jsx'
import { getMyClubApi, listShortlistsApi, updateMyClubApi, upsertShortlistApi } from '../api/club.api'

export default function ClubDashboard() {
  const qc = useQueryClient()
  const [errorMsg, setErrorMsg] = useState('')
  const [editing, setEditing] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
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
    queryKey: ['club-me'],
    queryFn: async () => {
      const res = await getMyClubApi()
      return res.data.data
    }
  })

  const shortlistsQ = useQuery({
    queryKey: ['club-shortlists'],
    queryFn: async () => {
      const res = await listShortlistsApi()
      return res.data.data || []
    }
  })

  const upsertM = useMutation({
    mutationFn: async ({ athleteId, stage }) => {
      return upsertShortlistApi({ athleteId, stage, notes: null })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['club-shortlists'] })
    },
    onError: (e) => {
      setErrorMsg(e?.response?.data?.error || 'Failed to update stage')
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
      return updateMyClubApi({
        ...form,
        founded_year: form.founded_year === '' ? null : Number(form.founded_year),
        logo_url: form.logo_url || null
      })
    },
    onSuccess: async () => {
      setSaveMsg('Club profile saved')
      setEditing(false)
      await qc.invalidateQueries({ queryKey: ['club-me'] })
    },
    onError: (e) => {
      setSaveMsg(e?.response?.data?.error || 'Failed to save club profile')
    }
  })

  const rows = useMemo(() => shortlistsQ.data || [], [shortlistsQ.data])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="text-display text-3xl tracking-wide">Club Dashboard</div>
        <div className="mt-2 text-text2 text-sm">Pipeline board (shortlisted athletes).</div>
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
          <div className="text-display text-2xl tracking-wide">Pipeline</div>
          <div className="text-text2 text-xs font-mono">{rows.length} total</div>
        </div>

        <div className="mt-4">
          {shortlistsQ.isLoading ? (
            <div className="text-text2">Loading pipeline…</div>
          ) : shortlistsQ.isError ? (
            <div className="text-ember">
              {shortlistsQ.error?.response?.data?.error || 'Failed to load pipeline'}
            </div>
          ) : (
            <PipelineBoard
              rows={rows}
              onUpdateStage={(athleteId, stage) => upsertM.mutate({ athleteId, stage })}
            />
          )}
        </div>
      </div>
    </div>
  )
}

