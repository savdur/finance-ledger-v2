import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { query } from '../db/index.js'

const r = Router()
r.use(authMiddleware)

const fmt = n => parseFloat(parseFloat(n).toFixed(2))

// Compute current balance from DB
async function currentBalance(accountId, openingBalance) {
  const res = await query(
    `SELECT COALESCE(
       SUM(CASE WHEN type='credit' THEN amount ELSE -amount END), 0
     ) AS net FROM transactions WHERE account_id = $1`,
    [accountId]
  )
  return fmt(parseFloat(openingBalance) + parseFloat(res.rows[0].net))
}

// GET /api/accounts
r.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    )
    const accounts = await Promise.all(result.rows.map(async a => ({
      id: a.id, name: a.name, bank: a.bank,
      accountNumber: a.account_number, openingBalance: fmt(a.opening_balance),
      accountType: a.account_type, currency: a.currency, createdAt: a.created_at,
      currentBalance: await currentBalance(a.id, a.opening_balance)
    })))
    res.json(accounts)
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// GET /api/accounts/:id
r.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Account not found.' })
    const a = result.rows[0]
    res.json({
      id: a.id, name: a.name, bank: a.bank,
      accountNumber: a.account_number, openingBalance: fmt(a.opening_balance),
      accountType: a.account_type, currency: a.currency, createdAt: a.created_at,
      currentBalance: await currentBalance(a.id, a.opening_balance)
    })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// POST /api/accounts
r.post('/', async (req, res) => {
  try {
    const { name, bank, accountNumber, openingBalance, accountType, currency } = req.body || {}
    if (!name?.trim()) return res.status(400).json({ message: 'Account name is required.' })
    const bal = parseFloat(openingBalance)
    if (isNaN(bal) || bal < 0) return res.status(400).json({ message: 'Opening balance must be 0 or more.' })

    const result = await query(
      `INSERT INTO accounts (user_id, name, bank, account_number, opening_balance, account_type, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.userId, name.trim(), (bank||'').trim(), (accountNumber||'').trim(), bal, accountType||'Savings', currency||'INR']
    )
    const a = result.rows[0]
    res.status(201).json({
      id: a.id, name: a.name, bank: a.bank,
      accountNumber: a.account_number, openingBalance: fmt(a.opening_balance),
      accountType: a.account_type, currency: a.currency, createdAt: a.created_at,
      currentBalance: bal
    })
  } catch (e) {
    console.error('Create account error:', e.message)
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/accounts/:id
r.put('/:id', async (req, res) => {
  try {
    const { name, bank, accountNumber, openingBalance, accountType, currency } = req.body || {}
    if (!name?.trim()) return res.status(400).json({ message: 'Account name is required.' })
    const bal = parseFloat(openingBalance)
    if (isNaN(bal) || bal < 0) return res.status(400).json({ message: 'Opening balance must be 0 or more.' })

    const result = await query(
      `UPDATE accounts SET name=$1, bank=$2, account_number=$3, opening_balance=$4,
       account_type=$5, currency=$6 WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name.trim(), (bank||'').trim(), (accountNumber||'').trim(), bal,
       accountType||'Savings', currency||'INR', req.params.id, req.userId]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Account not found.' })

    // Recalculate all transaction balances for this account
    await recalcTransactionBalances(req.params.id, bal)

    const a = result.rows[0]
    res.json({
      id: a.id, name: a.name, bank: a.bank,
      accountNumber: a.account_number, openingBalance: fmt(a.opening_balance),
      accountType: a.account_type, currency: a.currency, createdAt: a.created_at,
      currentBalance: await currentBalance(a.id, a.opening_balance)
    })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// DELETE /api/accounts/:id
r.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Account not found.' })
    res.status(204).end()
  } catch (e) { res.status(500).json({ message: e.message }) }
})

async function recalcTransactionBalances(accountId, openingBalance) {
  const txns = await query(
    'SELECT id, type, amount FROM transactions WHERE account_id = $1 ORDER BY date ASC, created_at ASC',
    [accountId]
  )
  let running = parseFloat(openingBalance)
  for (const t of txns.rows) {
    running += t.type === 'credit' ? parseFloat(t.amount) : -parseFloat(t.amount)
    await query('UPDATE transactions SET balance_after = $1 WHERE id = $2', [fmt(running), t.id])
  }
}

export default r
