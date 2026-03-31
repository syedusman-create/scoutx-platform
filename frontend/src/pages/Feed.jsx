import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { listPostsApi, createPostApi } from '../api/feed.api'
import { Link } from 'react-router-dom'

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getInitials(email, name) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (!email) return '?'
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

const avatarColors = [
  'bg-lime/20 text-lime', 'bg-ember/20 text-ember',
  'bg-ice/20 text-ice', 'bg-violet-400/20 text-violet-400',
  'bg-pink-400/20 text-pink-400'
]

function Avatar({ email, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-11 h-11 text-sm' }
  const color = avatarColors[(email?.charCodeAt(0) || 0) % avatarColors.length]
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none`}>
      {getInitials(email, name)}
    </div>
  )
}

function PostImage({ url }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="mt-3 rounded-lg border border-edge bg-background px-3 py-2 text-text3 text-xs">
        Image could not be loaded (unreachable URL).
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-edge">
      <img
        src={url}
        alt=""
        className="w-full object-cover max-h-96"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

/** Resolve public profile URL from feed post (author_id is always users.id). */
function getPostProfileLink(post) {
  const athleteId = post.author_athlete_id ?? post.authorAthleteId
  const clubId = post.author_club_id ?? post.authorClubId
  if (athleteId) return { label: 'View profile', to: `/athletes/${athleteId}` }
  if (clubId) return { label: 'View club', to: `/clubs/${clubId}` }
  return null
}

function VideoEmbed({ url }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="mt-3 rounded-lg border border-edge bg-background px-3 py-2 text-text3 text-xs">
        Video could not be loaded.{' '}
        <a href={url} target="_blank" rel="noreferrer" className="text-lime underline">
          Open link
        </a>
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-edge bg-background aspect-video flex items-center justify-center">
      <video
        src={url}
        controls
        className="w-full h-full object-cover"
        preload="metadata"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

// ── Skeletons ─────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="bg-lift border border-edge rounded-xl p-5 animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-edge flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-edge rounded w-1/3" />
          <div className="h-2.5 bg-edge rounded w-1/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-edge rounded w-full" />
        <div className="h-3 bg-edge rounded w-5/6" />
        <div className="h-3 bg-edge rounded w-2/3" />
      </div>
    </div>
  )
}

// ── Composer ──────────────────────────────────────────────────
function Composer({ user, onSubmit, isSubmitting }) {
  const [body, setBody] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!body.trim() || isSubmitting) return
    onSubmit({ body: body.trim() })
    setBody('')
    setFocused(false)
  }

  return (
    <div className="bg-lift border border-edge rounded-xl p-4 transition-all duration-200">
      <div className="flex gap-3">
        <Avatar email={user?.email} name={user?.name} size="lg" />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Share a match update, highlight, or career news…"
            className={[
              'w-full bg-transparent text-text1 text-sm placeholder:text-text3',
              'outline-none resize-none transition-all duration-200',
              focused ? 'min-h-[80px]' : 'min-h-[40px]'
            ].join(' ')}
          />

          {focused && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-edge">
              <div className="flex gap-1">
                <button className="flex items-center gap-1.5 text-text3 text-xs px-2.5 py-1.5 rounded-lg hover:bg-edge hover:text-text2 transition-all">
                  🎬 <span>Video</span>
                </button>
                <button className="flex items-center gap-1.5 text-text3 text-xs px-2.5 py-1.5 rounded-lg hover:bg-edge hover:text-text2 transition-all">
                  📸 <span>Photo</span>
                </button>
                <button className="flex items-center gap-1.5 text-text3 text-xs px-2.5 py-1.5 rounded-lg hover:bg-edge hover:text-text2 transition-all">
                  📊 <span>Stats</span>
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => { setBody(''); setFocused(false) }}
                  className="text-text3 text-xs px-3 py-1.5 rounded-lg hover:text-text2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!body.trim() || isSubmitting}
                  className={[
                    'px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-150',
                    body.trim() && !isSubmitting
                      ? 'bg-lime text-background hover:brightness-110'
                      : 'bg-edge text-text3 cursor-not-allowed'
                  ].join(' ')}
                >
                  {isSubmitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Role badge ────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    athlete: { label: 'Athlete', cls: 'bg-lime/10 text-lime border-lime/20' },
    club: { label: 'Club', cls: 'bg-ember/10 text-ember border-ember/20' },
    scout: { label: 'Scout', cls: 'bg-ice/10 text-ice border-ice/20' },
    admin: { label: 'Admin', cls: 'bg-violet-400/10 text-violet-400 border-violet-400/20' },
  }
  const r = map[role] || { label: role, cls: 'bg-edge text-text3 border-edge' }
  return (
    <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded border uppercase ${r.cls}`}>
      {r.label}
    </span>
  )
}

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)

  const handleLike = () => {
    setLiked(v => !v)
    setLikeCount(v => liked ? v - 1 : v + 1)
    // TODO: wire to API
  }

  const displayName = post.author_name || post.author_email?.split('@')[0] || 'User'
  const profileLink = getPostProfileLink(post)

  return (
    <article className="bg-lift border border-edge rounded-xl overflow-hidden hover:border-line transition-colors duration-200">
      {/* Post header */}
      <div className="flex gap-3 px-5 pt-5 pb-3">
        {profileLink ? (
          <Link
            to={profileLink.to}
            title={profileLink.label}
            className="shrink-0 rounded-full ring-offset-background focus:outline-none focus:ring-2 focus:ring-lime/40 hover:ring-2 hover:ring-lime/25 transition-all"
          >
            <Avatar email={post.author_email} name={post.author_name} size="lg" />
          </Link>
        ) : (
          <Avatar email={post.author_email} name={post.author_name} size="lg" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {profileLink ? (
              <Link
                to={profileLink.to}
                className="text-text1 font-semibold text-sm hover:text-lime transition-colors"
              >
                {displayName}
              </Link>
            ) : (
              <span className="text-text1 font-semibold text-sm">{displayName}</span>
            )}
            {profileLink ? (
              <Link
                to={profileLink.to}
                className="text-lime text-[11px] font-bold uppercase tracking-wide hover:underline"
              >
                {profileLink.label}
              </Link>
            ) : null}
            {post.author_role && <RoleBadge role={post.author_role} />}
            {post.author_is_verified && (
              <span className="text-lime text-xs font-bold" title="Verified">✓</span>
            )}
          </div>
          <div className="text-text3 text-xs mt-0.5 flex items-center gap-1.5">
            {post.author_headline && (
              <span className="text-text2">{post.author_headline}</span>
            )}
            {post.author_headline && <span>·</span>}
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        <p className="text-text1 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>

        {/* Media */}
        {post.media_url && post.media_type === 'video' && (
          <VideoEmbed url={post.media_url} />
        )}
        {post.media_url && post.media_type === 'image' && (
          <PostImage url={post.media_url} />
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {post.tags.map(tag => (
              <span key={tag} className="text-lime text-xs font-medium hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-edge">
        <button
          onClick={handleLike}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold',
            'transition-all duration-150 hover:bg-background',
            liked ? 'text-lime' : 'text-text2 hover:text-text1'
          ].join(' ')}
        >
          <span>{liked ? '👍' : '👍'}</span>
          <span>{liked ? 'Liked' : 'Like'}{likeCount > 0 ? ` · ${likeCount}` : ''}</span>
        </button>
        <div className="w-px bg-edge" />
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-text2 hover:text-text1 hover:bg-background transition-all duration-150">
          <span>💬</span>
          <span>Comment</span>
        </button>
        <div className="w-px bg-edge" />
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-text2 hover:text-text1 hover:bg-background transition-all duration-150">
          <span>↗️</span>
          <span>Share</span>
        </button>
      </div>
    </article>
  )
}

// ── Right sidebar widgets ─────────────────────────────────────
function ProfileWidget({ user }) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'You'
  return (
    <div className="bg-lift border border-edge rounded-xl overflow-hidden">
      <div className="h-12 bg-gradient-to-r from-lime/10 to-ice/10" />
      <div className="px-4 pb-4 -mt-5">
        <Avatar email={user?.email} size="lg" />
        <div className="mt-2">
          <div className="text-text1 font-semibold text-sm">{displayName}</div>
          <div className="text-text2 text-xs capitalize">{user?.role}</div>
        </div>
        <div className="mt-3 pt-3 border-t border-edge flex justify-between text-center">
          <div>
            <div className="text-text1 font-bold text-sm">—</div>
            <div className="text-text3 text-xs">Connections</div>
          </div>
          <div>
            <div className="text-text1 font-bold text-sm">—</div>
            <div className="text-text3 text-xs">Profile views</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrendingWidget() {
  const topics = [
    { tag: 'IndianFootball', count: '2.4k' },
    { tag: 'ISL2025', count: '1.8k' },
    { tag: 'GrassrootsFC', count: '934' },
    { tag: 'ScoutX', count: '612' },
  ]
  return (
    <div className="bg-lift border border-edge rounded-xl p-4">
      <div className="text-text1 font-semibold text-sm mb-3">Trending in Indian Football</div>
      <div className="space-y-3">
        {topics.map(t => (
          <div key={t.tag} className="flex items-center justify-between">
            <span className="text-lime text-sm font-medium hover:underline cursor-pointer">#{t.tag}</span>
            <span className="text-text3 text-xs">{t.count} posts</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty feed ────────────────────────────────────────────────
function EmptyFeed({ role }) {
  return (
    <div className="bg-lift border border-edge rounded-xl p-10 text-center">
      <div className="text-4xl mb-4">⚽</div>
      <div className="text-text1 font-semibold text-lg">Nothing here yet</div>
      <div className="text-text2 text-sm mt-2 max-w-xs mx-auto">
        {role === 'athlete'
          ? 'Share your first match update, highlight reel, or training milestone!'
          : 'Connect with athletes and clubs to see their updates here.'}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Feed() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const postsQ = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await listPostsApi()
      return res.data.data || []
    }
  })

  const createM = useMutation({
    mutationFn: createPostApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] })
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

      {/* Main feed */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Composer
          user={user}
          onSubmit={payload => createM.mutateAsync(payload)}
          isSubmitting={createM.isPending}
        />

        {createM.isError && (
          <div className="bg-ruby/10 border border-ruby/20 text-ruby text-sm px-4 py-3 rounded-xl">
            Failed to post: {createM.error?.response?.data?.error || 'Unknown error'}
          </div>
        )}

        {postsQ.isLoading ? (
          <>
            <PostSkeleton /><PostSkeleton /><PostSkeleton />
          </>
        ) : postsQ.isError ? (
          <div className="bg-ruby/10 border border-ruby/20 text-ruby text-sm px-4 py-3 rounded-xl">
            Failed to load posts. <button onClick={() => postsQ.refetch()} className="underline">Retry</button>
          </div>
        ) : postsQ.data.length === 0 ? (
          <EmptyFeed role={user?.role} />
        ) : (
          postsQ.data.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Right sidebar */}
      <div className="hidden lg:flex flex-col gap-4 sticky top-4">
        <ProfileWidget user={user} />
        <TrendingWidget />
      </div>
    </div>
  )
}