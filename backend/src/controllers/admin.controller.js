const AdminModel = require('../models/admin.model')
const AuditModel = require('../models/audit.model')

const getOverview = async (req, res) => {
  try {
    const overview = await AdminModel.getAdminOverview()
    return res.json({ success: true, data: overview })
  } catch (err) {
    console.error('getOverview error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listUsers = async (req, res) => {
  try {
    const { page, limit } = req.query
    const result = await AdminModel.listUsers({ page, limit })
    return res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    })
  } catch (err) {
    console.error('listUsers error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const setUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!['athlete', 'club', 'scout', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' })
    }

    const before = await AdminModel.getUserById(userId)
    if (!before) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const updated = await AdminModel.updateUserRole({ userId, role })

    await AuditModel.createAuditLog({
      actorUserId: req.user?.id,
      action: 'admin.user.role.update',
      tableName: 'users',
      rowPk: userId,
      beforeJson: before,
      afterJson: updated,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    return res.json({ success: true, data: updated, message: 'User role updated' })
  } catch (err) {
    console.error('setUserRole error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const setAthleteVerification = async (req, res) => {
  try {
    const { athleteId } = req.params
    const { age_verified } = req.body
    const ageVerified = Boolean(age_verified)

    const before = await AdminModel.getAthleteById(athleteId)
    if (!before) {
      return res.status(404).json({ success: false, error: 'Athlete not found' })
    }

    const updated = await AdminModel.updateAthleteVerification({ athleteId, ageVerified })

    await AuditModel.createAuditLog({
      actorUserId: req.user?.id,
      action: 'admin.athlete.verify.update',
      tableName: 'athlete_profiles',
      rowPk: athleteId,
      beforeJson: before,
      afterJson: updated,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    return res.json({ success: true, data: updated, message: 'Athlete verification updated' })
  } catch (err) {
    console.error('setAthleteVerification error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const setClubVerification = async (req, res) => {
  try {
    const { clubId } = req.params
    const { is_verified } = req.body
    const isVerified = Boolean(is_verified)

    const before = await AdminModel.getClubById(clubId)
    if (!before) {
      return res.status(404).json({ success: false, error: 'Club not found' })
    }

    const updated = await AdminModel.updateClubVerification({ clubId, isVerified })

    await AuditModel.createAuditLog({
      actorUserId: req.user?.id,
      action: 'admin.club.verify.update',
      tableName: 'club_profiles',
      rowPk: clubId,
      beforeJson: before,
      afterJson: updated,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    return res.json({ success: true, data: updated, message: 'Club verification updated' })
  } catch (err) {
    console.error('setClubVerification error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listAuditLogs = async (req, res) => {
  try {
    const { page, limit } = req.query
    const result = await AuditModel.listAuditLogs({ page, limit })
    return res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    })
  } catch (err) {
    console.error('listAuditLogs error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listAthletes = async (req, res) => {
  try {
    const { page, limit } = req.query
    const result = await AdminModel.listAthletesForAdmin({ page, limit })
    return res.json({
      success: true,
      data: result.rows,
      pagination: result.pagination
    })
  } catch (err) {
    console.error('listAthletes error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listClubs = async (req, res) => {
  try {
    const { page, limit } = req.query
    const result = await AdminModel.listClubsForAdmin({ page, limit })
    return res.json({
      success: true,
      data: result.rows,
      pagination: result.pagination
    })
  } catch (err) {
    console.error('listClubs error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  getOverview,
  listUsers,
  setUserRole,
  setAthleteVerification,
  setClubVerification,
  listAuditLogs,
  listAthletes,
  listClubs
}
