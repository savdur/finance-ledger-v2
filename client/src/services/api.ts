import axios from 'axios'

// CORRECT approach:
// - VITE_API_URL must always be set (both dev and prod)
// - Dev:  http://localhost:5000/api
// - Prod: https://finance-ledger-api.onrender.com/api
// - Vite proxy is NOT used — we call the API directly always

const VITE_API_URL = import.meta.env.VITE_API_URL as string

if (!VITE_API_URL) {
  console.error('VITE_API_URL is not set! Check your .env file or Vercel environment variables.')
}

const BASE = `${VITE_API_URL}/api`

console.log('API base URL:', BASE) // helps debug in production

const api = axios.create({ baseURL: BASE })

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fl_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Surface real error messages
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fl_token')
      localStorage.removeItem('fl_user')
      window.location.href = '/login'
    }
    const data = err?.response?.data
    const msg  = (typeof data === 'string' ? data : data?.message) ?? err?.message ?? 'Network error'
    return Promise.reject(new Error(msg))
  }
)

// ── Types ──────────────────────────────────────────────────────
export interface User   { id: string; name: string; email: string }
export interface Account {
  id: string; name: string; bank: string; accountNumber: string
  openingBalance: number; accountType: string; currency: string
  currentBalance: number; createdAt: string
}
export interface Transaction {
  id: string; accountId: string; accountName: string; currency: string
  type: 'credit'|'debit'; amount: number; date: string
  category: string; reason: string; balanceAfter: number; createdAt: string
}
export interface Dashboard {
  totalBalance: number; todayCredit: number; todayDebit: number
  monthNetFlow: number; recentTransactions: Transaction[]
}
export interface Report {
  totalCredit: number; totalDebit: number; netFlow: number
  transactionCount: number; averageAmount: number; largestAmount: number
  categories: { category: string; type: string; total: number }[]
  transactions: Transaction[]
}

// ── Auth ───────────────────────────────────────────────────────
export const Auth = {
  register: (name: string, email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { name, email, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get<User>('/auth/me').then(r => r.data),
}

// ── Accounts ───────────────────────────────────────────────────
export const Accounts = {
  list:   ()                                                            => api.get<Account[]>('/accounts').then(r => r.data),
  create: (d: Omit<Account,'id'|'currentBalance'|'createdAt'>)        => api.post<Account>('/accounts', d).then(r => r.data),
  update: (id: string, d: Omit<Account,'id'|'currentBalance'|'createdAt'>) => api.put<Account>(`/accounts/${id}`, d).then(r => r.data),
  remove: (id: string)                                                  => api.delete(`/accounts/${id}`),
}

// ── Transactions ───────────────────────────────────────────────
export const Transactions = {
  list: (p?: { accountId?:string; type?:string; from?:string; to?:string; search?:string }) =>
    api.get<Transaction[]>('/transactions', { params: p }).then(r => r.data),
  create: (d: { accountId:string; type:string; amount:number; date:string; category:string; reason:string }) =>
    api.post<Transaction>('/transactions', d).then(r => r.data),
  remove: (id: string) => api.delete(`/transactions/${id}`),
  dashboard: () => api.get<Dashboard>('/transactions/dashboard').then(r => r.data),
  report: (p: { from:string; to:string; accountId?:string }) =>
    api.get<Report>('/transactions/report', { params: p }).then(r => r.data),
}

// ── Helpers ────────────────────────────────────────────────────
export const fmt = (n: number, cur = 'INR') =>
  new Intl.NumberFormat('en-IN', { style:'currency', currency:cur, minimumFractionDigits:2 }).format(n||0)
export const fmtDate = (d: string) =>
  new Date(d+'T00:00:00').toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
export const todayStr = () => new Date().toISOString().slice(0,10)
export function downloadCSV(txns: Transaction[], filename: string) {
  const rows = [['Date','Account','Type','Category','Reason','Amount','Balance After'],
    ...txns.map(t=>[t.date,t.accountName,t.type,t.category,`"${t.reason.replace(/"/g,'""')}"`,t.amount,t.balanceAfter])]
  const url = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}))
  Object.assign(document.createElement('a'),{href:url,download:filename}).click()
  URL.revokeObjectURL(url)
}
