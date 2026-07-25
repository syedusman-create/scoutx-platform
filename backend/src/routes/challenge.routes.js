const express = require('express')
const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const {
  listChallenges,
  createChallenge,
  joinChallenge,
  leaveChallenge,
  listMyChallengeProgress
} = require('../controllers/challenge.controller')

const router = express.Router()

router.get('/', auth, requireRole('athlete', 'club', 'scout', 'admin'), listChallenges)
router.post('/', auth, requireRole('admin'), createChallenge)
router.get('/me', auth, requireRole('athlete', 'club', 'scout', 'admin'), listMyChallengeProgress)
router.post('/:challengeId/join', auth, requireRole('athlete', 'club', 'scout', 'admin'), joinChallenge)
router.post('/:challengeId/leave', auth, requireRole('athlete', 'club', 'scout', 'admin'), leaveChallenge)

module.exports = router
