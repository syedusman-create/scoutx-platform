const AchievementService = require('../services/achievement.service')

const listAchievements = async (req, res) => {
  try {
    const data = await AchievementService.listAchievements()
    return res.json({ success: true, data })
  } catch (err) {
    console.error('listAchievements error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listMyAchievements = async (req, res) => {
  try {
    const data = await AchievementService.listUserAchievements(req.user.id)
    return res.json({ success: true, data })
  } catch (err) {
    console.error('listMyAchievements error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  listAchievements,
  listMyAchievements
}
