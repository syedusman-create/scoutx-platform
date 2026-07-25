const express = require('express')
const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { listAchievements, listMyAchievements } = require('../controllers/achievement.controller')

const router = express.Router()

router.get('/', auth, requireRole('athlete', 'club', 'scout', 'admin'), listAchievements)
router.get('/me', auth, requireRole('athlete', 'club', 'scout', 'admin'), listMyAchievements)

module.exports = router
