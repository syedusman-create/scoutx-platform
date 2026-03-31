const Joi = require('joi')

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  role: Joi.string().valid('athlete', 'club', 'scout', 'admin').required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

const validate = (schema, payload) => {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true })
  if (error) {
    return { error: error.details.map((d) => d.message).join(', '), value: null }
  }
  return { error: null, value }
}

const athleteProfileUpdateSchema = Joi.object({
  full_name: Joi.string().min(2).max(255),
  sport: Joi.string().min(2).max(50),
  position: Joi.string().min(1).max(100).allow(null, ''),
  city: Joi.string().min(1).max(100).allow(null, ''),
  state: Joi.string().min(1).max(100).allow(null, ''),
  date_of_birth: Joi.date(),
  age_verified: Joi.boolean(),
  preferred_foot: Joi.string().valid('left', 'right', 'both'),
  height_cm: Joi.number().integer().min(0),
  weight_kg: Joi.number().integer().min(0),
  bio: Joi.string().max(2000).allow(null, ''),
  headline: Joi.string().max(255).allow(null, ''),
  avatar_url: Joi.string().max(500).allow(null, ''),
  is_open: Joi.boolean()
}).min(1)

const careerEntryCreateSchema = Joi.object({
  athlete_id: Joi.string().required(),
  club_name: Joi.string().min(1).max(255).required(),
  role: Joi.string().min(1).max(100).allow(null, ''),
  competition: Joi.string().min(1).max(255).allow(null, ''),
  start_date: Joi.date().required(),
  end_date: Joi.date().allow(null, ''),
  matches: Joi.number().integer().min(0),
  goals: Joi.number().integer().min(0),
  assists: Joi.number().integer().min(0),
  clean_sheets: Joi.number().integer().min(0),
  pass_accuracy: Joi.number().precision(2),
  avg_rating: Joi.number().precision(2),
  is_verified: Joi.boolean(),
  is_current: Joi.boolean()
})

const careerEntryUpdateSchema = Joi.object({
  club_name: Joi.string().min(1).max(255),
  role: Joi.string().min(1).max(100).allow(null, ''),
  competition: Joi.string().min(1).max(255).allow(null, ''),
  start_date: Joi.date(),
  end_date: Joi.date().allow(null, ''),
  matches: Joi.number().integer().min(0),
  goals: Joi.number().integer().min(0),
  assists: Joi.number().integer().min(0),
  clean_sheets: Joi.number().integer().min(0),
  pass_accuracy: Joi.number().precision(2),
  avg_rating: Joi.number().precision(2),
  is_verified: Joi.boolean(),
  is_current: Joi.boolean()
}).min(1)

const clubProfileUpdateSchema = Joi.object({
  club_name: Joi.string().min(1).max(255),
  league: Joi.string().min(1).max(255).allow(null, ''),
  city: Joi.string().min(1).max(100).allow(null, ''),
  state: Joi.string().min(1).max(100).allow(null, ''),
  founded_year: Joi.number().integer().allow(null),
  logo_url: Joi.string().max(500).allow(null, ''),
  bio: Joi.string().max(2000).allow(null, ''),
  is_verified: Joi.boolean(),
  created_at: Joi.any().forbidden()
}).min(1)

const fitnessTestCreateSchema = Joi.object({
  test_type: Joi.string().min(2).max(50).required(),
  score: Joi.number().precision(3).required(),
  unit: Joi.string().max(30).allow(null, ''),
  tested_at: Joi.date(),
  location: Joi.string().max(255).allow(null, ''),
  notes: Joi.string().max(2000).allow(null, '')
}).min(1)

const fitnessTestUpdateSchema = Joi.object({
  test_type: Joi.string().min(2).max(50),
  score: Joi.number().precision(3),
  unit: Joi.string().max(30).allow(null, ''),
  tested_at: Joi.date(),
  location: Joi.string().max(255).allow(null, ''),
  notes: Joi.string().max(2000).allow(null, '')
}).min(1)

const opportunityCreateSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  position: Joi.string().min(1).max(100).allow(null, ''),
  contract_type: Joi.string().min(1).max(50).allow(null, ''),
  trial_date: Joi.date().allow(null),
  venue: Joi.string().min(1).max(255).allow(null, ''),
  description: Joi.string().allow(null, ''),
  min_fitness: Joi.number().integer().min(0),
  max_age: Joi.number().integer().min(0),
  min_height_cm: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
  expires_at: Joi.date().allow(null)
}).min(1)

const opportunityUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  position: Joi.string().min(1).max(100).allow(null, ''),
  contract_type: Joi.string().min(1).max(50).allow(null, ''),
  trial_date: Joi.date().allow(null),
  venue: Joi.string().min(1).max(255).allow(null, ''),
  description: Joi.string().allow(null, ''),
  min_fitness: Joi.number().integer().min(0),
  max_age: Joi.number().integer().min(0),
  min_height_cm: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
  expires_at: Joi.date().allow(null)
}).min(1)

const applicationStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('applied', 'reviewing', 'invited', 'rejected', 'signed').required()
}).min(1)

const activityPostSchema = Joi.object({
  body: Joi.string().min(1).max(2000).required(),
  media_url: Joi.string().uri().allow(null, ''),
  media_type: Joi.string().valid('image', 'video', 'link', null, '').allow(null, '')
})

const messageSchema = Joi.object({
  body: Joi.string().min(1).max(2000).required()
})

const shortlistCreateSchema = Joi.object({
  stage: Joi.string().valid('applied', 'reviewing', 'invited', 'signed').default('applied'),
  notes: Joi.string().allow(null, '').max(5000)
}).min(1)

module.exports = {
  registerSchema,
  loginSchema,
  validate,
  athleteProfileUpdateSchema,
  careerEntryCreateSchema,
  careerEntryUpdateSchema,
  clubProfileUpdateSchema,
  fitnessTestCreateSchema,
  fitnessTestUpdateSchema,
  opportunityCreateSchema,
  opportunityUpdateSchema,
  applicationStatusUpdateSchema,
  shortlistCreateSchema,
  activityPostSchema,
  messageSchema
}

