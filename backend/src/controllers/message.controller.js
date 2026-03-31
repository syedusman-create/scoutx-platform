const MessageModel = require('../models/message.model')
const { messageSchema, validate } = require('../utils/validators')

const buildConversationMeta = async (otherUserId) => {
  const otherUser = await MessageModel.getUserSummaryById(otherUserId)
  if (!otherUser) return null

  return {
    other_user_id: otherUser.id,
    other_user_email: otherUser.email,
    other_user_role: otherUser.role
  }
}

const listConversations = async (req, res) => {
  try {
    const { id: userId } = req.user
    const conversations = await MessageModel.listConversationsForUser(userId)
    return res.json({ success: true, data: conversations })
  } catch (err) {
    console.error('listConversations error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getConversation = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { otherUserId } = req.params

    if (String(userId) === String(otherUserId)) {
      return res.status(400).json({ success: false, error: 'You cannot message yourself' })
    }

    const conversation = await buildConversationMeta(otherUserId)
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Recipient not found' })
    }

    const messages = await MessageModel.listMessagesBetween({ userId, otherUserId })
    return res.json({
      success: true,
      data: {
        conversation,
        messages
      }
    })
  } catch (err) {
    console.error('getConversation error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const sendMessage = async (req, res) => {
  try {
    const { id: senderId } = req.user
    const { otherUserId } = req.params
    const { body } = req.body

    if (String(senderId) === String(otherUserId)) {
      return res.status(400).json({ success: false, error: 'You cannot message yourself' })
    }

    const recipient = await MessageModel.getUserSummaryById(otherUserId)
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'Recipient not found' })
    }

    const { error, value } = validate(messageSchema, { body })
    if (error) return res.status(400).json({ success: false, error })

    const message = await MessageModel.createMessage({ senderId, receiverId: otherUserId, body: value.body })
    return res.json({
      success: true,
      data: {
        conversation: {
          other_user_id: recipient.id,
          other_user_email: recipient.email,
          other_user_role: recipient.role
        },
        message
      },
      message: 'Message sent'
    })
  } catch (err) {
    console.error('sendMessage error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const markConversationRead = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { otherUserId } = req.params

    if (String(userId) === String(otherUserId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation' })
    }

    const recipient = await MessageModel.getUserSummaryById(otherUserId)
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'Recipient not found' })
    }

    const result = await MessageModel.markConversationAsRead({ userId, otherUserId })
    return res.json({
      success: true,
      data: result,
      message: 'Conversation marked as read'
    })
  } catch (err) {
    console.error('markConversationRead error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = { listConversations, getConversation, sendMessage, markConversationRead }
