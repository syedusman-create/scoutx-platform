const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { oauthStart, oauthCallback, listIntegrations } = require('../controllers/integration.controller')

router.get('/', auth, requireRole('admin'), listIntegrations)
router.get('/:provider/oauth/start', auth, requireRole('admin'), oauthStart)
router.get('/:provider/oauth/callback', auth, requireRole('admin'), oauthCallback)

module.exports = router
