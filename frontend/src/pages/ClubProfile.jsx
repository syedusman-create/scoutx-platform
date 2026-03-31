import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getClubByIdApi } from '../api/club.api'
import useAuth from '../hooks/useAuth'

export default function ClubProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const clubQ = useQuery({
    queryKey: ['club', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await getClubByIdApi(id)
      return res.data.data
    }
  })

  const club = clubQ.data
  const isOwner = user?.role === 'club' && club?.user_id && user?.id === club.user_id
  const canMessage = !isOwner && club?.user_id

  if (clubQ.isLoading) {
    return (
      <div className="bg-lift border border-edge rounded-xl p-8 text-text2 animate-pulse">
        Loading club…
      </div>
    )
  }

  if (clubQ.isError || !club) {
    return (
      <div className="bg-lift border border-edge rounded-xl p-8 text-center">
        <div className="text-text1 font-semibold">Club not found</div>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-lime text-sm underline">
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-lift border border-edge rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold text-text1" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em' }}>
              {club.club_name}
            </div>
            <div className="text-text2 text-sm mt-1">
              {[club.league, club.city, club.state].filter(Boolean).join(' • ') || '—'}
            </div>
            {club.is_verified ? (
              <span className="inline-flex mt-2 items-center gap-1.5 text-lime text-xs font-bold uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Verified club
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner ? (
              <Link to="/profile" className="btn-primary text-xs">
                Edit in My Profile
              </Link>
            ) : null}
            {canMessage ? (
              <Link
                to={`/messages?user=${club.user_id}`}
                className="px-4 py-2 rounded-lg bg-lift border border-edge text-text1 text-sm font-semibold hover:border-line transition-all"
              >
                💬 Message
              </Link>
            ) : null}
          </div>
        </div>
        {club.bio ? <p className="mt-4 text-text1 text-sm leading-relaxed whitespace-pre-wrap">{club.bio}</p> : null}
        {club.founded_year ? (
          <div className="mt-4 text-text3 text-xs">
            Founded <span className="text-text2 font-mono">{club.founded_year}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
