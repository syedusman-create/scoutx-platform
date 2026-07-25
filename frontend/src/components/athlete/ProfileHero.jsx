import React, { useState } from 'react'

const Metric = ({ label, value, tone = 'text-text1' }) => {
  return (
    <div className="bg-raised border border-edge rounded-xl p-3">
      <div className="text-text2 text-[11px] uppercase tracking-wide">{label}</div>
      <div className={`mt-1 font-mono text-xl ${tone}`}>{value}</div>
    </div>
  )
}

export default function ProfileHero({
  athlete,
  followersCount = 0,
  followingCount = 0,
  isFollowing = false,
  onFollowToggle,
  showFollowButton = false
}) {
  if (!athlete) return null

  const verified = Boolean(athlete.user_is_verified)
  const open = Boolean(athlete.is_open)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const showAvatar = athlete.avatar_url && !avatarFailed

  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-xl bg-raised border border-edge overflow-hidden flex items-center justify-center">
          {showAvatar ? (
            <img
              src={athlete.avatar_url}
              alt={athlete.full_name}
              className="h-full w-full object-cover"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="text-display text-2xl text-text2">{athlete.full_name?.slice(0, 1) || '?'}</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-display text-4xl leading-none tracking-wide">{athlete.full_name}</div>
            {verified ? (
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-edge bg-raised">
                <span className="h-2 w-2 rounded-full bg-lime" />
                <span className="text-lime text-xs font-bold uppercase tracking-wide">Verified</span>
              </div>
            ) : null}

            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-edge bg-raised">
              <span className={`relative h-2 w-2 rounded-full ${open ? 'bg-lime' : 'bg-text3'}`}>
                {open ? <span className="absolute inset-0 rounded-full bg-lime opacity-60 animate-ping" /> : null}
              </span>
              <span className="text-text2 text-xs font-bold uppercase tracking-wide">
                {open ? 'Open to Opportunities' : 'Not Open'}
              </span>
            </div>
          </div>

          <div className="mt-2 text-text2">{athlete.headline || `${athlete.position || 'Player'} • ${athlete.city || ''} ${athlete.state || ''}`}</div>

          <div className="flex gap-4 mt-2.5 text-xs text-text3">
            <div>
              <span className="text-text1 font-bold">{followersCount}</span> followers
            </div>
            <div>
              <span className="text-text1 font-bold">{followingCount}</span> following
            </div>
          </div>

          {showFollowButton && (
            <button
              onClick={onFollowToggle}
              className={`mt-3 px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-150 ${
                isFollowing ? 'bg-edge text-text2 border border-line' : 'bg-lime text-background hover:brightness-110'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Fitness Score" value={athlete.fitness_score ?? 0} tone="text-ember" />
            <Metric label="Matches" value={athlete.total_matches ?? 0} />
            <Metric label="Goals" value={athlete.total_goals ?? 0} />
            <Metric label="Assists" value={athlete.total_assists ?? 0} />
          </div>
        </div>
      </div>

      {athlete.bio ? <div className="mt-4 text-text2 leading-relaxed">{athlete.bio}</div> : null}
    </div>
  )
}

