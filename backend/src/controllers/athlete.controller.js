const AthleteModel = require('../models/athlete.model')
const { athleteProfileUpdateSchema, validate } = require('../utils/validators')
const SearchService = require('../services/search.service')
const ProfileViewModel = require('../models/profileView.model')

const buildAthleteProfileScaffold = (user) => ({
  id: null,
  user_id: user.id,
  email: user.email || null,
  user_role: user.role,
  user_is_verified: false,
  full_name: '',
  sport: 'football',
  position: '',
  city: '',
  state: '',
  date_of_birth: null,
  age_verified: false,
  preferred_foot: null,
  height_cm: null,
  weight_kg: null,
  bio: '',
  headline: '',
  avatar_url: '',
  is_open: false,
  fitness_score: 0,
  total_matches: 0,
  total_goals: 0,
  total_assists: 0,
  exists: false
})

const getAthleteProfile = async (req, res) => {
  try {
    const { id } = req.params
    const athlete = await AthleteModel.getAthleteById(id)
    if (!athlete) {
      return res.status(404).json({ success: false, error: 'Athlete not found' })
    }

    // Track analytics event
    await ProfileViewModel.logProfileView({
      viewerId: req.user?.id,
      athleteId: athlete.id,
      viewerRole: req.user?.role || 'guest'
    })

    return res.json({ success: true, data: athlete })
  } catch (err) {
    console.error('getAthleteProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getMyAthleteProfile = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    if (role !== 'athlete') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const athlete = await AthleteModel.getAthleteByUserId(userId)
    if (!athlete) {
      return res.json({
        success: true,
        data: buildAthleteProfileScaffold(req.user),
        message: 'Athlete profile scaffold returned'
      })
    }

    return res.json({ success: true, data: { ...athlete, exists: true } })
  } catch (err) {
    console.error('getMyAthleteProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateAthleteProfile = async (req, res) => {
  try {
    const { id: athleteId } = req.params
    const { role, id: userId } = req.user

    const {
      full_name,
      sport,
      position,
      city,
      state,
      date_of_birth,
      age_verified,
      preferred_foot,
      height_cm,
      weight_kg,
      bio,
      headline,
      avatar_url,
      is_open
    } = req.body

    const updates = {
      full_name,
      sport,
      position,
      city,
      state,
      date_of_birth,
      age_verified,
      preferred_foot,
      height_cm,
      weight_kg,
      bio,
      headline,
      avatar_url,
      is_open
    }

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

    const { error, value } = validate(athleteProfileUpdateSchema, updates)
    if (error) {
      return res.status(400).json({ success: false, error })
    }

    let athlete = null
    if (role === 'admin') {
      athlete = await AthleteModel.updateAthleteProfileForAdmin({ athleteId, updates: value })
    } else {
      athlete = await AthleteModel.updateAthleteProfileForOwner({ athleteId, userId, updates: value })
      if (!athlete) {
        // If profile does not exist, create it row-level.
        athlete = await AthleteModel.upsertAthleteProfileForOwner({ userId, updates: value })
      }
    }

    if (!athlete) {
      if (!value.full_name) {
        return res.status(400).json({ success: false, error: 'full_name is required to create athlete profile' })
      }
      return res.status(404).json({ success: false, error: 'Athlete not found' })
    }

    return res.json({ success: true, data: athlete, message: 'Profile updated' })
  } catch (err) {
    console.error('updateAthleteProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateMyAthleteProfile = async (req, res) => {
  try {
    const { id: userId, role } = req.user
    if (role !== 'athlete' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const athlete = await AthleteModel.getAthleteByUserId(userId)
    // Allow athlete self-onboarding: update path falls back to upsert in updateAthleteProfile.
    const athleteId = athlete?.id || null
    req.params.id = athleteId

    return updateAthleteProfile(req, res)
  } catch (err) {
    console.error('updateMyAthleteProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const searchAthletes = async (req, res) => {
  try {
    const {
      position,
      minAge,
      maxAge,
      state,
      minFitness,
      isOpen,
      sport,
      sortBy,
      page,
      limit
    } = req.query

    const result = await SearchService.searchAthletes({
      position,
      minAge,
      maxAge,
      state,
      minFitness,
      isOpen,
      sport,
      sortBy,
      page,
      limit
    })

    return res.json({
      success: true,
      data: result.athletes,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  } catch (err) {
    console.error('searchAthletes error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getAthleteAnalytics = async (req, res) => {
  try {
    const { id } = req.params
    const { role, id: userId } = req.user

    if (role === 'athlete') {
      const athlete = await AthleteModel.getAthleteByUserId(userId)
      if (!athlete || athlete.id !== id) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }
    }

    const stats = await ProfileViewModel.getProfileAnalytics(id)
    return res.json({ success: true, data: stats })
  } catch (err) {
    console.error('getAthleteAnalytics error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  getAthleteProfile,
  getMyAthleteProfile,
  updateAthleteProfile,
  updateMyAthleteProfile,
  searchAthletes,
  getAthleteAnalytics
}
