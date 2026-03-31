const { pool } = require('./src/config/db')

;(async () => {
  try {
    console.log('DATABASE_URL', process.env.DATABASE_URL || 'not set')

    const existing = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('messages','profile_views')"
    )
    const names = existing.rows.map((r) => r.table_name)
    console.log('existing tables:', names)

    if (!names.includes('messages')) {
      console.log('creating messages table...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
          receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `)
      console.log('messages created')
    }

    if (!names.includes('profile_views')) {
      console.log('creating profile_views table...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS profile_views (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
          athlete_id UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
          viewer_role VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `)
      console.log('profile_views created')
    }

    console.log('done')
  } catch (err) {
    console.error('error:', err)
  } finally {
    await pool.end()
  }
})()
