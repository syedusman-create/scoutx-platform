const { pool } = require('../../config/db')
const bcrypt = require('bcrypt')

const seed = async () => {
  console.log('🌱 Seeding...')

  // 0. Create test admin user (runs even if other seed data already exists)
  const adminEmail = 'syed18usman18@gmail.com'
  const adminHash = await bcrypt.hash('Test1234!', 10)
  await pool.query(
    `INSERT INTO users (email, password_hash, role, is_verified)
     VALUES ($1, $2, 'admin', true)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       is_verified = true
     RETURNING id`,
    [adminEmail, adminHash]
  )

  // 1. Create test athlete user
  const hash = await bcrypt.hash('Test1234!', 10)

  const userRes = await pool.query(
    `INSERT INTO users (email, password_hash, role, is_verified)
     VALUES ($1, $2, 'athlete', true)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['aryan@scoutx.in', hash]
  )

  const userId = userRes.rows[0]?.id
  if (!userId) { console.log('User already exists, skipping'); process.exit(0) }

  // 2. Create athlete profile
  await pool.query(
    `INSERT INTO athlete_profiles 
     (user_id, full_name, sport, position, city, state, bio, 
      headline, is_open, fitness_score, total_matches, total_goals, total_assists)
     VALUES ($1, $2, 'football', 'Central Midfielder', 
             'Hyderabad', 'Telangana',
             'Central midfielder with 4 years of competitive experience in I-League.',
             'Central Midfielder · FC Hyderabad B · Open to Opportunities',
             true, 84, 87, 23, 41)`,
    [userId, 'Aryan Kumar']
  )

  // 3. Create test club user
  const clubHash = await bcrypt.hash('Test1234!', 10)
  const clubUserRes = await pool.query(
    `INSERT INTO users (email, password_hash, role, is_verified)
     VALUES ($1, $2, 'club', true)
     RETURNING id`,
    ['fcbengaluru@scoutx.in', clubHash]
  )
  const clubUserId = clubUserRes.rows[0]?.id

  // 4. Create club profile
  await pool.query(
    `INSERT INTO club_profiles 
     (user_id, club_name, league, city, state, is_verified)
     VALUES ($1, 'FC Bengaluru Academy', 'I-League 2nd Division', 
             'Bengaluru', 'Karnataka', true)`,
    [clubUserId]
  )

  // 5. Post a sample opportunity
  const clubProfile = await pool.query(
    'SELECT id FROM club_profiles WHERE user_id = $1', [clubUserId]
  )
  await pool.query(
    `INSERT INTO opportunities 
     (club_id, title, position, contract_type, trial_date, venue, 
      description, min_fitness, max_age, is_active)
     VALUES ($1, 'Central Midfielder — B Team', 'Central Midfielder',
             'Full-time', '2025-04-15', 'Kanteerava Stadium, Bengaluru',
             'Looking for a box-to-box CM for our I-League 2nd Division squad.',
             75, 23, true)`,
    [clubProfile.rows[0].id]
  )

  console.log('✅ Seed complete')
  console.log('   Athlete login: aryan@scoutx.in / Test1234!')
  console.log('   Club login:    fcbengaluru@scoutx.in / Test1234!')
  console.log(`   Admin login:   ${adminEmail} / Test1234!`)
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})