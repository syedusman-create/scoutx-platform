const SocialModel = require('../models/social.model')
const AuditModel = require('../models/audit.model')

const supportedProviders = ['instagram_business', 'instagram', 'x']

const oauthStart = async (req, res) => {
  try {
    const { provider } = req.params
    if (!supportedProviders.includes(provider)) {
      return res.status(400).json({ success: false, error: 'Unsupported provider' })
    }

    const normalized = SocialModel.normalizeProvider(provider)

    const integration = await SocialModel.upsertIntegration({
      userId: req.user.id,
      provider: normalized,
      status: 'disconnected'
    })

    if (normalized === 'instagram_business') {
      const appId = process.env.META_GRAPH_APP_ID
      const redirectUri = process.env.META_GRAPH_REDIRECT_URI
      const version = process.env.META_GRAPH_VERSION || 'v19.0'
      const scopes = process.env.META_GRAPH_SCOPES || 'instagram_basic,instagram_content_publish,pages_show_list'

      if (appId && redirectUri) {
        const oauthUrl = `https://www.facebook.com/${version}/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&state=${encodeURIComponent(integration.id)}&scope=${encodeURIComponent(scopes)}`

        return res.json({
          success: true,
          data: {
            provider: normalized,
            oauth_url: oauthUrl,
            integration_id: integration.id
          },
          message: 'OAuth URL generated'
        })
      }
    }

    // Fallback stub URL (dev-only).
    const redirectUrl = `https://example.com/oauth/${normalized}?state=${integration.id}`
    return res.json({
      success: true,
      data: {
        provider: normalized,
        oauth_url: redirectUrl,
        integration_id: integration.id
      },
      message: 'OAuth URL generated (stub)'
    })
  } catch (err) {
    console.error('oauthStart error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const oauthCallback = async (req, res) => {
  try {
    const { provider } = req.params
    const normalized = SocialModel.normalizeProvider(provider)
    if (!['instagram_business', 'x'].includes(normalized)) {
      return res.status(400).json({ success: false, error: 'Unsupported provider' })
    }

    const { code, state } = req.query
    if (!code || !state) {
      return res.status(400).json({ success: false, error: 'Missing OAuth callback parameters' })
    }

    const integration = await SocialModel.getIntegrationForUser({
      userId: req.user.id,
      provider: normalized
    })
    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' })
    }

    let token = null

    if (normalized === 'instagram_business') {
      const appId = process.env.META_GRAPH_APP_ID
      const appSecret = process.env.META_GRAPH_APP_SECRET
      const redirectUri = process.env.META_GRAPH_REDIRECT_URI
      const version = process.env.META_GRAPH_VERSION || 'v19.0'
      const scopes = process.env.META_GRAPH_SCOPES || 'instagram_basic,instagram_content_publish,pages_show_list'

      if (appId && appSecret && redirectUri) {
        const tokenUrl = `https://graph.facebook.com/${version}/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(
          appSecret
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`

        const tokenRes = await fetch(tokenUrl)
        const tokenJson = await tokenRes.json()

        if (!tokenJson?.access_token) {
          return res.status(400).json({ success: false, error: tokenJson?.error?.message || 'Token exchange failed' })
        }

        token = await SocialModel.saveTokens({
          integrationId: integration.id,
          accessToken: tokenJson.access_token,
          refreshToken: null,
          expiresAt: tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000) : null,
          scopes
        })

        // Discover the Instagram Business account bound to the user's pages.
        const pagesUrl = `https://graph.facebook.com/${version}/me/accounts?fields=id,instagram_business_account&access_token=${encodeURIComponent(
          tokenJson.access_token
        )}`
        const pagesRes = await fetch(pagesUrl)
        const pagesJson = await pagesRes.json()

        const firstPage = pagesJson?.data?.find((p) => p?.instagram_business_account?.id)
        const igAccountId = firstPage?.instagram_business_account?.id

        if (igAccountId) {
          const igUserUrl = `https://graph.facebook.com/${version}/${igAccountId}?fields=username&access_token=${encodeURIComponent(
            tokenJson.access_token
          )}`
          const igUserRes = await fetch(igUserUrl)
          const igUserJson = await igUserRes.json()

          const username = igUserJson?.username || igAccountId
          const profileUrl = username ? `https://www.instagram.com/${username}` : null

          await SocialModel.upsertSocialAccount({
            integrationId: integration.id,
            providerAccountId: igAccountId,
            displayName: username,
            profileUrl
          })
        }
      }
    }

    // Fallback stub tokens when credentials are not configured.
    if (!token) {
      token = await SocialModel.saveTokens({
        integrationId: integration.id,
        accessToken: `stub_access_${normalized}_${Date.now()}`,
        refreshToken: `stub_refresh_${normalized}_${Date.now()}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        scopes: normalized === 'x' ? 'tweet.write users.read offline.access' : 'instagram_basic instagram_content_publish'
      })
    }

    const updatedIntegration = await SocialModel.upsertIntegration({
      userId: req.user.id,
      provider: normalized,
      status: 'connected'
    })

    await AuditModel.createAuditLog({
      actorUserId: req.user.id,
      action: 'social.integration.oauth.connected',
      tableName: 'social_integrations',
      rowPk: updatedIntegration.id,
      beforeJson: null,
      afterJson: updatedIntegration,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    return res.json({
      success: true,
      data: {
        integration: updatedIntegration,
        token: {
          id: token.id,
          expires_at: token.expires_at,
          scopes: token.scopes
        }
      },
      message: 'Integration connected'
    })
  } catch (err) {
    console.error('oauthCallback error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listIntegrations = async (req, res) => {
  try {
    const rows = await SocialModel.listIntegrationsForUser(req.user.id)
    return res.json({ success: true, data: rows })
  } catch (err) {
    console.error('listIntegrations error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  oauthStart,
  oauthCallback,
  listIntegrations
}
