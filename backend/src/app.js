const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const athleteRoutes = require('./routes/athlete.routes')
const careerRoutes = require('./routes/career.routes')
const clubRoutes = require('./routes/club.routes')
const fitnessRoutes = require('./routes/fitness.routes')
const opportunityRoutes = require('./routes/opportunity.routes')
const feedRoutes = require('./routes/feed.routes')
const messageRoutes = require('./routes/message.routes')
const adminRoutes = require('./routes/admin.routes')
const uploadsRoutes = require('./routes/uploads.routes')
const challengeRoutes = require('./routes/challenge.routes')
const leaderboardRoutes = require('./routes/leaderboard.routes')
const achievementRoutes = require('./routes/achievement.routes')
const userRoutes = require('./routes/user.routes')

const app = express()

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'http://127.0.0.1:8081'
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true
  })
)
app.use(express.json({ limit: '10mb' }))

app.get('/health', (req, res) => {
  res.json({ success: true, data: { ok: true }, message: 'Healthy' })
})

app.use('/api/auth', authRoutes)
app.use('/api/athletes', athleteRoutes)
app.use('/api/careers', careerRoutes)
app.use('/api/clubs', clubRoutes)
app.use('/api/fitness', fitnessRoutes)
app.use('/api/opportunities', opportunityRoutes)
app.use('/api/feed', feedRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/uploads', uploadsRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/leaderboards', leaderboardRoutes)
app.use('/api/achievements', achievementRoutes)
app.use('/api/users', userRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // TODO: replace with a proper logger in v2.
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, error: 'Server error' })
})

module.exports = app

