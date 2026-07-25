import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { supabase } from '../api/supabase'
import useAuth from '../hooks/useAuth'

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-lift border border-edge rounded-xl overflow-hidden">
        <div className="h-40 bg-edge" />
        <div className="px-6 pb-6 -mt-8 space-y-3">
          <div className="w-20 h-20 rounded-xl bg-edge border-4 border-background" />
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

function StatStrip({ club, opportunities }) {
  const activeCount = opportunities.filter((opp) => opp.is_active).length
  const stats = [
    { label: 'Opportunities', value: opportunities.length, color: 'text-lime' },
    { label: 'Active Trials', value: activeCount, color: 'text-ember' },
    { label: 'Founded', value: club?.founded_year || '—', color: 'text-text1' },
    { label: 'League', value: club?.league || '—', color: 'text-ice' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-lift border border-edge rounded-xl overflow-hidden">
      {stats.map((stat, index) => (
        <div key={stat.label} className={`px-4 py-4 text-center ${index < stats.length - 1 ? 'border-r border-edge' : ''}`}>
          <div className={`text-3xl font-bold leading-none ${stat.color}`} style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            {stat.value}
          </div>
          <div className="text-text3 text-xs font-semibold tracking-widest uppercase mt-1.5">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <>
      <div className="text-text3 text-xs font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-text1 text-sm">{value}</div>
    </>
  )
}

function ClubHero({ club, opportunities, isOwner, onMessageClick }) {
  const [logoFailed, setLogoFailed] = useState(false)
  const activeCount = opportunities.filter((opp) => opp.is_active).length
  const showLogo = club.logo_url && !logoFailed

  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-xl bg-raised border border-edge overflow-hidden flex items-center justify-center flex-shrink-0">
          {showLogo ? (
            <img
              src={club.logo_url}
              alt={club.club_name}
              className="h-full w-full object-cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="text-display text-2xl text-text2">{club.club_name?.slice(0, 1) || '?'}</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-display text-4xl leading-none tracking-wide">{club.club_name}</div>
            {club.is_verified ? (
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-edge bg-raised">
                <span className="h-2 w-2 rounded-full bg-lime" />
                <span className="text-lime text-xs font-bold uppercase tracking-wide">Verified</span>
              </div>
            ) : null}
          </div>

          <div className="mt-2 text-text2">
            {[club.league, club.city, club.state].filter(Boolean).join(' • ') || '—'}
          </div>

          <div className="flex gap-4 mt-2.5 text-xs text-text3">
            <div>
              <span className="text-text1 font-bold">{opportunities.length}</span> opportunities
            </div>
            <div>
              <span className="text-text1 font-bold">{activeCount}</span> active
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isOwner ? (
              <Link to="/club/dashboard" className="px-4 py-2 rounded-lg bg-lime text-background text-sm font-bold tracking-wide uppercase hover:brightness-110 transition-all">
                Edit Profile
              </Link>
            ) : null}
            {Boolean(club.user_id) ? (
              <button
                type="button"
                onClick={onMessageClick}
                className="px-4 py-2 rounded-lg bg-lift border border-edge text-text1 text-sm font-semibold hover:border-line transition-all flex items-center gap-2"
              >
                Message
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {club.bio ? <div className="mt-4 text-text2 leading-relaxed">{club.bio}</div> : null}
    </div>
  )
}

export default function ClubProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const clubQ = useQuery({
    queryKey: ['club-profile', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id, user_id, club_name, league, city, state, founded_year, logo_url, bio, is_verified, created_at')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return data
    }
  })

  const oppsQ = useQuery({
    queryKey: ['club-profile-opportunities', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, position, contract_type, trial_date, venue, description, is_active, created_at')
        .eq('club_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  const club = clubQ.data
  const opportunities = oppsQ.data || []
  const activeCount = opportunities.filter((opp) => opp.is_active).length
  const isOwner = user?.role === 'club' && club?.user_id && user?.id === club.user_id

  if (clubQ.isLoading) {
    return <ProfileSkeleton />
  }

  if (clubQ.isError || !club) {
    return (
      <div className="bg-lift border border-edge rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">?</div>
        <div className="text-text1 font-semibold">Club not found</div>
        <div className="text-text2 text-sm mt-1">This club profile could not be loaded.</div>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-lime text-sm underline">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ClubHero
        club={club}
        opportunities={opportunities}
        isOwner={isOwner}
        onMessageClick={() => navigate(`/messages?user=${club.user_id}`)}
      />

      <StatStrip club={club} opportunities={opportunities} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-lift border border-edge rounded-xl p-5">
            <div className="text-text3 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-lime inline-block" />
              About
            </div>
            <p className="text-text1 text-sm leading-relaxed">
              {club.bio || 'No club bio added yet.'}
            </p>
          </div>

          <div className="bg-lift border border-edge rounded-xl p-5">
            <div className="text-text3 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-lime inline-block" />
              Opportunities
            </div>

            {oppsQ.isLoading ? (
              <div className="text-text2 text-sm">Loading opportunities...</div>
            ) : oppsQ.isError ? (
              <div className="text-ember text-sm">{oppsQ.error?.message || 'Failed to load opportunities'}</div>
            ) : opportunities.length === 0 ? (
              <div className="text-text2 text-sm">No opportunities posted yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="rounded-xl border border-edge bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-text1 font-semibold text-base">{opp.title}</div>
                        <div className="text-text2 text-xs mt-1">{opp.position || 'Any position'}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border ${
                          opp.is_active ? 'border-lime/20 bg-lime/10 text-lime' : 'border-edge bg-background text-text2'
                        }`}
                      >
                        {opp.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>

                    <div className="mt-3 text-text2 text-sm">
                      {opp.description || 'No description provided.'}
                    </div>

                    <div className="mt-3 text-text3 text-xs">
                      {opp.venue ? `Venue: ${opp.venue}` : 'Venue not listed'}
                      {opp.trial_date ? ` • Trial: ${new Date(opp.trial_date).toLocaleDateString()}` : ''}
                    </div>

                    <div className="mt-3 text-text2 text-xs">
                      {opp.contract_type ? `Contract: ${opp.contract_type}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-lift border border-edge rounded-xl p-5">
            <div className="text-text3 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-lime inline-block" />
              Details
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="League" value={club.league} />
              <DetailRow label="Founded" value={club.founded_year ? String(club.founded_year) : null} />
              <DetailRow label="City" value={club.city} />
              <DetailRow label="State" value={club.state} />
              <DetailRow label="Opportunities" value={String(opportunities.length)} />
              <DetailRow label="Active" value={String(activeCount)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
