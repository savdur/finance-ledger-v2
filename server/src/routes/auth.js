import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'

const r = Router()

const makeToken = (userId, name) =>
  jwt.sign({ userId, name }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' })

// POST /api/auth/register
r.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!name?.trim())     return res.status(400).json({ message: 'Name is required.' })
    if (!email?.trim())    return res.status(400).json({ message: 'Email is required.' })
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' })

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (exists.rows.length)
      return res.status(400).json({ message: 'An account with this email already exists.' })

    const hash = await bcrypt.hash(password, 12)
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.toLowerCase().trim(), hash]
    )
    const user = result.rows[0]
    res.status(201).json({ token: makeToken(user.id, user.name), user: { id: user.id, name: user.name, email: user.email } })
  } catch (e) {
    console.error('Register error:', e.message)
    res.status(500).json({ message: e.message })
  }
})

// POST /api/auth/login
r.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' })

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    if (!result.rows.length)
      return res.status(401).json({ message: 'Invalid email or password.' })

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ message: 'Invalid email or password.' })

    res.json({ token: makeToken(user.id, user.name), user: { id: user.id, name: user.name, email: user.email } })
  } catch (e) {
    console.error('Login error:', e.message)
    res.status(500).json({ message: e.message })
  }
})

// GET /api/auth/me
r.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authenticated.' })
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-secret')
    const result = await query('SELECT id, name, email FROM users WHERE id = $1', [decoded.userId])
    if (!result.rows.length) return res.status(404).json({ message: 'User not found.' })
    res.json(result.rows[0])
  } catch {
    res.status(401).json({ message: 'Invalid token.' })
  }
})

export default r
