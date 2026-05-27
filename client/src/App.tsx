import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage      from './pages/AuthPage'
import Dashboard     from './pages/Dashboard'
import TransactionsPage from './pages/Transactions'
import AccountsPage  from './pages/AccountsPage'
import Reports       from './pages/Reports'

function Layout() {
  const { user, logout } = useAuth()

  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    padding:'7px 16px', borderRadius:'var(--rs)', fontSize:13, fontWeight:500,
    color: isActive?'var(--green)':'var(--muted)',
    background: isActive?'rgba(0,229,160,.1)':'transparent',
    textDecoration:'none', transition:'all .2s'
  })

  return (
    <>
      <nav style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:60,position:'sticky',top:0,zIndex:100}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:'var(--green)',letterSpacing:'-.5px',display:'flex',alignItems:'center',gap:8}}>
          Ledger
          <span style={{color:'var(--muted)',fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Personal Finance Tracker</span>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <NavLink to="/dashboard"    style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/transactions" style={linkStyle}>Transactions</NavLink>
          <NavLink to="/accounts"     style={linkStyle}>Accounts</NavLink>
          <NavLink to="/reports"      style={linkStyle}>Reports</NavLink>
          <div style={{marginLeft:12,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:12,color:'var(--muted)'}}>👤 {user?.name}</span>
            <button onClick={logout} style={{background:'transparent',border:'1px solid var(--border)',color:'var(--muted)',borderRadius:'var(--rs)',padding:'5px 12px',cursor:'pointer',fontSize:12}}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 24px'}}>
        <Routes>
          <Route path="/"             element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/dashboard"    element={<Dashboard/>}/>
          <Route path="/transactions" element={<TransactionsPage/>}/>
          <Route path="/accounts"     element={<AccountsPage/>}/>
          <Route path="/reports"      element={<Reports/>}/>
        </Routes>
      </div>
    </>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--muted)'}}>Loading…</div>
  return user ? <>{children}</> : <Navigate to="/login" replace/>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"  element={<AuthPage/>}/>
        <Route path="/*" element={<ProtectedRoute><Layout/></ProtectedRoute>}/>
      </Routes>
    </AuthProvider>
  )
}
