import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { query } from '../db/index.js'

const r = Router()
r.use(authMiddleware)

const fmt  = n => parseFloat(parseFloat(n).toFixed(2))
const today = () => new Date().toISOString().slice(0,10)

function mapTxn(t) {
  return {
    id: t.id, accountId: t.account_id,
    accountName: t.account_name || '', currency: t.currency || 'INR',
    type: t.type, amount: fmt(t.amount), date: t.date?.toISOString?.().slice(0,10) || t.date,
    category: t.category || '', reason: t.reason,
    balanceAfter: fmt(t.balance_after), createdAt: t.created_at
  }
}

// GET /api/transactions/dashboard
r.get('/dashboard', async (req, res) => {
  try {
    const td = today(), ms = td.slice(0,7) + '-01'

    // Total balance across all accounts
    const balRes = await query(
      `SELECT COALESCE(SUM(a.opening_balance), 0) +
              COALESCE(SUM(CASE WHEN t.type='credit' THEN t.amount ELSE -t.amount END), 0) AS total
       FROM accounts a
       LEFT JOIN transactions t ON t.account_id = a.id
       WHERE a.user_id = $1`,
      [req.userId]
    )

    // Today stats
    const todayRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END),0) AS credit,
         COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END),0) AS debit
       FROM transactions WHERE user_id=$1 AND date=$2`,
      [req.userId, td]
    )

    // Month net flow
    const monthRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END),0) AS net
       FROM transactions WHERE user_id=$1 AND date>=$2 AND date<=$3`,
      [req.userId, ms, td]
    )

    // Recent 10 transactions
    const recentRes = await query(
      `SELECT t.*, a.name AS account_name, a.currency
       FROM transactions t JOIN accounts a ON a.id=t.account_id
       WHERE t.user_id=$1 ORDER BY t.date DESC, t.created_at DESC LIMIT 10`,
      [req.userId]
    )

    res.json({
      totalBalance:    fmt(balRes.rows[0].total),
      todayCredit:     fmt(todayRes.rows[0].credit),
      todayDebit:      fmt(todayRes.rows[0].debit),
      monthNetFlow:    fmt(monthRes.rows[0].net),
      recentTransactions: recentRes.rows.map(mapTxn)
    })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// GET /api/transactions/report?from=&to=&accountId=
