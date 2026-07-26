const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config()

// Try all possible env var names for Supabase key
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.warn('Warning: SUPABASE_URL environment variable is missing.')
}
if (!supabaseKey) {
  console.warn('Warning: No Supabase key environment variable found (tried: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY).')
}

console.log(`Supabase client: URL=${supabaseUrl ? 'set' : 'MISSING'}, Key=${supabaseKey ? 'set (length=' + supabaseKey.length + ')' : 'MISSING'}`)

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder')

module.exports = { supabase }
