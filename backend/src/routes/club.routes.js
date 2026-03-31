const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const { getClubProfile, getMyClubProfile, updateClubProfile, updateMyClubProfile } = require('../controllers/club.controller')

router.get('/me', auth, requireRole('club'), getMyClubProfile)
router.put('/me', auth, requireRole('club', 'admin'), updateMyClubProfile)
router.get('/:id', auth, requireRole('athlete', 'club', 'scout', 'admin'), getClubProfile)
router.put('/:id', auth, requireRole('club', 'admin'), updateClubProfile)

module.exports = router

