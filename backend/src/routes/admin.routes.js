const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const {
  getOverview,
  listUsers,
  setUserRole,
  setAthleteVerification,
  setClubVerification,
  listAuditLogs,
  listAthletes,
  listClubs
} = require('../controllers/admin.controller')

router.get('/overview', auth, requireRole('admin'), getOverview)
router.get('/users', auth, requireRole('admin'), listUsers)
router.put('/users/:userId/role', auth, requireRole('admin'), setUserRole)

router.put('/athletes/:athleteId/verify', auth, requireRole('admin'), setAthleteVerification)
router.put('/clubs/:clubId/verify', auth, requireRole('admin'), setClubVerification)

router.get('/audit-logs', auth, requireRole('admin'), listAuditLogs)

router.get('/athletes', auth, requireRole('admin'), listAthletes)
router.get('/clubs', auth, requireRole('admin'), listClubs)

module.exports = router
