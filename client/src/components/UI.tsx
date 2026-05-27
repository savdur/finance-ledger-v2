import React from 'react'

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'20px 24px', ...style }}>{children}</div>
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, marginBottom:18 }}>{children}</h3>
}
export function StatCard({ label, value, sub, color }: { label:string; value:string; sub?:string; color:'green'|'red'|'blue'|'gold' }) {
  const c = { green:'var(--green)', red:'var(--red)', blue:'var(--blue)', gold:'var(--gold)' }
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'18px 20px' }}>
      <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:500, color:c[color] }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{sub}</div>}
    </div>
  )
}
export function Badge({ type }: { type:'credit'|'debit' }) {
  return <span style={{ display:'inline-block', padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600,
    background: type==='credit'?'rgba(0,229,160,.12)':'rgba(255,77,109,.12)',
    color: type==='credit'?'var(--green)':'var(--red)' }}>{type.toUpperCase()}</span>
}
type BV = 'primary'|'outline'|'danger'
export function Btn({ children, onClick, variant='primary', sm, disabled, type='button' }: {
  children:React.ReactNode; onClick?:()=>void; variant?:BV; sm?:boolean; disabled?:boolean; type?:'button'|'submit'
}) {
  const base: React.CSSProperties = { padding:sm?'6px 14px':'10px 22px', borderRadius:'var(--rs)',
    fontSize:sm?12:14, fontWeight:600, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1,
    border:'none', transition:'all .2s', fontFamily:"'DM Sans',sans-serif" }
  const vs: Record<BV,React.CSSProperties> = {
    primary:{ background:'var(--green)', color:'#000' },
    outline:{ background:'transparent', border:'1px solid var(--border)', color:'var(--muted)' },
    danger: { background:'rgba(255,77,109,.15)', border:'1px solid var(--red)', color:'var(--red)' }
  }
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base,...vs[variant] }}>{children}</button>
}
export function FG({ label, children, full }: { label:string; children:React.ReactNode; full?:boolean }) {
  return <div style={{ display:'flex', flexDirection:'column', gap:6, gridColumn:full?'1/-1':undefined }}>
    <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
    {children}
  </div>
}
const inputStyle: React.CSSProperties = { width:'100%', background:'var(--bg)', border:'1px solid var(--border)',
  borderRadius:'var(--rs)', color:'var(--text)', padding:'10px 14px', fontSize:14, outline:'none' }
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...(props.style||{}) }}
    onFocus={e=>(e.target.style.borderColor='var(--green)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, resize:'vertical', minHeight:70, ...(props.style||{}) }}
    onFocus={e=>(e.target.style.borderColor='var(--green)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
}
export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>&{children:React.ReactNode}) {
  return <select {...props} style={{ ...inputStyle, ...(props.style||{}) }}
    onFocus={e=>(e.target.style.borderColor='var(--green)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}>{children}</select>
}
export function EmptyState({ icon, msg }: { icon:string; msg:string }) {
  return <div style={{ textAlign:'center', padding:48, color:'var(--muted)' }}>
    <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div><div>{msg}</div>
  </div>
}
export function Toast({ msg, type, show }: { msg:string; type:'success'|'error'; show:boolean }) {
  if (!show) return null
  return <div style={{ position:'fixed', bottom:28, right:28, background:'var(--surface)', border:'1px solid var(--border)',
    borderLeft:`3px solid ${type==='success'?'var(--green)':'var(--red)'}`, borderRadius:'var(--rs)',
    padding:'14px 20px', fontSize:14, zIndex:999, boxShadow:'0 8px 32px rgba(0,0,0,.4)',
    animation:'slideUp .3s ease', maxWidth:360 }}>
    <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    {msg}
  </div>
}
export function Modal({ open, onClose, title, children }: { open:boolean; onClose:()=>void; title:string; children:React.ReactNode }) {
  if (!open) return null
  return <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
    <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:28, width:'100%', maxWidth:440 }}>
      <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, marginBottom:16 }}>{title}</h3>
      {children}
    </div>
  </div>
}
export function ErrorBanner({ msg, onRetry }: { msg:string; onRetry?:()=>void }) {
  return <div style={{ background:'rgba(255,77,109,.1)', border:'1px solid var(--red)', borderRadius:'var(--rs)',
    padding:'12px 16px', color:'var(--red)', fontSize:13, marginBottom:20, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
    ⚠️ {msg}
    {onRetry && <button onClick={onRetry} style={{ background:'transparent', border:'1px solid var(--red)', color:'var(--red)', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:12 }}>Retry</button>}
  </div>
}
