import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listSocialPostsApi,
  createSocialPostApi,
  publishSocialPostApi,
  listIntegrationsApi
} from '../../api/social.api'

const PROVIDERS = ['instagram_business', 'x']

export default function AdminSocialPosting() {
  const qc = useQueryClient()
  const [body, setBody] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [providers, setProviders] = useState(['instagram_business'])
  const [msg, setMsg] = useState('')

  const integrationsQ = useQuery({
    queryKey: ['admin-integrations-for-social'],
    queryFn: async () => (await listIntegrationsApi()).data.data || []
  })
  const postsQ = useQuery({
    queryKey: ['admin-social-posts-list'],
    queryFn: async () => (await listSocialPostsApi()).data.data || []
  })

  const integrationStatus = useMemo(() => {
    const map = {}
    for (const i of integrationsQ.data || []) map[i.provider] = i.status
    return map
  }, [integrationsQ.data])

  const createM = useMutation({
    mutationFn: createSocialPostApi,
    onSuccess: async () => {
      setMsg('Draft created')
      setBody('')
      setMediaUrl('')
      await qc.invalidateQueries({ queryKey: ['admin-social-posts-list'] })
    },
    onError: (e) => setMsg(e?.response?.data?.error || 'Failed to create draft')
  })

  const publishM = useMutation({
    mutationFn: async (postId) => publishSocialPostApi(postId, providers),
    onSuccess: async () => {
      setMsg('Publish request sent')
      await qc.invalidateQueries({ queryKey: ['admin-social-posts-list'] })
    },
    onError: (e) => setMsg(e?.response?.data?.error || 'Failed to publish')
  })

  const posts = postsQ.data || []

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-display text-2xl tracking-wide">Social Posting</div>
            <div className="text-text2 text-sm mt-1">Create drafts and publish to connected providers.</div>
          </div>
          {msg ? <div className="text-text2 text-sm">{msg}</div> : null}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <textarea
              className="w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 min-h-[120px]"
              placeholder="Write caption / post body..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <input
              className="mt-3 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1"
              placeholder="Media URL (optional, required for IG posting)..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <label key={p} className="inline-flex items-center gap-2 text-text2 text-sm">
                  <input
                    type="checkbox"
                    checked={providers.includes(p)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setProviders((prev) => (checked ? [...prev, p] : prev.filter((x) => x !== p)))
                    }}
                    className="accent-lime"
                  />
                  {p}
                  <span className="text-text3 text-xs">{integrationStatus[p] === 'connected' ? 'connected' : 'not connected'}</span>
                </label>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                className="btn-primary text-xs"
                onClick={() => createM.mutate({ body, media_url: mediaUrl || null })}
                disabled={createM.isPending || !body.trim()}
              >
                {createM.isPending ? 'Creating...' : 'Create Draft'}
              </button>
              <button
                className="btn-ghost text-xs"
                onClick={() => {
                  setBody('')
                  setMediaUrl('')
                  setMsg('')
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="text-text1 font-semibold mb-2">Connected Providers</div>
            <div className="space-y-2">
              {PROVIDERS.map((p) => (
                <div key={p} className="rounded-md border border-edge p-3 bg-raised">
                  <div className="text-text1 text-sm">{p}</div>
                  <div className="text-text2 text-xs mt-1">Status: {integrationStatus[p] || 'disconnected'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-display text-2xl tracking-wide">Drafts & Posts</div>
          <div className="text-text2 text-sm">{posts.length} total</div>
        </div>

        <div className="mt-4 space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-md border border-edge p-3 bg-raised">
              <div className="text-text1 text-sm font-semibold">{p.body}</div>
              <div className="text-text2 text-xs mt-1">
                Status: {p.status} • Author: {p.author_email || '—'} • {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
              </div>
              <div className="mt-2 flex gap-2 items-center">
                <button
                  className="btn-primary text-xs"
                  disabled={publishM.isPending || providers.length === 0}
                  onClick={() => publishM.mutate(p.id)}
                >
                  {publishM.isPending ? 'Publishing...' : `Publish to ${providers.join(', ')}`}
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 ? <div className="text-text2">No social posts yet.</div> : null}
        </div>
      </div>
    </div>
  )
}

