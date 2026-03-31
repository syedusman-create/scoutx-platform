const http = require('http')
const dotenv = require('dotenv')
const { Server } = require('socket.io')

dotenv.config()

const app = require('./app')

const PORT = process.env.PORT || 5000
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
})

io.on('connection', (socket) => {
  // TODO: add messaging events in Phase 2.
  socket.emit('connected', { ok: true })
})

server.listen(PORT, () => {
  console.log(`ScoutX backend listening on port ${PORT}`)
})

