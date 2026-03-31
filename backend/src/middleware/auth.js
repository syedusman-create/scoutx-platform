const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    // TODO: add proper structured logging in v2.
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
}

module.exports = auth

