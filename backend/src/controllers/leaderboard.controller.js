const LeaderboardService = require('../services/leaderboard.service')

const listLeaderboards = async (req, res) => {
  try {
    const data = await LeaderboardService.listLeaderboards({
      period: req.query.period,
      exerciseType: req.query.exerciseType
    })
    return res.json({ success: true, data })
  } catch (err) {
    console.error('listLeaderboards error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listSportLeaderboards = async (req, res) => {
  try {
    const data = await LeaderboardService.listSportLeaderboards({
      sport: req.query.sport,
      limit: req.query.limit
    })
    return res.json({ success: true, data })
  } catch (err) {
    console.error('listSportLeaderboards error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  listLeaderboards,
  listSportLeaderboards
}
