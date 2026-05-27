import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import serveStatic from 'serve-static'

import { initDb } from './db/index.js'
import authRouter         from './routes/auth.js'
import accountsRouter     from './routes/accounts.js'
import transactionsRouter from './routes/transactions.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const app   = express()
const PORT  = process.env.PORT || 5000

// ── Security & middleware ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        || origin === process.env.CORS_ORIGIN)
      return cb(null, true)
    cb(null, true) // open in dev; restrict via CORS_ORIGIN in production
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}))
app.use(morgan('dev'))
app.use(express.json())

// ── Serve React build in production ───────────────────────────
const clientDist = resolve(__dir, '..', '..', '..', 'client', 'dist')
if (existsSync(clientDist)) {
  app.use(serveStatic(clientDist))
  console.log('🌐 Serving React build')
}

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',         authRouter)
app.use('/api/accounts',     accountsRouter)
app.use('/api/transactions', transactionsRouter)

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }))

// ── SPA fallback ──────────────────────────────────────────────
if (existsSync(clientDist)) {
  app.get('*', (_req, res) => res.sendFile(resolve(clientDist, 'index.html')))
}

// ── 404 & Error handlers ──────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────
async function start() {
  try {
    await initDb()
    app.listen(PORT, () => {
      console.log('')
      console.log('╔══════════════════════════════════════╗')
      console.log(`║  ✅  Finance Ledger API v2            ║`)
      console.log(`║  http://localhost:${PORT}             ║`)
      console.log('╚══════════════════════════════════════╝')
    })
  } catch (e) {
    console.error('❌ Failed to start server:', e.message)
    console.error('   Check your DATABASE_URL in .env file')
    process.exit(1)
  }
}

start()
