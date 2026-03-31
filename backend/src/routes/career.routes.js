const express = require('express')

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const {
  getCareerByAthleteId,
  createCareerEntry,
  updateCareerEntry,
  deleteCareerEntry
} = require('../controllers/career.controller')

const router = express.Router()

router.get('/:athleteId', auth, requireRole('athlete', 'club', 'scout', 'admin'), getCareerByAthleteId)
router.post('/:athleteId', auth, requireRole('athlete', 'admin'), createCareerEntry)
router.put('/entry/:careerId', auth, requireRole('athlete', 'admin'), updateCareerEntry)
router.delete('/entry/:careerId', auth, requireRole('athlete', 'admin'), deleteCareerEntry)

module.exports = router

