import { useState, useEffect, useCallback } from 'react'
import { Accounts, Transactions, downloadCSV } from '../services/api'
import type { Transaction, Account } from '../services/api'
import { Card, Btn, Input, Select, Modal, Toast, ErrorBanner } from '../components/UI'
import TxnTable from '../components/TxnTable'

export default function TransactionsPage() {
  const [txns,  setTxns]  = useState<Transaction[]>([])
  const [accts, setAccts] = useState<Account[]>([])
  const [f, setF]         = useState({ search:'', accountId:'', type:'', from:'', to:'' })
  const [delId, setDelId] = useState<string|null>(null)
  const [err,   setErr]   = useState<string|null>(null)
  const [toast, setToast] = useState({ show:false, msg:'', type:'success' as 'success'|'error' })

  const showToast = (msg: string, type: 'success'|'error'='success') => {
    setToast({show:true,msg,type}); setTimeout(()=>setToast(p=>({...p,show:false})),4000)
  }

  const load = useCallback(async () => {
    try {
      setErr(null)
      setTxns(await Transactions.list({ accountId:f.accountId||undefined, type:f.type||undefined, from:f.from||undefined, to:f.to||undefined, search:f.search||undefined }))
    } catch (e: unknown) { setErr((e as Error).message) }
  }, [f])

  useEffect(()=>{ Accounts.list().then(setAccts).catch(()=>{}) },[])
  useEffect(()=>{ load() },[load])

  const doDelete = async () => {
    if (!delId) return
    try { await Transactions.remove(delId); showToast('Transaction deleted','error'); load() }
    catch (e: unknown) { showToast((e as Error).message,'error') }
    setDelId(null)
  }

  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setF(p=>({...p,[k]:e.target.value}))
  const iS: React.CSSProperties = { maxWidth:160 }

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26}}>All Transactions</h1>
        <p style={{color:'var(--muted)',fontSize:13,marginTop:4}}>Full history with search and filters</p>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <Input placeholder="Search…" style={iS} value={f.search} onChange={sf('search')}/>
        <Select style={iS} value={f.accountId} onChange={sf('accountId')}>
          <option value="">All Accounts</option>
          {accts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <Select style={iS} value={f.type} onChange={sf('type')}>
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </Select>
        <Input type="date" style={iS} value={f.from} onChange={sf('from')}/>
        <Input type="date" style={iS} value={f.to}   onChange={sf('to')}/>
        <Btn variant="outline" sm onClick={()=>setF({search:'',accountId:'',type:'',from:'',to:''})}>Clear</Btn>
        <Btn sm onClick={()=>downloadCSV(txns,'transactions.csv')}>Export CSV</Btn>
      </div>

      {err && <ErrorBanner msg={err} onRetry={load}/>}
      <Card><TxnTable txns={txns} onDelete={setDelId}/></Card>

      <Modal open={!!delId} onClose={()=>setDelId(null)} title="Delete Transaction">
        <p style={{color:'var(--dim)',lineHeight:1.6}}>Delete this transaction? Balances will be recalculated. Cannot be undone.</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:22}}>
          <Btn variant="outline" onClick={()=>setDelId(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={doDelete}>Delete</Btn>
        </div>
      </Modal>
      <Toast msg={toast.msg} type={toast.type} show={toast.show}/>
    </div>
  )
}
