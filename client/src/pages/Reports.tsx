import { useState, useEffect } from 'react'
import { Accounts, Transactions, fmt, downloadCSV } from '../services/api'
import type { Report, Account } from '../services/api'
import { Card, CardTitle, Btn, FG, Input, Select, Badge, Toast, ErrorBanner } from '../components/UI'
import TxnTable from '../components/TxnTable'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

type Period = 'today'|'week'|'month'|'year'|'custom'

function getRange(p: Period, cf: string, ct: string): [string,string] {
  const td = new Date().toISOString().slice(0,10)
  if (p==='today') return [td,td]
  if (p==='week')  { const d=new Date(); d.setDate(d.getDate()-d.getDay()); return [d.toISOString().slice(0,10),td] }
  if (p==='month') return [td.slice(0,7)+'-01',td]
  if (p==='year')  return [td.slice(0,4)+'-01-01',td]
  return [cf||'2000-01-01', ct||td]
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>('month')
  const [cfrom,  setCfrom]  = useState('')
  const [cto,    setCto]    = useState('')
  const [acctId, setAcctId] = useState('')
  const [accts,  setAccts]  = useState<Account[]>([])
  const [report, setReport] = useState<Report|null>(null)
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState<string|null>(null)
  const [toast,  setToast]  = useState({ show:false, msg:'', type:'success' as 'success'|'error' })

  const showToast = (msg: string, type: 'success'|'error'='success') => {
    setToast({show:true,msg,type}); setTimeout(()=>setToast(p=>({...p,show:false})),4000)
  }

  useEffect(()=>{ Accounts.list().then(setAccts).catch(()=>{}) },[])

  const generate = async () => {
    setBusy(true); setErr(null)
    try {
      const [from,to] = getRange(period,cfrom,cto)
      setReport(await Transactions.report({ from, to, accountId:acctId||undefined }))
    } catch (e: unknown) { setErr((e as Error).message) }
    setBusy(false)
  }

  useEffect(()=>{ generate() },[]) // eslint-disable-line

  const net = report?.netFlow ?? 0
  const chartData = report ? (() => {
    const m: Record<string,{date:string;credit:number;debit:number}> = {}
    report.transactions.forEach(t => {
      if (!m[t.date]) m[t.date] = {date:t.date,credit:0,debit:0}
      m[t.date][t.type] += t.amount
    })
    return Object.values(m).sort((a,b)=>a.date.localeCompare(b.date))
  })() : []

  const sb = (label: string, val: string, color: string) => (
    <div key={label} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--rs)',padding:'16px 18px'}}>
      <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.8px',color:'var(--muted)',marginBottom:6}}>{label}</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,color}}>{val}</div>
    </div>
  )

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26}}>Reports</h1>
        <p style={{color:'var(--muted)',fontSize:13,marginTop:4}}>Analyze your financial flows across any period</p>
      </div>

      <Card style={{marginBottom:20}}>
        <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'flex-end'}}>
          <FG label="Period">
            <Select value={period} onChange={e=>setPeriod(e.target.value as Period)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </Select>
          </FG>
          {period==='custom'&&<>
            <FG label="From"><Input type="date" value={cfrom} onChange={e=>setCfrom(e.target.value)}/></FG>
            <FG label="To">  <Input type="date" value={cto}   onChange={e=>setCto(e.target.value)}/></FG>
          </>}
          <FG label="Account">
            <Select value={acctId} onChange={e=>setAcctId(e.target.value)}>
              <option value="">All Accounts</option>
              {accts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </FG>
          <Btn onClick={generate} disabled={busy}>{busy?'Generating…':'Generate Report'}</Btn>
          <Btn variant="outline" onClick={()=>{ if(!report?.transactions.length) return showToast('Generate a report first','error'); downloadCSV(report.transactions,'report.csv') }}>Export CSV</Btn>
        </div>
      </Card>

      {err && <ErrorBanner msg={err} onRetry={generate}/>}

      {report && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
          {sb('Total Credit',  fmt(report.totalCredit),  'var(--green)')}
          {sb('Total Debit',   fmt(report.totalDebit),   'var(--red)')}
          {sb('Net Flow',     (net>=0?'+':'')+fmt(net),  net>=0?'var(--green)':'var(--red)')}
          {sb('Transactions',  String(report.transactionCount), 'var(--blue)')}
          {sb('Avg per Entry', fmt(report.averageAmount), 'var(--text)')}
          {sb('Largest Entry', fmt(report.largestAmount), 'var(--gold)')}
        </div>

        {chartData.length>0&&(
          <Card style={{marginBottom:20}}>
            <CardTitle>Daily Credit vs Debit</CardTitle>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{top:4,right:16,left:0,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252a3a"/>
                <XAxis dataKey="date" tick={{fill:'#6b7280',fontSize:11}}/>
                <YAxis tick={{fill:'#6b7280',fontSize:11}}/>
                <Tooltip contentStyle={{background:'#141720',border:'1px solid #252a3a',borderRadius:8}} labelStyle={{color:'#e8eaf0'}} formatter={(v:unknown)=>fmt(Number(v))}/>
                <Legend wrapperStyle={{fontSize:12,color:'#9ca3af'}}/>
                <Bar dataKey="credit" name="Credit" fill="#00e5a0" radius={[4,4,0,0]}/>
                <Bar dataKey="debit"  name="Debit"  fill="#ff4d6d" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card style={{marginBottom:20}}>
          <CardTitle>Category Breakdown</CardTitle>
          {report.categories.length===0
            ? <p style={{color:'var(--muted)'}}>No data.</p>
            : report.categories.map((c,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <Badge type={c.type as 'credit'|'debit'}/>
                  <span style={{color:'var(--dim)',fontSize:13}}>{c.category||'Uncategorized'}</span>
                </div>
                <span style={{fontFamily:"'DM Mono',monospace",fontWeight:500,color:c.type==='credit'?'var(--green)':'var(--red)'}}>
                  {c.type==='credit'?'+':'−'}{fmt(c.total)}
                </span>
              </div>
            ))
          }
        </Card>

        <Card><CardTitle>Transaction Details</CardTitle><TxnTable txns={report.transactions}/></Card>
      </>}
      <Toast msg={toast.msg} type={toast.type} show={toast.show}/>
    </div>
  )
}
