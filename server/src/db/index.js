import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set! Add it to Render Environment Variables.')
  process.exit(1)
}

// Log DB host for debugging (never logs password)
try {
  const url = new URL(process.env.DATABASE_URL)
  console.log(`🔌 DB host: ${url.hostname}:${url.port}`)
  console.log(`   User: ${url.username}`)
} catch (e) {
  console.error('❌ DATABASE_URL format is invalid:', e.message)
  process.exit(1)
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on('error', (err) => {
  console.error('❌ DB pool error:', err.message)
})

export async function initDb() {
  let client
  try {
    client = await pool.connect()
    console.log('✅ DB connection successful!')
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS accounts (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name            VARCHAR(100) NOT NULL,
        bank            VARCHAR(100) DEFAULT '',
        account_number  VARCHAR(50)  DEFAULT '',
        opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
        account_type    VARCHAR(50)  DEFAULT 'Savings',
        currency        VARCHAR(10)  DEFAULT 'INR',
        created_at      TIMESTAMPTZ  DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        type          VARCHAR(10) NOT NULL CHECK (type IN ('credit','debit')),
        amount        NUMERIC(18,2) NOT NULL CHECK (amount > 0),
        date          DATE NOT NULL,
        category      VARCHAR(100) DEFAULT '',
        reason        TEXT NOT NULL,
        balance_after NUMERIC(18,2) NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_txn_user      ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_txn_account   ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_txn_date      ON transactions(date);
    `)
    console.log('✅ Database tables ready')
  } catch (e) {
    console.error('❌ Database init failed:', e.message)
    console.error('   Full error:', e)
    throw e
  } finally {
    if (client) client.release()
  }
}

export const query = (text, params) => pool.query(text, params)
