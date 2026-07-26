const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { searchUsers } = require('../controllers/user.controller')

router.get('/search', auth, requireRole('athlete', 'club', 'scout', 'admin'), searchUsers)

module.exports = router
