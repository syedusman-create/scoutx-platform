import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'
import { supabase } from '../api/supabase.js'

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

function firstRecord(value) {
  if (Array.isArray(value)) return value[0] || null
  if (value && typeof value === 'object') return value
  return null
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

function extractYouTubeId(url) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?\/]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

function extractInstagramReelId(url) {
  if (!url) return null
  const match = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)(?:\/?|\?|#|$)/i)
  return match ? match[1] : null
}

function parseMediaUrls(value) {
  if (!value) return []
  const trimmed = String(value).trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      // fall through to line splitting
    }
  }

  return trimmed
    .split(/\r?\n|\s*\|\s*|\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getMediaKind(url) {
  if (!url) return 'unknown'
  if (extractYouTubeId(url)) return 'video'
  if (extractInstagramReelId(url)) return 'instagram'
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return 'video-file'
  if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(url)) return 'image'
  return 'link'
}

function isVideoUrl(url) {
  const kind = getMediaKind(url)
  return kind === 'video' || kind === 'video-file'
}

function VideoEmbed({ url }) {
  const ytId = extractYouTubeId(url)
  const igReelId = extractInstagramReelId(url)

  if (ytId) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-edge bg-black aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title="YouTube Video Player"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (igReelId) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-edge bg-black aspect-video">
        <iframe
          src={`https://www.instagram.com/reel/${igReelId}/embed/`}
          title="Instagram Reel"
          className="w-full h-full border-0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-edge bg-background aspect-video flex items-center justify-center">
      <video
        src={url}
        controls
        className="w-full h-full object-cover"
        preload="metadata"
      />
    </div>
  )
}

function InstagramEmbed({ url }) {
  const permalink = useMemo(() => {
    try {
      const parsed = new URL(url)
      parsed.search = ''
      parsed.hash = ''
      return parsed.toString().replace(/\/$/, '')
    } catch {
      return url
    }
  }, [url])

  useEffect(() => {
    if (document.querySelector('script[data-instgrm-embed]')) {
      window.instgrm?.Embeds?.process?.()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.instagram.com/embed.js'
    script.async = true
    script.defer = true
    script.setAttribute('data-instgrm-embed', 'true')
    script.onload = () => window.instgrm?.Embeds?.process?.()
    document.body.appendChild(script)
  }, [permalink])

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-edge bg-background px-3 py-4">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{ background: '#fff', border: 0, borderRadius: '12px', margin: '1px', minWidth: '326px', padding: 0, width: '100%' }}
      >
        <a href={permalink} target="_blank" rel="noreferrer">Open in Instagram</a>
      </blockquote>
    </div>
  )
}

