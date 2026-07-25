const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config()

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set in environment variables.')
    process.exit(1)
  }
  
  console.log('Connecting to database...')
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const sqlPath = path.join(__dirname, 'supabase_schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('Executing Supabase migration script...')
    await client.query(sql)
    console.log('Migration completed successfully!')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
