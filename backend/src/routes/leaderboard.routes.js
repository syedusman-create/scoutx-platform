const express = require('express')
const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { listLeaderboards, listSportLeaderboards } = require('../controllers/leaderboard.controller')

const router = express.Router()

router.get('/', auth, requireRole('athlete', 'club', 'scout', 'admin'), listLeaderboards)
router.get('/sports', auth, requireRole('athlete', 'club', 'scout', 'admin'), listSportLeaderboards)

module.exports = router
