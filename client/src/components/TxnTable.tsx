import { Badge, EmptyState } from './UI'
import { fmt, fmtDate } from '../services/api'
import type { Transaction } from '../services/api'

const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, textTransform:'uppercase', letterSpacing:'.8px', color:'var(--muted)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }
const td: React.CSSProperties = { padding:'12px 14px', borderBottom:'1px solid rgba(37,42,58,.5)', fontSize:13, verticalAlign:'middle' }

export default function TxnTable({ txns, onDelete }: { txns: Transaction[]; onDelete?: (id:string)=>void }) {
  if (!txns.length) return <EmptyState icon="📒" msg="No transactions found." />
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            {['Date','Account','Type','Category','Reason','Amount','Balance After',...(onDelete?['']:[])]
              .map(h=><th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {txns.map(t=>(
            <tr key={t.id} onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
              <td style={td}>{fmtDate(t.date)}</td>
              <td style={{...td,color:'var(--dim)'}}>{t.accountName}</td>
              <td style={td}><Badge type={t.type}/></td>
              <td style={{...td,color:'var(--dim)',fontSize:12}}>{t.category||'—'}</td>
              <td style={{...td,color:'var(--dim)',maxWidth:180}}>{t.reason}</td>
              <td style={{...td,fontFamily:"'DM Mono',monospace",fontWeight:500,color:t.type==='credit'?'var(--green)':'var(--red)'}}>
                {t.type==='credit'?'+':'−'}{fmt(t.amount,t.currency)}
              </td>
              <td style={{...td,fontFamily:"'DM Mono',monospace",color:'var(--dim)',fontSize:12}}>{fmt(t.balanceAfter,t.currency)}</td>
              {onDelete&&<td style={td}><button onClick={()=>onDelete(t.id)} style={{ background:'rgba(255,77,109,.15)', border:'1px solid var(--red)', color:'var(--red)', borderRadius:4, padding:'4px 8px', cursor:'pointer', fontSize:12 }}>✕</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
