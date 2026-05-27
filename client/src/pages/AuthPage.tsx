import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/UI'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode]     = useState<Mode>('login')
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [password, setPass] = useState('')
  const [err,  setErr]      = useState('')
  const [busy, setBusy]     = useState(false)
  const { login, register } = useAuth()
  const navigate            = useNavigate()

  const submit = async () => {
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) { setErr('Name is required.'); setBusy(false); return }
        await register(name, email, password)
      }
      navigate('/dashboard')
    } catch (e: unknown) { setErr((e as Error).message) }
    setBusy(false)
  }

  const switchMode = (m: Mode) => { setMode(m); setErr('') }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:16 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:36, width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, color:'var(--green)' }}>Ledger</div>
          <div style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>Personal Finance Tracker</div>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'flex', background:'var(--bg)', borderRadius:'var(--rs)', padding:4, marginBottom:24 }}>
          {(['login','register'] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex:1, padding:'8px', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600,
              background: mode===m ? 'var(--surface)' : 'transparent',
              color: mode===m ? 'var(--green)' : 'var(--muted)',
              boxShadow: mode===m ? '0 1px 4px rgba(0,0,0,.3)' : 'none'
            }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {mode === 'register' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase' }}>Full Name</label>
              <Input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} disabled={busy}/>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase' }}>Email</label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} onKeyDown={e=>e.key==='Enter'&&submit()}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase' }}>Password</label>
            <Input type="password" placeholder={mode==='register'?'Min 6 characters':'Your password'} value={password} onChange={e=>setPass(e.target.value)} disabled={busy} onKeyDown={e=>e.key==='Enter'&&submit()}/>
          </div>

          {err && (
            <div style={{ background:'rgba(255,77,109,.1)', border:'1px solid var(--red)', borderRadius:'var(--rs)', padding:'10px 14px', color:'var(--red)', fontSize:13 }}>
              ⚠️ {err}
            </div>
          )}

          <button onClick={submit} disabled={busy} style={{
            marginTop:4, padding:'12px', borderRadius:'var(--rs)', border:'none',
            background: busy ? 'rgba(0,229,160,.5)' : 'var(--green)',
            color:'#000', fontSize:14, fontWeight:700, cursor: busy ? 'not-allowed' : 'pointer'
          }}>
            {busy
              ? (mode==='login' ? 'Signing in…' : 'Creating account…')
              : (mode==='login' ? 'Sign In'     : 'Create Account')}
          </button>
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--muted)' }}>
          {mode==='login' ? 'No account yet? ' : 'Already have an account? '}
          <button onClick={()=>switchMode(mode==='login'?'register':'login')} style={{ background:'none', border:'none', color:'var(--green)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            {mode==='login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
