const jwt = require('jsonwebtoken')

const { supabase } = require('../config/supabase')

const buildSupabaseUser = async (token) => {
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData?.user?.id) {
    return null
  }

  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('id, email, role, is_verified, onboarding_completed')
    .eq('id', authData.user.id)
    .single()

  if (dbError || !dbUser) {
    return null
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    is_verified: dbUser.is_verified,
    onboarding_completed: dbUser.onboarding_completed || false
  }
}

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
    try {
      const supabaseUser = await buildSupabaseUser(token)
      if (!supabaseUser) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }

      req.user = supabaseUser
      return next()
    } catch (supabaseErr) {
      // TODO: add proper structured logging in v2.
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
  }
}

module.exports = auth

