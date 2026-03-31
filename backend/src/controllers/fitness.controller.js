const AthleteModel = require('../models/athlete.model')
const FitnessModel = require('../models/fitness.model')
const { fitnessTestCreateSchema, fitnessTestUpdateSchema, validate } = require('../utils/validators')

const getFitnessTests = async (req, res) => {
  try {
    const { athleteId } = req.params
    const tests = await FitnessModel.getFitnessTestsByAthleteId(athleteId)
    return res.json({ success: true, data: tests })
  } catch (err) {
    console.error('getFitnessTests error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const createFitnessTest = async (req, res) => {
  try {
    const { athleteId } = req.params
    const { role, id: userId } = req.user

    const { test_type, score, unit, tested_at, location, notes } = req.body

    const payload = {
      test_type,
      score,
      unit,
      tested_at,
      location,
      notes
    }

    const { error, value } = validate(fitnessTestCreateSchema, payload)
    if (error) return res.status(400).json({ success: false, error })

    if (role === 'athlete') {
      const athlete = await AthleteModel.getAthleteById(athleteId)
      if (!athlete || athlete.user_id !== userId) return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const result = await FitnessModel.createFitnessTestAndRecalculate({
      athleteId,
      payload: value,
      certifiedBy: role === 'athlete' ? null : userId
    })

    return res.json({
      success: true,
      data: { ...result, athlete_id: athleteId },
      message: 'Fitness test added'
    })
  } catch (err) {
    console.error('createFitnessTest error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateFitnessTest = async (req, res) => {
  try {
    const { testId } = req.params
    const { role, id: userId } = req.user

    const { test_type, score, unit, tested_at, location, notes } = req.body

    const updates = { test_type, score, unit, tested_at, location, notes }
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

    const { error, value } = validate(fitnessTestUpdateSchema, updates)
    if (error) return res.status(400).json({ success: false, error })

    let result = null
    if (role === 'admin') {
      result = await FitnessModel.updateFitnessTestForAdmin({ testId, updates: value })
    } else {
      result = await FitnessModel.updateFitnessTestAndRecalculateForOwner({ testId, userId, updates: value })
    }

    if (!result) return res.status(404).json({ success: false, error: 'Fitness test not found' })

    return res.json({ success: true, data: result, message: 'Fitness test updated' })
  } catch (err) {
    console.error('updateFitnessTest error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const deleteFitnessTest = async (req, res) => {
  try {
    return res.status(501).json({ success: false, error: 'Not implemented' })
  } catch (err) {
    console.error('deleteFitnessTest error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  getFitnessTests,
  createFitnessTest,
  updateFitnessTest,
  deleteFitnessTest
}

