import { useState, useEffect } from 'react'
import { Accounts, fmt } from '../services/api'
import type { Account } from '../services/api'
import { Card, CardTitle, Btn, FG, Input, Select, EmptyState, Toast, ErrorBanner } from '../components/UI'

const EMPTY = { name:'', bank:'', accountNumber:'', openingBalance:'', accountType:'Savings', currency:'INR' }

export default function AccountsPage() {
  const [list, setList]     = useState<Account[]>([])
  const [form, setForm]     = useState({...EMPTY})
  const [editId, setEditId] = useState<string|null>(null)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState<string|null>(null)
  const [toast, setToast]   = useState({ show:false, msg:'', type:'success' as 'success'|'error' })

  const showToast = (msg: string, type: 'success'|'error'='success') => {
    setToast({show:true,msg,type}); setTimeout(()=>setToast(p=>({...p,show:false})),4000)
  }

  const load = async () => {
    try { setErr(null); setList(await Accounts.list()) }
    catch (e: unknown) { setErr((e as Error).message) }
  }
  useEffect(()=>{ load() },[])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p=>({...p,[k]:e.target.value}))

  const save = async () => {
    if (!form.name.trim()) return showToast('Account name is required.','error')
    const bal = parseFloat(form.openingBalance)
    if (isNaN(bal)||bal<0) return showToast('Opening balance must be 0 or more.','error')
    setBusy(true)
    try {
      const payload = { name:form.name.trim(), bank:form.bank.trim(), accountNumber:form.accountNumber.trim(), openingBalance:bal, accountType:form.accountType, currency:form.currency }
      if (editId) { await Accounts.update(editId, payload); showToast('Account updated!') }
      else        { await Accounts.create(payload);          showToast('Account saved!') }
      setForm({...EMPTY}); setEditId(null); load()
    } catch (e: unknown) { showToast((e as Error).message,'error') }
    setBusy(false)
  }

  const startEdit = (a: Account) => {
    setEditId(a.id)
    setForm({ name:a.name, bank:a.bank, accountNumber:a.accountNumber, openingBalance:String(a.openingBalance), accountType:a.accountType, currency:a.currency })
    window.scrollTo({top:0,behavior:'smooth'})
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this account and ALL its transactions?')) return
    try { await Accounts.remove(id); showToast('Account deleted','error'); load() }
    catch (e: unknown) { showToast((e as Error).message,'error') }
  }

  const item: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--rs)', flexWrap:'wrap', gap:12, marginBottom:10 }

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26}}>Bank Accounts</h1>
        <p style={{color:'var(--muted)',fontSize:13,marginTop:4}}>Manage your source accounts and opening balances</p>
      </div>

      <Card style={{marginBottom:20}}>
        <CardTitle>{editId?'Edit Account':'Add New Account'}</CardTitle>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <FG label="Account Name"><Input placeholder="e.g. ICICI Savings" value={form.name} onChange={set('name')} disabled={busy}/></FG>
          <FG label="Bank / Institution"><Input placeholder="e.g. ICICI Bank" value={form.bank} onChange={set('bank')} disabled={busy}/></FG>
          <FG label="Account Number (last 4)"><Input placeholder="e.g. 7890" maxLength={10} value={form.accountNumber} onChange={set('accountNumber')} disabled={busy}/></FG>
          <FG label="Opening Balance"><Input type="number" placeholder="0.00" min="0" step="0.01" value={form.openingBalance} onChange={set('openingBalance')} disabled={busy}/></FG>
          <FG label="Account Type">
            <Select value={form.accountType} onChange={set('accountType')} disabled={busy}>
              {['Savings','Current','Fixed Deposit','Credit Card','E-Wallet','Cash'].map(t=><option key={t}>{t}</option>)}
            </Select>
          </FG>
          <FG label="Currency">
            <Select value={form.currency} onChange={set('currency')} disabled={busy}>
              <option value="INR">INR – Indian Rupee</option>
              <option value="SGD">SGD – Singapore Dollar</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
              <option value="MYR">MYR – Malaysian Ringgit</option>
            </Select>
          </FG>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
          <Btn variant="outline" disabled={busy} onClick={()=>{setForm({...EMPTY});setEditId(null)}}>Cancel</Btn>
          <Btn disabled={busy} onClick={save}>{busy?'Saving…':editId?'Update Account':'Save Account'}</Btn>
        </div>
      </Card>

      <Card>
        <CardTitle>Your Accounts</CardTitle>
        {err && <ErrorBanner msg={err} onRetry={load}/>}
        {!err && list.length===0
          ? <EmptyState icon="🏦" msg="No accounts yet. Add your first bank account above."/>
          : list.map(a=>(
            <div key={a.id} style={{...item, borderColor:editId===a.id?'var(--green)':'var(--border)'}}>
              <div>
                <div style={{fontWeight:600}}>{a.name}<span style={{color:'var(--muted)',fontSize:12,fontFamily:"'DM Mono',monospace",marginLeft:8}}>•••• {a.accountNumber||'----'}</span></div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>{a.bank||'—'} | {a.accountType} | {a.currency}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Opening: {fmt(a.openingBalance,a.currency)}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:16,color:'var(--gold)',marginRight:6}}>{fmt(a.currentBalance,a.currency)}</span>
                <Btn variant="outline" sm onClick={()=>startEdit(a)}>Edit</Btn>
                <Btn variant="danger"  sm onClick={()=>remove(a.id)}>Delete</Btn>
              </div>
            </div>
          ))
        }
      </Card>
      <Toast msg={toast.msg} type={toast.type} show={toast.show}/>
    </div>
  )
}
