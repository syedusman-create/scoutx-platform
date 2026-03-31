const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const { getFitnessTests, createFitnessTest, updateFitnessTest, deleteFitnessTest } = require('../controllers/fitness.controller')

router.get('/athlete/:athleteId', auth, requireRole('athlete', 'club', 'scout', 'admin'), getFitnessTests)
router.post('/athlete/:athleteId', auth, requireRole('athlete', 'club', 'admin'), createFitnessTest)
router.put('/test/:testId', auth, requireRole('athlete', 'club', 'admin'), updateFitnessTest)
router.delete('/test/:testId', auth, requireRole('admin'), deleteFitnessTest)

module.exports = router

