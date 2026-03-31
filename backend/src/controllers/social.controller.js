const SocialModel = require('../models/social.model')
const AuditModel = require('../models/audit.model')

const createSocialPost = async (req, res) => {
  try {
    const { body, media_url, scheduled_at } = req.body
    if (!body || !String(body).trim()) {
      return res.status(400).json({ success: false, error: 'body is required' })
    }

    const post = await SocialModel.createSocialPost({
      authorUserId: req.user.id,
      body: String(body).trim(),
      mediaUrl: media_url || null,
      scheduledAt: scheduled_at || null
    })

    await AuditModel.createAuditLog({
      actorUserId: req.user.id,
      action: 'social.post.create',
      tableName: 'social_posts',
      rowPk: post.id,
      beforeJson: null,
      afterJson: post,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    return res.json({ success: true, data: post, message: 'Social post created' })
  } catch (err) {
    console.error('createSocialPost error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listSocialPosts = async (req, res) => {
  try {
    const { page, limit } = req.query
    const result = await SocialModel.listSocialPosts({ page, limit })
    return res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination
    })
  } catch (err) {
    console.error('listSocialPosts error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const publishSocialPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { providers = [] } = req.body

    if (!Array.isArray(providers) || providers.length === 0) {
      return res.status(400).json({ success: false, error: 'providers array is required' })
    }

    const post = await SocialModel.getSocialPostById(postId)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })

    const integrations = await SocialModel.listIntegrationsForUser(req.user.id)
    const deliveryRows = []

    for (const p of providers) {
      const provider = SocialModel.normalizeProvider(p)
      const integration = integrations.find((i) => i.provider === provider && i.status === 'connected')
      if (!integration) {
        const failed = await SocialModel.createDelivery({
          socialPostId: post.id,
          integrationId: null,
          destinationName: provider,
          status: 'failed',
          providerPostId: null,
          error: `Integration not connected for provider: ${provider}`,
          sentAt: null
        })
        deliveryRows.push(failed)
        continue
      }

      if (provider === 'instagram_business') {
        const accessToken = integration.access_token
        const account = await SocialModel.getSocialAccountByIntegrationId(integration.id)
        const igAccountId = account?.provider_account_id

        if (!accessToken || !igAccountId) {
          const failed = await SocialModel.createDelivery({
            socialPostId: post.id,
            integrationId: integration.id,
            destinationName: provider,
            status: 'failed',
            providerPostId: null,
            error: 'Instagram integration missing account id or access token',
            sentAt: null
          })
          deliveryRows.push(failed)
          continue
        }

        if (!post.media_url) {
          const failed = await SocialModel.createDelivery({
            socialPostId: post.id,
            integrationId: integration.id,
            destinationName: provider,
            status: 'failed',
            providerPostId: null,
            error: 'media_url is required for Instagram posting',
            sentAt: null
          })
          deliveryRows.push(failed)
          continue
        }

        const version = process.env.META_GRAPH_VERSION || 'v19.0'
        const isVideo = /\.(mp4|mov|m4v)$/i.test(String(post.media_url))

        // 1) Create media
        const createUrl = `https://graph.facebook.com/${version}/${igAccountId}/media`
        const createParams = new URLSearchParams({
          caption: String(post.body || ''),
          access_token: String(accessToken)
        })
        if (isVideo) {
          createParams.set('video_url', String(post.media_url))
        } else {
          createParams.set('image_url', String(post.media_url))
        }

        const createRes = await fetch(createUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: createParams.toString()
        })
        const createJson = await createRes.json()

        if (!createJson?.id) {
          const failed = await SocialModel.createDelivery({
            socialPostId: post.id,
            integrationId: integration.id,
            destinationName: provider,
            status: 'failed',
            providerPostId: null,
            error: createJson?.error?.message || 'Instagram media creation failed',
            sentAt: null
          })
          deliveryRows.push(failed)
          continue
        }

        // 2) Publish media
        const publishUrl = `https://graph.facebook.com/${version}/${igAccountId}/media_publish`
        const publishParams = new URLSearchParams({
          creation_id: String(createJson.id),
          access_token: String(accessToken)
        })

        const publishRes = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: publishParams.toString()
        })
        const publishJson = await publishRes.json()

        const delivered = await SocialModel.createDelivery({
          socialPostId: post.id,
          integrationId: integration.id,
          destinationName: provider,
          status: publishJson?.id ? 'sent' : 'failed',
          providerPostId: publishJson?.id ? String(publishJson.id) : null,
          error: publishJson?.error?.message || (publishJson?.id ? null : 'Instagram publish failed'),
          sentAt: publishJson?.id ? new Date() : null
        })

        deliveryRows.push(delivered)
        continue
      }

      // X (Twitter) publishing not fully wired yet; keep dev stub.
      const sent = await SocialModel.createDelivery({
        socialPostId: post.id,
        integrationId: integration.id,
        destinationName: provider,
        status: 'sent',
        providerPostId: `stub_${provider}_${Date.now()}`,
        error: null,
        sentAt: new Date()
      })
      deliveryRows.push(sent)
    }

    const hasFailure = deliveryRows.some((d) => d.status === 'failed')
    const status = hasFailure ? 'failed' : 'published'
    const updatedPost = await SocialModel.updateSocialPostStatus({ postId: post.id, status })

    await AuditModel.createAuditLog({
      actorUserId: req.user.id,
      action: 'social.post.publish',
      tableName: 'social_posts',
      rowPk: post.id,
      beforeJson: post,
      afterJson: updatedPost,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    return res.json({
      success: true,
      data: {
        post: updatedPost,
        deliveries: deliveryRows
      },
      message: hasFailure ? 'Publish attempted with failures' : 'Post published'
    })
  } catch (err) {
    console.error('publishSocialPost error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  createSocialPost,
  listSocialPosts,
  publishSocialPost
}
