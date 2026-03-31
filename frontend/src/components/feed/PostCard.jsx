import React from 'react'

export default function PostCard({ post }) {
  const [imageBroken, setImageBroken] = React.useState(false)
  if (!post) return null
  const mediaUrl = post.media_url || ''
  const isKnownDeadPlaceholder = mediaUrl.includes('via.placeholder.com')
  const showImage = post.media_type === 'image' && !imageBroken && !isKnownDeadPlaceholder

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-text1 font-semibold text-sm">{post.author_email}</div>
          <div className="text-text2 text-xs">{post.author_role}</div>
        </div>
        <div className="text-text2 text-xs font-mono">{new Date(post.created_at).toLocaleString()}</div>
      </div>

      <div className="mt-3 text-text1 leading-relaxed whitespace-pre-wrap">{post.body}</div>

      {post.media_url ? (
        <div className="mt-3">
          {showImage ? (
            <a
              href={post.media_url}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <img
                src={post.media_url}
                alt="Post media"
                onError={() => setImageBroken(true)}
                className="max-h-[220px] w-full rounded-xl border border-edge object-contain bg-background"
              />
            </a>
          ) : post.media_type === 'image' ? (
            <div className="rounded-xl border border-edge bg-background p-3 text-text2 text-xs">
              Image preview unavailable. Open media link from source if needed.
            </div>
          ) : post.media_type === 'video' ? (
            <a
              href={post.media_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-lime text-xs font-bold"
            >
              <span className="h-7 w-7 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center">
                ▶
              </span>
              Play video
            </a>
          ) : (
            <a href={post.media_url} target="_blank" rel="noreferrer" className="text-lime text-xs font-bold">
              View media
            </a>
          )}
        </div>
      ) : null}
    </div>
  )
}


