const { pool } = require('../config/db')

const normalizeProvider = (provider) => {
  if (provider === 'instagram' || provider === 'instagram_business') return 'instagram_business'
  if (provider === 'x' || provider === 'twitter') return 'x'
  return provider
}

const upsertIntegration = async ({ userId, provider, status }) => {
  const p = normalizeProvider(provider)
  const result = await pool.query(
    `INSERT INTO social_integrations (user_id, provider, status, updated_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT (user_id, provider)
     DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
     RETURNING *`,
    [userId, p, status]
  )
  return result.rows[0]
}

const getIntegrationForUser = async ({ userId, provider }) => {
  const p = normalizeProvider(provider)
  const result = await pool.query(
    `SELECT * FROM social_integrations
     WHERE user_id = $1 AND provider = $2`,
    [userId, p]
  )
  return result.rows[0] || null
}

const saveTokens = async ({ integrationId, accessToken, refreshToken, expiresAt, scopes }) => {
  const result = await pool.query(
    `INSERT INTO social_tokens (integration_id, access_token, refresh_token, expires_at, scopes, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (integration_id)
     DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       expires_at = EXCLUDED.expires_at,
       scopes = EXCLUDED.scopes,
       updated_at = NOW()
     RETURNING *`,
    [integrationId, accessToken || null, refreshToken || null, expiresAt || null, scopes || null]
  )
  return result.rows[0]
}

const listIntegrationsForUser = async (userId) => {
  const result = await pool.query(
    `SELECT i.*, t.access_token, t.expires_at, t.scopes, t.refresh_token
     FROM social_integrations i
     LEFT JOIN social_tokens t ON t.integration_id = i.id
     WHERE i.user_id = $1
     ORDER BY i.created_at DESC`,
    [userId]
  )
  return result.rows
}

const upsertSocialAccount = async ({ integrationId, providerAccountId, displayName, profileUrl }) => {
  const result = await pool.query(
    `INSERT INTO social_accounts (integration_id, provider_account_id, display_name, profile_url)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (integration_id, provider_account_id)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       profile_url = EXCLUDED.profile_url
     RETURNING *`,
    [integrationId, providerAccountId, displayName || null, profileUrl || null]
  )
  return result.rows[0]
}

const getSocialAccountByIntegrationId = async (integrationId) => {
  const result = await pool.query(
    `SELECT * FROM social_accounts
     WHERE integration_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [integrationId]
  )
  return result.rows[0] || null
}

const createSocialPost = async ({ authorUserId, body, mediaUrl, scheduledAt }) => {
  const result = await pool.query(
    `INSERT INTO social_posts (author_user_id, body, media_url, status, scheduled_at)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [authorUserId, body, mediaUrl || null, scheduledAt ? 'queued' : 'draft', scheduledAt || null]
  )
  return result.rows[0]
}

const listSocialPosts = async ({ page = 1, limit = 20 }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const safePage = Math.max(Number(page) || 1, 1)
  const offset = (safePage - 1) * safeLimit

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM social_posts`)
  const total = totalRes.rows[0]?.total || 0

  const rowsRes = await pool.query(
    `SELECT p.*, u.email AS author_email
     FROM social_posts p
     LEFT JOIN users u ON u.id = p.author_user_id
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  )

  return {
    posts: rowsRes.rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  }
}

const getSocialPostById = async (postId) => {
  const result = await pool.query(`SELECT * FROM social_posts WHERE id = $1`, [postId])
  return result.rows[0] || null
}

const createDelivery = async ({ socialPostId, integrationId, destinationName, status, providerPostId, error, sentAt }) => {
  const result = await pool.query(
    `INSERT INTO social_post_deliveries
      (social_post_id, integration_id, destination_name, status, provider_post_id, error, sent_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [socialPostId, integrationId, destinationName || null, status, providerPostId || null, error || null, sentAt || null]
  )
  return result.rows[0]
}

const updateSocialPostStatus = async ({ postId, status }) => {
  const result = await pool.query(
    `UPDATE social_posts
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, postId]
  )
  return result.rows[0] || null
}

module.exports = {
  normalizeProvider,
  upsertIntegration,
  getIntegrationForUser,
  saveTokens,
  listIntegrationsForUser,
  upsertSocialAccount,
  getSocialAccountByIntegrationId,
  createSocialPost,
  listSocialPosts,
  getSocialPostById,
  createDelivery,
  updateSocialPostStatus
}
