const ClubModel = require('../models/club.model')
const AthleteModel = require('../models/athlete.model')
const OpportunityModel = require('../models/opportunity.model')
const { opportunityCreateSchema, opportunityUpdateSchema, validate, applicationStatusUpdateSchema, shortlistCreateSchema } = require('../utils/validators')

const isOpportunityExpired = (opportunity) => {
  if (!opportunity?.expires_at) return false
  return new Date(opportunity.expires_at) < new Date()
}

const listOpportunities = async (req, res) => {
  try {
    const { role } = req.user

    let clubId = null
    let onlyActive = true

    if (role === 'club') {
      const club = await ClubModel.getClubByUserId(req.user.id)
      if (!club) return res.status(403).json({ success: false, error: 'Club profile not found' })
      clubId = club.id
    }

    const opportunities = await OpportunityModel.listOpportunities({ onlyActive, clubId })
    return res.json({ success: true, data: opportunities })
  } catch (err) {
    console.error('listOpportunities error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getOpportunity = async (req, res) => {
  try {
    const { opportunityId } = req.params
    const opp = await OpportunityModel.getOpportunityById(opportunityId)
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' })
    return res.json({ success: true, data: opp })
  } catch (err) {
    console.error('getOpportunity error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const createOpportunity = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    const {
      title,
      position,
      contract_type,
      trial_date,
      venue,
      description,
      min_fitness,
      max_age,
      min_height_cm,
      is_active,
      expires_at
    } = req.body

    const payload = {
      title,
      position,
      contract_type,
      trial_date,
      venue,
      description,
      min_fitness,
      max_age,
      min_height_cm,
      is_active,
      expires_at
    }

    const { error, value } = validate(opportunityCreateSchema, payload)
    if (error) return res.status(400).json({ success: false, error })

    let clubId = null
    if (role === 'club') {
      const club = await ClubModel.getClubByUserId(userId)
      if (!club) return res.status(403).json({ success: false, error: 'Club profile not found' })
      clubId = club.id
    } else if (role === 'admin') {
      const { club_id } = req.body
      if (!club_id) return res.status(400).json({ success: false, error: 'club_id is required for admin' })
      clubId = club_id
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const created = await OpportunityModel.createOpportunity({ clubId, payload: value })
    return res.json({ success: true, data: created, message: 'Opportunity created' })
  } catch (err) {
    console.error('createOpportunity error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateOpportunity = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    const { opportunityId } = req.params

    const {
      title,
      position,
      contract_type,
      trial_date,
      venue,
      description,
      min_fitness,
      max_age,
      min_height_cm,
      is_active,
      expires_at
    } = req.body

    const updates = {
      title,
      position,
      contract_type,
      trial_date,
      venue,
      description,
      min_fitness,
      max_age,
      min_height_cm,
      is_active,
      expires_at
    }

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

    const { error, value } = validate(opportunityUpdateSchema, updates)
    if (error) return res.status(400).json({ success: false, error })

    let clubId = null
    if (role === 'club') {
      const club = await ClubModel.getClubByUserId(userId)
      if (!club) return res.status(403).json({ success: false, error: 'Club profile not found' })
      clubId = club.id
    } else if (role === 'admin') {
      const updated = await OpportunityModel.updateOpportunityForAdmin({ opportunityId, updates: value })
      if (!updated) return res.status(404).json({ success: false, error: 'Opportunity not found' })
      return res.json({ success: true, data: updated, message: 'Opportunity updated' })
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const updated = await OpportunityModel.updateOpportunityForClub({ opportunityId, clubId, updates: value })
    if (!updated) return res.status(404).json({ success: false, error: 'Opportunity not found' })
    return res.json({ success: true, data: updated, message: 'Opportunity updated' })
  } catch (err) {
    console.error('updateOpportunity error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const deleteOpportunity = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    const { opportunityId } = req.params

    let deleted = null
    if (role === 'club') {
      const club = await ClubModel.getClubByUserId(userId)
      if (!club) return res.status(403).json({ success: false, error: 'Club profile not found' })
      deleted = await OpportunityModel.deleteOpportunityForClub({ opportunityId, clubId: club.id })
    } else if (role === 'admin') {
      deleted = await OpportunityModel.deleteOpportunityForAdmin(opportunityId)
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    if (!deleted) return res.status(404).json({ success: false, error: 'Opportunity not found' })

    return res.json({ success: true, data: deleted, message: 'Opportunity deleted' })
  } catch (err) {
    console.error('deleteOpportunity error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const applyToOpportunity = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    const { opportunityId } = req.params

    if (role !== 'athlete') return res.status(403).json({ success: false, error: 'Access denied' })

    const athlete = await AthleteModel.getAthleteByUserId(userId)
    if (!athlete) {
      return res.status(400).json({ success: false, error: 'Complete your athlete profile before applying' })
    }

    const opportunity = await OpportunityModel.getOpportunityById(opportunityId)
    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' })
    }

    if (!opportunity.is_active) {
      return res.status(400).json({ success: false, error: 'This opportunity is no longer active' })
    }

    if (isOpportunityExpired(opportunity)) {
      return res.status(400).json({ success: false, error: 'This opportunity has expired' })
    }

    const applied = await OpportunityModel.applyToOpportunity({ opportunityId, athleteId: athlete.id })
    return res.json({ success: true, data: applied, message: 'Applied successfully' })
  } catch (err) {
    console.error('applyToOpportunity error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateApplicationStatus = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    const { applicationId } = req.params

    if (role !== 'club' && role !== 'admin') return res.status(403).json({ success: false, error: 'Access denied' })

    const { status } = req.body
    const { error, value } = validate(applicationStatusUpdateSchema, { status })
    if (error) return res.status(400).json({ success: false, error })

    let updated = null
    if (role === 'club') {
      const club = await ClubModel.getClubByUserId(userId)
      if (!club) return res.status(403).json({ success: false, error: 'Club profile not found' })
      updated = await OpportunityModel.updateApplicationStatusForClub({
        applicationId,
        clubId: club.id,
        status: value.status
      })
    } else {
      updated = await OpportunityModel.updateApplicationStatusForAdmin({
        applicationId,
        status: value.status
      })
    }

    if (!updated) return res.status(404).json({ success: false, error: 'Application not found' })
    return res.json({ success: true, data: updated, message: 'Application status updated' })
  } catch (err) {
    console.error('updateApplicationStatus error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getApplicationsByAthlete = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    const { athleteId } = req.params

    if (role !== 'athlete' && role !== 'admin') return res.status(403).json({ success: false, error: 'Access denied' })

    if (role === 'athlete') {
      const athlete = await AthleteModel.getAthleteByUserId(userId)
      if (!athlete || String(athlete.id) !== String(athleteId)) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }
    }

    const apps = await OpportunityModel.listApplicationsByAthleteId(athleteId)
    return res.json({ success: true, data: apps })
  } catch (err) {
    console.error('getApplicationsByAthlete error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getMyApplications = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    if (role !== 'athlete') return res.status(403).json({ success: false, error: 'Access denied' })

    const athlete = await AthleteModel.getAthleteByUserId(userId)
    if (!athlete) {
      return res.json({ success: true, data: [], message: 'No athlete profile found yet' })
    }

    const apps = await OpportunityModel.listApplicationsByAthleteId(athlete.id)
    return res.json({ success: true, data: apps })
  } catch (err) {
    console.error('getMyApplications error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const createShortlist = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    const { athleteId } = req.params

    if (role !== 'club' && role !== 'admin') return res.status(403).json({ success: false, error: 'Access denied' })

    const { stage, notes } = req.body
    const { error, value } = validate(shortlistCreateSchema, { stage, notes })
    if (error) return res.status(400).json({ success: false, error })

    let clubId = null
    if (role === 'club') {
      const club = await ClubModel.getClubByUserId(userId)
      if (!club) return res.status(403).json({ success: false, error: 'Club profile not found' })
      clubId = club.id
    } else {
      const { club_id } = req.body
      if (!club_id) return res.status(400).json({ success: false, error: 'club_id is required for admin' })
      clubId = club_id
    }

    const shortlisted = await OpportunityModel.createOrUpdateShortlist({
      clubId,
      athleteId,
      payload: value
    })

    return res.json({ success: true, data: shortlisted, message: 'Shortlist saved' })
  } catch (err) {
    console.error('createShortlist error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listShortlists = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    if (role !== 'club' && role !== 'admin') return res.status(403).json({ success: false, error: 'Access denied' })

    let clubId = null
    if (role === 'club') {
      const club = await ClubModel.getClubByUserId(userId)
      if (!club) return res.status(403).json({ success: false, error: 'Club profile not found' })
      clubId = club.id
    } else {
      const { club_id } = req.query
      if (!club_id) return res.status(400).json({ success: false, error: 'club_id is required for admin' })
      clubId = club_id
    }

    const shortlisted = await OpportunityModel.listShortlistsByClubId(clubId)
    return res.json({ success: true, data: shortlisted })
  } catch (err) {
    console.error('listShortlists error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
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
}
