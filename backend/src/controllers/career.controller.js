const AthleteModel = require('../models/athlete.model')
const CareerModel = require('../models/career.model')
const { careerEntryCreateSchema, careerEntryUpdateSchema, validate } = require('../utils/validators')

const getCareerByAthleteId = async (req, res) => {
  try {
    const { athleteId } = req.params
    const entries = await CareerModel.getCareerEntriesByAthleteId(athleteId)
    return res.json({ success: true, data: entries })
  } catch (err) {
    console.error('getCareerByAthleteId error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const createCareerEntry = async (req, res) => {
  try {
    const { athleteId } = req.params
    const { role, id: userId } = req.user

    const {
      club_name,
      role: careerRole,
      competition,
      start_date,
      end_date,
      matches,
      goals,
      assists,
      clean_sheets,
      pass_accuracy,
      avg_rating,
      is_verified,
      is_current
    } = req.body

    const payload = {
      athlete_id: athleteId,
      club_name,
      role: careerRole,
      competition,
      start_date,
      end_date,
      matches,
      goals,
      assists,
      clean_sheets,
      pass_accuracy,
      avg_rating,
      is_verified,
      is_current
    }

    const { error, value } = validate(careerEntryCreateSchema, payload)
    if (error) {
      return res.status(400).json({ success: false, error })
    }

    if (role === 'athlete') {
      const athlete = await AthleteModel.getAthleteByUserId(userId)
      if (!athlete || athlete.id !== athleteId) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }
    }

    const entry = await CareerModel.createCareerEntry(value)
    return res.json({ success: true, data: entry, message: 'Career entry created' })
  } catch (err) {
    console.error('createCareerEntry error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateCareerEntry = async (req, res) => {
  try {
    const { careerId } = req.params
    const { role, id: userId } = req.user

    const {
      club_name,
      role: careerRole,
      competition,
      start_date,
      end_date,
      matches,
      goals,
      assists,
      clean_sheets,
      pass_accuracy,
      avg_rating,
      is_verified,
      is_current
    } = req.body

    const updates = {
      club_name,
      role: careerRole,
      competition,
      start_date,
      end_date,
      matches,
      goals,
      assists,
      clean_sheets,
      pass_accuracy,
      avg_rating,
      is_verified,
      is_current
    }

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

    const { error, value } = validate(careerEntryUpdateSchema, updates)
    if (error) {
      return res.status(400).json({ success: false, error })
    }

    let entry = null
    if (role === 'admin') {
      entry = await CareerModel.updateCareerEntryForAdmin({ careerId, updates: value })
    } else {
      entry = await CareerModel.updateCareerEntryForOwner({ careerId, userId, updates: value })
    }

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Career entry not found' })
    }

    return res.json({ success: true, data: entry, message: 'Career entry updated' })
  } catch (err) {
    console.error('updateCareerEntry error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const deleteCareerEntry = async (req, res) => {
  try {
    const { careerId } = req.params
    const { role, id: userId } = req.user

    let entry = null
    if (role === 'admin') {
      entry = await CareerModel.deleteCareerEntryForAdmin(careerId)
    } else {
      entry = await CareerModel.deleteCareerEntryForOwner({ careerId, userId })
    }

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Career entry not found' })
    }

    return res.json({ success: true, data: entry, message: 'Career entry deleted' })
  } catch (err) {
    console.error('deleteCareerEntry error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  getCareerByAthleteId,
  createCareerEntry,
  updateCareerEntry,
  deleteCareerEntry
}

