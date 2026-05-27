import { useState, useEffect, useRef } from 'react'
import { Accounts, Transactions, fmt, todayStr } from '../services/api'
import type { Dashboard as DashType, Account } from '../services/api'
import { Card, CardTitle, StatCard, Btn, FG, Input, Select, Textarea, Toast, Modal, ErrorBanner } from '../components/UI'
import TxnTable from '../components/TxnTable'

const CREDIT_CATS = ['Salary','Freelance','Interest','Transfer In','Refund','Gift','Other Income']
const DEBIT_CATS  = ['Food & Dining','Shopping','Transport','Bills & Utilities','Healthcare','Entertainment','Education','Rent','Transfer Out','Other Expense']

export default function Dashboard() {
  const [dash, setDash]       = useState<DashType|null>(null)
  const [accts, setAccts]     = useState<Account[]>([])
  const [txnType, setTxnType] = useState<'credit'|'debit'>('credit')
  const [form, setForm]       = useState({ accountId:'', amount:'', date:todayStr(), category:'', reason:'' })
  const [busy, setBusy]       = useState(false)
  const [delId, setDelId]     = useState<string|null>(null)
  const [err, setErr]         = useState<string|null>(null)
  const [toast, setToast]     = useState({ show:false, msg:'', type:'success' as 'success'|'error' })
  const formRef               = useRef(form); formRef.current = form

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ show:true, msg, type }); setTimeout(()=>setToast(p=>({...p,show:false})), 4000)
  }

  const load = async () => {
    try {
      setErr(null)
      const [d, a] = await Promise.all([Transactions.dashboard(), Accounts.list()])
      setDash(d); setAccts(a)
      if (a.length && !formRef.current.accountId) setForm(p=>({...p, accountId: a[0].id}))
    } catch (e: unknown) { setErr((e as Error).message) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p=>({...p,[k]:e.target.value}))

  const addTxn = async () => {
    if (!form.accountId)                              return showToast('Select an account first.','error')
    if (!parseFloat(form.amount)||parseFloat(form.amount)<=0) return showToast('Enter a valid amount > 0.','error')
    if (!form.reason.trim())                          return showToast('Reason is required.','error')
    setBusy(true)
    try {
      await Transactions.create({ accountId:form.accountId, type:txnType, amount:parseFloat(form.amount), date:form.date||todayStr(), category:form.category, reason:form.reason })
      setForm(p=>({...p, amount:'', category:'', reason:'', date:todayStr()}))
      showToast(txnType==='credit'?'✓ Credit added':'✓ Debit recorded')
      load()
    } catch (e: unknown) { showToast((e as Error).message,'error') }
    setBusy(false)
  }

  const doDelete = async () => {
    if (!delId) return
    try { await Transactions.remove(delId); showToast('Transaction deleted','error'); load() }
    catch (e: unknown) { showToast((e as Error).message,'error') }
    setDelId(null)
  }

  const net = dash?.monthNetFlow ?? 0
  const typeBtn = (t: 'credit'|'debit'): React.CSSProperties => ({
    flex:1, padding:'10px', borderRadius:'var(--rs)', fontWeight:600, fontSize:14, cursor:'pointer',
    border:`1px solid ${txnType===t?(t==='credit'?'var(--green)':'var(--red)'):'var(--border)'}`,
    background: txnType===t?(t==='credit'?'rgba(0,229,160,.12)':'rgba(255,77,109,.12)'):'var(--bg)',
    color: txnType===t?(t==='credit'?'var(--green)':'var(--red)'):'var(--muted)',
  })

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26}}>Dashboard</h1>
        <p style={{color:'var(--muted)',fontSize:13,marginTop:4}}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>

      {err && <ErrorBanner msg={err} onRetry={load}/>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        <StatCard label="Total Balance" value={fmt(dash?.totalBalance??0)} sub="All accounts" color="gold"/>
        <StatCard label="Today Credit"  value={fmt(dash?.todayCredit??0)}  sub="Money in"    color="green"/>
        <StatCard label="Today Debit"   value={fmt(dash?.todayDebit??0)}   sub="Money out"   color="red"/>
        <StatCard label="This Month"    value={(net>=0?'+':'')+fmt(net)}   sub="Net flow"    color={net>=0?'green':'red'}/>
      </div>

      <Card style={{marginBottom:20}}>
        <CardTitle>Add Transaction</CardTitle>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
          <label style={{fontSize:12,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',whiteSpace:'nowrap'}}>Account</label>
          <Select value={form.accountId} onChange={set('accountId')} style={{flex:1}}>
            {accts.length===0
              ? <option value="">— Add an account first —</option>
              : accts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.bank}) · {fmt(a.currentBalance,a.currency)}</option>)}
          </Select>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <button style={typeBtn('credit')} onClick={()=>setTxnType('credit')}>＋ Credit</button>
          <button style={typeBtn('debit')}  onClick={()=>setTxnType('debit')}>－ Debit</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <FG label="Amount"><Input type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={set('amount')} disabled={busy}/></FG>
          <FG label="Date"><Input type="date" value={form.date} onChange={set('date')} disabled={busy}/></FG>
          <FG label="Category">
            <Select value={form.category} onChange={set('category')} disabled={busy}>
              <option value="">— Select —</option>
              <optgroup label="Credit">{CREDIT_CATS.map(c=><option key={c}>{c}</option>)}</optgroup>
              <optgroup label="Debit">{DEBIT_CATS.map(c=><option key={c}>{c}</option>)}</optgroup>
            </Select>
          </FG>
          <div style={{gridColumn:'1/-1'}}>
            <FG label="Reason / Description"><Textarea placeholder="Describe this transaction…" value={form.reason} onChange={set('reason')} disabled={busy}/></FG>
          </div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
          <Btn variant="outline" onClick={()=>setForm(p=>({...p,amount:'',category:'',reason:''}))} disabled={busy}>Clear</Btn>
          <Btn onClick={addTxn} disabled={busy||accts.length===0}>{busy?'Adding…':'Add Entry'}</Btn>
        </div>
      </Card>

      <Card>
        <CardTitle>Recent Transactions</CardTitle>
        <TxnTable txns={dash?.recentTransactions??[]} onDelete={setDelId}/>
      </Card>

      <Modal open={!!delId} onClose={()=>setDelId(null)} title="Delete Transaction">
        <p style={{color:'var(--dim)',lineHeight:1.6}}>Delete this transaction? Running balances will be recalculated. Cannot be undone.</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:22}}>
          <Btn variant="outline" onClick={()=>setDelId(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={doDelete}>Delete</Btn>
        </div>
      </Modal>
      <Toast msg={toast.msg} type={toast.type} show={toast.show}/>
    </div>
  )
}
