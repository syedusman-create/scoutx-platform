const express = require('express')

const router = express.Router()

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const {
  listConversations,
  getConversation,
  sendMessage,
  markConversationRead
} = require('../controllers/message.controller')

router.get('/conversations', auth, requireRole('athlete', 'club', 'scout', 'admin'), listConversations)
router.get('/conversations/:otherUserId', auth, requireRole('athlete', 'club', 'scout', 'admin'), getConversation)
router.post('/conversations/:otherUserId', auth, requireRole('athlete', 'club', 'scout', 'admin'), sendMessage)
router.put('/conversations/:otherUserId/read', auth, requireRole('athlete', 'club', 'scout', 'admin'), markConversationRead)

module.exports = router