function MediaCarousel({ urls }) {
  const normalized = useMemo(() => (urls || []).map((url) => url.trim()).filter(Boolean), [urls])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [normalized.length])

  if (normalized.length === 0) return null

  const currentUrl = normalized[activeIndex]
  const currentKind = getMediaKind(currentUrl)

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-edge bg-background">
      <div className="relative min-h-[320px] bg-black">
        {currentKind === 'instagram' ? (
          <InstagramEmbed url={currentUrl} />
        ) : currentKind === 'video' || currentKind === 'video-file' ? (
          <VideoEmbed url={currentUrl} />
        ) : currentKind === 'image' ? (
          <img src={currentUrl} alt={`Carousel item ${activeIndex + 1}`} className="w-full h-full max-h-[520px] object-contain bg-black" />
        ) : (
          <div className="flex min-h-[320px] items-center justify-center p-6 text-center text-text2">
            <a href={currentUrl} target="_blank" rel="noreferrer" className="text-lime underline break-all">
              Open media {activeIndex + 1}
            </a>
          </div>
        )}
      </div>

      {normalized.length > 1 ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-edge bg-raised/40">
          <button
            type="button"
            onClick={() => setActiveIndex((value) => (value - 1 + normalized.length) % normalized.length)}
            className="rounded-lg border border-edge px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-text1 hover:bg-background"
          >
            Prev
          </button>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {normalized.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-lime' : 'w-2.5 bg-edge'}`}
                aria-label={`Show media ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex((value) => (value + 1) % normalized.length)}
            className="rounded-lg border border-edge px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-text1 hover:bg-background"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}

function MediaRenderer({ url, mediaType }) {
  const urls = parseMediaUrls(url)
  if (urls.length > 1 || mediaType === 'carousel') {
    return <MediaCarousel urls={urls} />
  }

  const singleUrl = urls[0] || url
  const kind = mediaType === 'carousel' ? 'carousel' : getMediaKind(singleUrl)

  if (kind === 'instagram') {
    return <InstagramEmbed url={singleUrl} />
  }

  if (kind === 'video' || kind === 'video-file') {
    return <VideoEmbed url={singleUrl} />
  }

  if (kind === 'image') {
    return <PostImage url={singleUrl} />
  }

  return (
    <div className="mt-3 rounded-lg border border-edge bg-background px-3 py-2 text-text3 text-xs">
      Attachment preview unavailable (<a href={singleUrl} target="_blank" rel="noreferrer" className="text-lime underline">open link</a>)
    </div>
  )
}

function PostImage({ url }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="mt-3 rounded-lg border border-edge bg-background px-3 py-2 text-text3 text-xs">
        Image preview unavailable (<a href={url} target="_blank" rel="noreferrer" className="text-lime underline">open link</a>)
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-edge max-h-[450px]">
      <img
        src={url}
        alt="Feed attachment"
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function getPostProfileLink(post) {
  if (post.is_current_user) return { label: 'View profile', to: '/profile' }
  if (post.author_athlete_id) return { label: 'View profile', to: `/athletes/${post.author_athlete_id}` }
  if (post.author_club_id) return { label: 'View club', to: `/clubs/${post.author_club_id}` }
  return null
}

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

// ── Composer ──────────────────────────────────────────────────
function Composer({ user, onSubmit, isSubmitting }) {
  const [body, setBody] = useState('')
  const [mediaType, setMediaType] = useState('') // 'image' | 'video' | 'carousel' | ''
  const [mediaUrl, setMediaUrl] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!body.trim() || isSubmitting) return
    const mediaUrls = parseMediaUrls(mediaUrl)
    const detectedType = mediaUrls.length > 1
      ? 'carousel'
      : mediaType || (isVideoUrl(mediaUrls[0] || mediaUrl.trim()) ? 'video' : 'image')
    onSubmit({
      body: body.trim(),
      media_url: mediaUrls.length > 1 ? JSON.stringify(mediaUrls) : (mediaUrls[0] || undefined),
      media_type: mediaUrls.length ? detectedType : undefined
    })
    setBody('')
    setMediaUrl('')
    setMediaType('')
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
            placeholder="Share a match update, YouTube highlight reel, or photo…"
            className={[
              'w-full bg-transparent text-text1 text-sm placeholder:text-text3',
              'outline-none resize-none transition-all duration-200',
              focused ? 'min-h-[80px]' : 'min-h-[40px]'
            ].join(' ')}
          />

          {(mediaType || focused) && (
            <div className="mt-2 p-2 bg-background border border-edge rounded-lg space-y-1 animate-fade-up">
              <div className="text-[11px] font-bold uppercase text-text3">
                {mediaType === 'video' ? '🎬 Video URL' : mediaType === 'carousel' ? '🖼️ Carousel URLs' : '📸 Image / Instagram URL'}
              </div>
              <textarea
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                placeholder={
                  mediaType === 'video'
                    ? 'https://www.youtube.com/shorts/...\nhttps://www.instagram.com/reel/...'
                    : mediaType === 'carousel'
                      ? 'Paste one image URL per line for a carousel'
                      : 'Paste an image URL or an Instagram post/reel URL'
                }
                className="w-full min-h-[88px] bg-raised border border-edge px-3 py-2 rounded text-xs text-text1 outline-none focus:border-lime/50 resize-y"
              />
            </div>
          )}

          {focused && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-edge flex-wrap gap-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setMediaType(m => m === 'video' ? '' : 'video')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    mediaType === 'video' ? 'bg-lime/10 border-lime/30 text-lime font-bold' : 'text-text3 border-edge hover:bg-edge'
                  }`}
                >
                  🎬 <span>Video / Shorts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType(m => m === 'image' ? '' : 'image')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    mediaType === 'image' ? 'bg-lime/10 border-lime/30 text-lime font-bold' : 'text-text3 border-edge hover:bg-edge'
                  }`}
                >
                  📸 <span>Image / Instagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType(m => m === 'carousel' ? '' : 'carousel')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    mediaType === 'carousel' ? 'bg-lime/10 border-lime/30 text-lime font-bold' : 'text-text3 border-edge hover:bg-edge'
                  }`}
                >
                  🖼️ <span>Carousel</span>
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => { setBody(''); setMediaUrl(''); setMediaType(''); setFocused(false) }}
                  className="text-text3 text-xs px-3 py-1.5 rounded-lg hover:text-text2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
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

