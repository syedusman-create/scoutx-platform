const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  applyToOpportunity,
  updateApplicationStatus,
  getApplicationsByAthlete,
  getMyApplications,
  createShortlist,
  listShortlists
} = require('../controllers/opportunity.controller')

router.get('/', auth, requireRole('athlete', 'club', 'scout', 'admin'), listOpportunities)
router.post('/', auth, requireRole('club', 'admin'), createOpportunity)
router.put('/:opportunityId', auth, requireRole('club', 'admin'), updateOpportunity)
router.delete('/:opportunityId', auth, requireRole('club', 'admin'), deleteOpportunity)

router.put('/applications/:applicationId/status', auth, requireRole('club', 'admin'), updateApplicationStatus)
router.get('/applications/me', auth, requireRole('athlete'), getMyApplications)
router.get('/applications/athlete/:athleteId', auth, requireRole('athlete', 'admin'), getApplicationsByAthlete)

router.post('/shortlists/:athleteId', auth, requireRole('club', 'admin'), createShortlist)
router.get('/shortlists', auth, requireRole('club', 'admin'), listShortlists)

router.get('/:opportunityId', auth, requireRole('athlete', 'club', 'scout', 'admin'), getOpportunity)
router.post('/:opportunityId/apply', auth, requireRole('athlete', 'admin'), applyToOpportunity)

module.exports = router
