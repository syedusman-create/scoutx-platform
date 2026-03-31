const ClubModel = require('../models/club.model')
const { clubProfileUpdateSchema, validate } = require('../utils/validators')

const buildClubProfileScaffold = (user) => ({
  id: null,
  user_id: user.id,
  email: user.email || null,
  user_role: user.role,
  user_is_verified: false,
  club_name: '',
  league: '',
  city: '',
  state: '',
  founded_year: null,
  logo_url: '',
  bio: '',
  is_verified: false,
  exists: false
})

const getClubProfile = async (req, res) => {
  try {
    const { id } = req.params
    const club = await ClubModel.getClubById(id)
    if (!club) {
      return res.status(404).json({ success: false, error: 'Club not found' })
    }
    return res.json({ success: true, data: club })
  } catch (err) {
    console.error('getClubProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateClubProfile = async (req, res) => {
  try {
    const { id: clubId } = req.params
    const { role, id: userId } = req.user

    const {
      club_name,
      league,
      city,
      state,
      founded_year,
      logo_url,
      bio,
      is_verified
    } = req.body

    const updates = {
      club_name,
      league,
      city,
      state,
      founded_year,
      logo_url,
      bio,
      is_verified: role === 'admin' ? is_verified : undefined
    }

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

    const { error, value } = validate(clubProfileUpdateSchema, updates)
    if (error) {
      return res.status(400).json({ success: false, error })
    }

    let club = null
    if (role === 'admin') {
      club = await ClubModel.updateClubProfileForAdmin({ clubId, updates: value })
    } else {
      club = await ClubModel.updateClubProfileForOwner({ clubId, userId, updates: value })
      if (!club) {
        club = await ClubModel.upsertClubProfileForOwner({ userId, updates: value })
      }
    }

    if (!club) {
      if (!value.club_name) {
        return res.status(400).json({ success: false, error: 'club_name is required to create club profile' })
      }
      return res.status(404).json({ success: false, error: 'Club not found' })
    }

    return res.json({ success: true, data: club, message: 'Club profile updated' })
  } catch (err) {
    console.error('updateClubProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getMyClubProfile = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    if (role !== 'club') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const club = await ClubModel.getClubByUserId(userId)
    if (!club) {
      return res.json({
        success: true,
        data: buildClubProfileScaffold(req.user),
        message: 'Club profile scaffold returned'
      })
    }

    return res.json({ success: true, data: { ...club, exists: true } })
  } catch (err) {
    console.error('getMyClubProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const updateMyClubProfile = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    if (role !== 'club' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const club = await ClubModel.getClubByUserId(userId)
    // Allow club self-onboarding: update path falls back to upsert in updateClubProfile.
    const clubId = club?.id || null
    req.params.id = clubId
    return updateClubProfile(req, res)
  } catch (err) {
    console.error('updateMyClubProfile error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = { getClubProfile, getMyClubProfile, updateClubProfile, updateMyClubProfile }
