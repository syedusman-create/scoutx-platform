const UserSearchModel = require('../models/userSearch.model')

const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) {
      return res.json({ success: true, data: [] })
    }

    const users = await UserSearchModel.searchUsers({
      query: q,
      currentUserId: req.user.id,
      limit: Math.min(Number(req.query.limit) || 10, 25)
    })

    return res.json({ success: true, data: users })
  } catch (err) {
    console.error('searchUsers error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = { searchUsers }
