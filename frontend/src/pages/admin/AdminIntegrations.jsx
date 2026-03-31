import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listIntegrationsApi } from '../../api/social.api'
import { startIntegrationApi } from '../../api/integration.api'

const PROVIDERS = ['instagram_business', 'x']

export default function AdminIntegrations() {
  const qc = useQueryClient()
  const [msg, setMsg] = useState('')

  const integrationsQ = useQuery({
    queryKey: ['admin-integrations'],
    queryFn: async () => (await listIntegrationsApi()).data.data || []
  })

  const startM = useMutation({
    mutationFn: async (provider) => startIntegrationApi(provider),
    onSuccess: (res) => {
      const url = res?.data?.data?.oauth_url
      const integrationId = res?.data?.data?.integration_id
      if (!url) {
        setMsg('OAuth URL not returned. Backend may still be stubbed.')
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
      setMsg(`Opened OAuth for ${res.data.data.provider}. Integration: ${integrationId}. After approval, come back and press Refresh.`)
    },
    onError: (e) => setMsg(e?.response?.data?.error || 'Failed to start OAuth')
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-edge rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-display text-2xl tracking-wide">Social Integrations</div>
            <div className="text-text2 text-sm mt-1">Connect Instagram Business and X accounts via OAuth.</div>
          </div>
          <div className="text-text2 text-sm">{msg}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary text-xs" onClick={() => startM.mutate('instagram_business')} disabled={startM.isPending}>
            {startM.isPending ? 'Starting...' : 'Connect Instagram'}
          </button>
          <button className="btn-ghost text-xs" onClick={() => startM.mutate('x')} disabled={startM.isPending}>
            Connect X
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={async () => {
              await qc.invalidateQueries({ queryKey: ['admin-integrations'] })
              setMsg('Refreshed integrations.')
            }}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {integrationsQ.data?.length ? (
            integrationsQ.data.map((i) => (
              <div key={i.id} className="rounded-md border border-edge p-3 bg-raised">
                <div className="text-text1 text-sm font-semibold">{i.provider}</div>
                <div className="text-text2 text-xs mt-1">
                  Status: {i.status} {i.expires_at ? `• Expires: ${new Date(i.expires_at).toLocaleString()}` : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="text-text2">No integrations yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