r.get('/report', async (req, res) => {
  try {
    const { from, to, accountId } = req.query
    if (!from || !to) return res.status(400).json({ message: '"from" and "to" are required.' })

    let qText = `SELECT t.*, a.name AS account_name, a.currency
                 FROM transactions t JOIN accounts a ON a.id=t.account_id
                 WHERE t.user_id=$1 AND t.date>=$2 AND t.date<=$3`
    const params = [req.userId, from, to]
    if (accountId) { qText += ` AND t.account_id=$4`; params.push(accountId) }
    qText += ' ORDER BY t.date DESC, t.created_at DESC'

    const result = await query(qText, params)
    const txns   = result.rows

    const credit = txns.filter(t=>t.type==='credit').reduce((s,t)=>s+parseFloat(t.amount),0)
    const debit  = txns.filter(t=>t.type==='debit') .reduce((s,t)=>s+parseFloat(t.amount),0)

    const catMap = {}
    txns.forEach(t => {
      const k = `${t.category||'Uncategorized'}||${t.type}`
      catMap[k] = (catMap[k]||0) + parseFloat(t.amount)
    })
    const categories = Object.entries(catMap)
      .map(([k,v]) => { const [category,type]=k.split('||'); return {category,type,total:fmt(v)} })
      .sort((a,b) => b.total-a.total)

    res.json({
      totalCredit: fmt(credit), totalDebit: fmt(debit), netFlow: fmt(credit-debit),
      transactionCount: txns.length,
      averageAmount: txns.length ? fmt((credit+debit)/txns.length) : 0,
      largestAmount: txns.length ? fmt(Math.max(...txns.map(t=>parseFloat(t.amount)))) : 0,
      categories, transactions: txns.map(mapTxn)
    })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// GET /api/transactions
r.get('/', async (req, res) => {
  try {
    const { accountId, type, from, to, search } = req.query
    let qText = `SELECT t.*, a.name AS account_name, a.currency
                 FROM transactions t JOIN accounts a ON a.id=t.account_id
                 WHERE t.user_id=$1`
    const params = [req.userId]
    let i = 2
    if (accountId) { qText += ` AND t.account_id=$${i++}`; params.push(accountId) }
    if (type)      { qText += ` AND t.type=$${i++}`;       params.push(type) }
    if (from)      { qText += ` AND t.date>=$${i++}`;      params.push(from) }
    if (to)        { qText += ` AND t.date<=$${i++}`;      params.push(to) }
    if (search)    { qText += ` AND (t.reason ILIKE $${i} OR t.category ILIKE $${i++})`; params.push(`%${search}%`) }
    qText += ' ORDER BY t.date DESC, t.created_at DESC'

    const result = await query(qText, params)
    res.json(result.rows.map(mapTxn))
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// GET /api/transactions/:id
r.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, a.name AS account_name, a.currency
       FROM transactions t JOIN accounts a ON a.id=t.account_id
       WHERE t.id=$1 AND t.user_id=$2`,
      [req.params.id, req.userId]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Transaction not found.' })
    res.json(mapTxn(result.rows[0]))
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// POST /api/transactions
r.post('/', async (req, res) => {
  try {
    const { accountId, type, amount, date, category, reason } = req.body || {}
    if (!accountId) return res.status(400).json({ message: 'accountId is required.' })
    if (!['credit','debit'].includes(type)) return res.status(400).json({ message: 'type must be credit or debit.' })
    const amt = parseFloat(amount)
    if (isNaN(amt)||amt<=0) return res.status(400).json({ message: 'amount must be a positive number.' })
    if (!date)   return res.status(400).json({ message: 'date is required (yyyy-MM-dd).' })
    if (!reason?.trim()) return res.status(400).json({ message: 'Reason is required.' })

    // Verify account belongs to this user
    const acctRes = await query(
      'SELECT id, opening_balance, currency FROM accounts WHERE id=$1 AND user_id=$2',
      [accountId, req.userId]
    )
    if (!acctRes.rows.length) return res.status(404).json({ message: 'Account not found.' })

    // Calculate running balance
    const balRes = await query(
      `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END),0) AS net
       FROM transactions WHERE account_id=$1`,
      [accountId]
    )
    const running = parseFloat(acctRes.rows[0].opening_balance) + parseFloat(balRes.rows[0].net)
    const balanceAfter = fmt(running + (type==='credit' ? amt : -amt))

    const result = await query(
      `INSERT INTO transactions (user_id, account_id, type, amount, date, category, reason, balance_after)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.userId, accountId, type, amt, date, (category||'').trim(), reason.trim(), balanceAfter]
    )
    const t = result.rows[0]
    const acct = acctRes.rows[0]
    res.status(201).json({
      id: t.id, accountId: t.account_id,
      accountName: '', currency: acct.currency,
      type: t.type, amount: fmt(t.amount),
      date: t.date?.toISOString?.().slice(0,10) || t.date,
      category: t.category, reason: t.reason,
      balanceAfter: fmt(t.balance_after), createdAt: t.created_at
    })
  } catch (e) {
    console.error('Create txn error:', e.message)
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/transactions/:id
r.delete('/:id', async (req, res) => {
  try {
    const txn = await query(
      'DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING account_id',
      [req.params.id, req.userId]
    )
    if (!txn.rows.length) return res.status(404).json({ message: 'Transaction not found.' })

    // Recalc balances for remaining transactions in this account
    const accountId = txn.rows[0].account_id
    const acct = await query('SELECT opening_balance FROM accounts WHERE id=$1', [accountId])
    if (acct.rows.length) {
      const remaining = await query(
        'SELECT id, type, amount FROM transactions WHERE account_id=$1 ORDER BY date ASC, created_at ASC',
        [accountId]
      )
      let running = parseFloat(acct.rows[0].opening_balance)
      for (const t of remaining.rows) {
        running += t.type==='credit' ? parseFloat(t.amount) : -parseFloat(t.amount)
        await query('UPDATE transactions SET balance_after=$1 WHERE id=$2', [fmt(running), t.id])
      }
    }
    res.status(204).end()
  } catch (e) { res.status(500).json({ message: e.message }) }
})

export default r
