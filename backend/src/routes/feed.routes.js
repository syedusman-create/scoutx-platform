const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { listPosts, createPost } = require('../controllers/feed.controller')

router.get('/', auth, requireRole('athlete', 'club', 'scout', 'admin'), listPosts)
router.post('/', auth, requireRole('athlete', 'club', 'scout', 'admin'), createPost)

module.exports = router

