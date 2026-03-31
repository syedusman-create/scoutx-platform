const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const { getAthleteProfile, getMyAthleteProfile, updateAthleteProfile, updateMyAthleteProfile, searchAthletes, getAthleteAnalytics } = require('../controllers/athlete.controller')

router.get('/', auth, requireRole('athlete', 'club', 'scout', 'admin'), searchAthletes)
router.get('/me', auth, requireRole('athlete'), getMyAthleteProfile)
router.put('/me', auth, requireRole('athlete', 'admin'), updateMyAthleteProfile)
router.get('/:id', auth, requireRole('athlete', 'club', 'scout', 'admin'), getAthleteProfile)
router.get('/:id/analytics', auth, requireRole('athlete', 'club', 'scout', 'admin'), getAthleteAnalytics)
router.put('/:id', auth, requireRole('athlete', 'admin'), updateAthleteProfile)

module.exports = router

