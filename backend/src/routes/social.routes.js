const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { createSocialPost, listSocialPosts, publishSocialPost } = require('../controllers/social.controller')

router.get('/posts', auth, requireRole('admin'), listSocialPosts)
router.post('/posts', auth, requireRole('admin'), createSocialPost)
router.post('/posts/:postId/publish', auth, requireRole('admin'), publishSocialPost)

module.exports = router
