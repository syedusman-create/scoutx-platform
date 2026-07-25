const Joi = require('joi')
const { validate } = require('../utils/validators')
const ChallengeService = require('../services/challenge.service')

const challengeCreateSchema = Joi.object({
  title: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('', null),
  type: Joi.string().valid('daily', 'weekly', 'custom').required(),
  exerciseType: Joi.string().allow('', null),
  target: Joi.object().unknown(true).default({}),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  isActive: Joi.boolean().default(true),
  imageUrl: Joi.string().allow('', null),
  rewards: Joi.object().unknown(true).default({})
})

const listChallenges = async (req, res) => {
  try {
    const data = await ChallengeService.listChallenges()
    return res.json({ success: true, data })
  } catch (err) {
    console.error('listChallenges error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const createChallenge = async (req, res) => {
  try {
    const { error, value } = validate(challengeCreateSchema, req.body || {})
    if (error) return res.status(400).json({ success: false, error })

    const created = await ChallengeService.createChallenge({
      payload: value,
      createdBy: req.user?.id
    })
    return res.status(201).json({ success: true, data: created, message: 'Challenge created' })
  } catch (err) {
    console.error('createChallenge error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const joinChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params
    const joined = await ChallengeService.joinChallenge({
      challengeId,
      userId: req.user.id
    })
    return res.json({
      success: true,
      data: joined || { challenge_id: challengeId, user_id: req.user.id },
      message: 'Joined challenge'
    })
  } catch (err) {
    console.error('joinChallenge error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const leaveChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params
    await ChallengeService.leaveChallenge({
      challengeId,
      userId: req.user.id
    })
    return res.json({ success: true, message: 'Left challenge' })
  } catch (err) {
    console.error('leaveChallenge error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const listMyChallengeProgress = async (req, res) => {
  try {
    const data = await ChallengeService.listMyChallengeProgress(req.user.id)
    return res.json({ success: true, data })
  } catch (err) {
    console.error('listMyChallengeProgress error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = {
  listChallenges,
  createChallenge,
  joinChallenge,
  leaveChallenge,
  listMyChallengeProgress
}