// ── Post card ─────────────────────────────────────────────────
export function PostCard({ post }) {
  const [copied, setCopied] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [draftBody, setDraftBody] = useState(post.content)
  const [busyAction, setBusyAction] = useState('')

  const queryClient = post.queryClient
  const currentUserId = post.currentUserId
  const isOwner = Boolean(currentUserId && post.user_id === currentUserId)

  useEffect(() => {
    if (window.location.hash !== `#post-${post.id}`) return
    const timer = window.setTimeout(() => {
      document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [post.id])

  const likesQ = useQuery({
    queryKey: ['post-likes', post.id],
    enabled: Boolean(post.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select('user_id')
        .eq('post_id', post.id)
      if (error) throw error
      return data || []
    }
  })

  const commentsQ = useQuery({
    queryKey: ['post-comments', post.id],
    enabled: Boolean(post.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          comment,
          created_at,
          user_id,
          users:user_id (
            email,
            role,
            athlete_profiles (id, full_name),
            club_profiles (id, club_name)
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      if (error) throw error

      return (data || []).map((comment) => {
        const authorUser = firstRecord(comment.users)
        const athleteProfile = firstRecord(authorUser?.athlete_profiles)
        const clubProfile = firstRecord(authorUser?.club_profiles)
        return {
          id: comment.id,
          comment: comment.comment,
          created_at: comment.created_at,
          user_id: comment.user_id,
          author_email: authorUser?.email,
          author_role: authorUser?.role,
          author_name: authorUser?.role === 'athlete' ? athleteProfile?.full_name : clubProfile?.club_name
        }
      })
    }
  })

  const liked = Boolean(currentUserId && (likesQ.data || []).some((like) => like.user_id === currentUserId))
  const likeCount = likesQ.data?.length || 0
  const comments = commentsQ.data || []

  const invalidatePosts = async () => {
    if (!queryClient) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
      queryClient.invalidateQueries({ queryKey: ['my-posts', currentUserId] }),
      queryClient.invalidateQueries({ queryKey: ['post-likes', post.id] }),
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] })
    ])
  }

  const toggleLike = async () => {
    if (!currentUserId) return
    try {
      setBusyAction('like')
      const existingLike = (likesQ.data || []).find((like) => like.user_id === currentUserId)
      if (existingLike) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: currentUserId })
        if (error) throw error
      }
      await invalidatePosts()
    } finally {
      setBusyAction('')
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${post.id}`
    if (navigator.share) {
      navigator.share({
        title: post.content?.slice(0, 60) || 'ScoutX post',
        url: shareUrl
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(shareUrl)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentInput.trim() || !currentUserId) return
    try {
      setBusyAction('comment')
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          comment: commentInput.trim()
        })
      if (error) throw error
      setCommentInput('')
      await invalidatePosts()
    } finally {
      setBusyAction('')
    }
  }

  const handleSaveEdit = async () => {
    if (!draftBody.trim() || !isOwner) return
    try {
      setBusyAction('edit')
      const { error } = await supabase
        .from('posts')
        .update({ content: draftBody.trim() })
        .eq('id', post.id)
        .eq('user_id', currentUserId)
      if (error) throw error
      setIsEditing(false)
      await invalidatePosts()
    } finally {
      setBusyAction('')
    }
  }

  const handleDelete = async () => {
    if (!isOwner || !window.confirm('Delete this post?')) return
    try {
      setBusyAction('delete')
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', currentUserId)
      if (error) throw error
      await invalidatePosts()
    } finally {
      setBusyAction('')
    }
  }

  const displayName = post.author_name || post.author_email?.split('@')[0] || 'User'
  const profileLink = getPostProfileLink(post)

  return (
    <article id={`post-${post.id}`} className="bg-lift border border-edge rounded-xl overflow-hidden hover:border-line transition-colors duration-200">
      {/* Post header */}
      <div className="flex gap-3 px-5 pt-5 pb-3">
        {profileLink ? (
          <Link
            to={profileLink.to}
            title={profileLink.label}
            className="shrink-0 rounded-full focus:outline-none hover:opacity-80 transition-all"
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
                {profileLink.label} →
              </Link>
            ) : null}
            {post.author_role && <RoleBadge role={post.author_role} />}
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
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              className="w-full min-h-[110px] rounded-xl border border-edge bg-raised px-3 py-2 text-sm text-text1 outline-none focus:border-lime resize-y"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={busyAction === 'edit' || !draftBody.trim()}
                className="rounded-lg bg-lime px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-background disabled:opacity-50"
              >
                {busyAction === 'edit' ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setDraftBody(post.content)
                }}
                className="rounded-lg border border-edge px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-text2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-text1 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Media */}
        {post.media_url && (
          <MediaRenderer url={post.media_url} mediaType={post.media_type} />
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-edge">
        <button
          onClick={toggleLike}
          disabled={busyAction === 'like'}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold',
            'transition-all duration-150 hover:bg-background disabled:opacity-60',
            liked ? 'text-lime font-bold' : 'text-text2 hover:text-text1'
          ].join(' ')}
        >
          <span>{liked ? '⚽' : '⚽'}</span>
          <span>{liked ? 'Cheered' : 'Cheer'}{likeCount > 0 ? ` (${likeCount})` : ''}</span>
        </button>

        <div className="w-px bg-edge" />

        <button
          onClick={() => setShowComments(c => !c)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-text2 hover:text-text1 hover:bg-background transition-all duration-150"
        >
          <span>💬</span>
          <span>Comment {comments.length > 0 ? `(${comments.length})` : ''}</span>
        </button>

        <div className="w-px bg-edge" />

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-text2 hover:text-text1 hover:bg-background transition-all duration-150"
        >
          <span>↗️</span>
          <span>{copied ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {isOwner ? (
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-edge bg-background/40">
          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
            className="rounded-lg border border-edge px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-text1 hover:bg-raised"
          >
            {isEditing ? 'Close edit' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busyAction === 'delete'}
            className="rounded-lg border border-ruby/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ruby hover:bg-ruby/10 disabled:opacity-50"
          >
            {busyAction === 'delete' ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ) : null}

      {/* Comments Drawer */}
      {showComments && (
        <div className="bg-background/60 border-t border-edge p-4 space-y-3 animate-fade-up">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment…"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              className="flex-1 bg-raised border border-edge rounded-lg px-3 py-1.5 text-xs text-text1 outline-none focus:border-lime/50"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || busyAction === 'comment'}
              className="bg-lime text-background px-3 py-1.5 rounded-lg text-xs font-bold uppercase disabled:opacity-40"
            >
              {busyAction === 'comment' ? 'Posting…' : 'Post'}
            </button>
          </form>

          <div className="space-y-2">
            {commentsQ.isLoading ? (
              <div className="text-text3 text-xs text-center py-1 italic">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="text-text3 text-xs text-center py-1 italic">Be the first to comment!</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="bg-raised border border-edge/40 rounded-lg p-2.5 text-xs">
                  <div className="flex justify-between items-center text-text3 text-[10px] mb-1">
                    <span className="font-semibold text-lime">{c.author_name || c.author_email?.split('@')[0] || 'Commenter'}</span>
                    <span>{timeAgo(c.created_at)}</span>
                  </div>
                  <div className="text-text1 whitespace-pre-wrap">{c.comment}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  )
}

function EmptyFeed({ role }) {
  return (
    <div className="bg-lift border border-edge rounded-xl p-10 text-center">
      <div className="text-4xl mb-4">⚽</div>
      <div className="text-text1 font-semibold text-lg">Nothing here yet</div>
      <div className="text-text2 text-sm mt-2 max-w-xs mx-auto">
        {role === 'athlete'
          ? 'Share your first match update, YouTube video, or training photo!'
          : 'Be the first to post on the discovery feed!'}
      </div>
    </div>
  )
}

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
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          user_id,
          users:user_id (
            email,
            role,
            athlete_profiles (id, full_name, headline),
            club_profiles (id, club_name, league)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      return (data || []).map(post => {
        const authorUser = firstRecord(post.users)
        const athleteProfile = firstRecord(authorUser?.athlete_profiles)
        const clubProfile = firstRecord(authorUser?.club_profiles)
        return {
          id: post.id,
          user_id: post.user_id,
          is_current_user: post.user_id === user?.id,
          content: post.content,
          media_url: post.media_url,
          media_type: post.media_type,
          created_at: post.created_at,
          author_email: authorUser?.email,
          author_role: authorUser?.role,
          author_name: authorUser?.role === 'athlete' ? athleteProfile?.full_name : clubProfile?.club_name,
          author_headline: authorUser?.role === 'athlete' ? athleteProfile?.headline : clubProfile?.league,
          author_athlete_id: athleteProfile?.id,
          author_club_id: clubProfile?.id
        }
      })
    }
  })

  const createM = useMutation({
    mutationFn: async (payload) => {
      if (!user?.id) throw new Error('User session not found')
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: payload.body,
          media_url: payload.media_url || null,
          media_type: payload.media_type || null,
          user_id: user.id
        })
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] })
  })

  return (
    <div className="grid grid-cols-1 gap-5 items-start">

      {/* Main feed */}
      <div className="flex flex-col gap-4">
        <Composer
          user={user}
          onSubmit={payload => createM.mutateAsync(payload)}
          isSubmitting={createM.isPending}
        />

        {createM.isError && (
          <div className="bg-ruby/10 border border-ruby/20 text-ruby text-sm px-4 py-3 rounded-xl">
            Failed to post: {createM.error?.message || 'Unknown error'}
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
          postsQ.data.map(post => <PostCard key={post.id} post={{ ...post, currentUserId: user?.id, queryClient: qc }} />)
        )}
      </div>

    </div>
  )
}
