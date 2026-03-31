const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const UserModel = require('../models/user.model')
const { registerSchema, loginSchema, validate } = require('../utils/validators')

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body

    const { error, value } = validate(registerSchema, { email, password, role })
    if (error) {
      return res.status(400).json({ success: false, error })
    }

    const passwordHash = await bcrypt.hash(value.password, 10)
    const user = await UserModel.createUser({
      email: value.email,
      passwordHash,
      role: value.role
    })

    return res.json({
      success: true,
      data: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified },
      message: 'Registered successfully'
    })
  } catch (err) {
    console.error('register error:', err)

    // Postgres unique violation.
    if (err && err.code === '23505') {
      return res.status(400).json({ success: false, error: 'Email already registered' })
    }

    return res.status(400).json({ success: false, error: 'Registration failed' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const { error, value } = validate(loginSchema, { email, password })
    if (error) {
      return res.status(400).json({ success: false, error })
    }

    const user = await UserModel.findUserByEmail(value.email)
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(value.password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    return res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified } },
      message: 'Login successful'
    })
  } catch (err) {
    console.error('login error:', err)
    return res.status(400).json({ success: false, error: 'Login failed' })
  }
}

module.exports = { register, login }

