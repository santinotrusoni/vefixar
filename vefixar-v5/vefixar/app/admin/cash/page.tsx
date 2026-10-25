'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
const f = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
export default function Cash() {
  const [open, setOpen] = useState<any>(null), [hist, setHist] = useState<any[]>([]), [cashIn, setCashIn] = useState(0), [v, setV] = useState(''), [notes, setNotes] = useState(''), [msg, setMsg] = useState(''), [extra, setExtra] = useState(0), [mv, setMv] = useState<any[]>([]), [mf, setMf] = useState({ type: 'retiro', amount: '', reason: '' })
  const load = async () => {
    const { data } = await sb.from('cash_sessions').select('*').order('opened_at', { ascending: false }).limit(11)
    const o = (data ?? []).find(s => !s.closed_at) ?? null; setOpen(o); setHist((data ?? []).filter(s => s.closed_at))
    if (o) { const r = await sb.from('sales').select('payments').eq('status', 'completed').gte('created_at', o.opened_at)
      setCashIn((r.data ?? []).flatMap((s: any) => s.payments).filter((p: any) => p.method === 'efectivo').reduce((a: number, p: any) => a + Number(p.amount), 0)) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (!open) return; (async () => { const [rp, m] = await Promise.all([sb.from('repair_payments').select('amount').eq('method', 'efectivo').gte('created_at', open.opened_at), sb.from('cash_movements').select('*').gte('created_at', open.opened_at).order('created_at')])
    setExtra((rp.data ?? []).reduce((a, x) => a + Number(x.amount), 0)); setMv(m.data ?? []) })() }, [open])
  const expected = open ? Number(open.opening) + cashIn + extra + mv.reduce((a, x) => a + (x.type === 'ingreso' ? 1 : -1) * Number(x.amount), 0) : 0
  async function openBox() { if (v === '') return; const { error } = await sb.from('cash_sessions').insert({ opening: Number(v) }); if (error) return setMsg(error.message); setV(''); setMsg(''); load() }
  async function closeBox() {
    if (v === '' || !confirm('El cierre no se puede modificar. ¿Confirmar?')) return
    const { error } = await sb.from('cash_sessions').update({ closed_at: new Date().toISOString(), counted: Number(v), expected, notes }).eq('id', open.id)
    if (error) return setMsg(error.message); setV(''); setNotes(''); setMsg(''); load()
  }
  return <main className="p-6 max-w-2xl space-y-4"><h1 className="text-2xl font-bold">Caja</h1>
    <div className="bg-coal rounded-xl p-4 space-y-3">
      {!open ? <><p className="text-mute">No hay caja abierta.</p><input className="inp" type="number" placeholder="Saldo inicial" value={v} onChange={e => setV(e.target.value)} /><button onClick={openBox} className="btn btn-p w-full">Abrir caja</button></>
        : <><p>Abierta: {new Date(open.opened_at).toLocaleString('es-AR')}</p><p>Saldo inicial: {f(Number(open.opening))}</p><p>Ventas en efectivo: {f(cashIn)}</p><p className="text-xl font-bold">Efectivo esperado: <span className="text-brand">{f(expected)}</span></p>
          <input className="inp" type="number" placeholder="Efectivo contado" value={v} onChange={e => setV(e.target.value)} />
          {v !== '' && <p>Diferencia: {f(Number(v) - expected)}</p>}
          <input className="inp" placeholder="Observaciones" value={notes} onChange={e => setNotes(e.target.value)} /><button onClick={closeBox} className="btn btn-p w-full">Cerrar caja</button></>}
      {msg && <p className="text-red-400">{msg}</p>}</div>
    {open && <div className="bg-coal rounded-xl p-4 space-y-2"><p className="font-bold">Movimientos de caja (efectivo)</p><p className="text-mute text-sm">Cobros de reparaciones en efectivo: {f(extra)}</p>
      <div className="flex flex-wrap gap-2"><select className="inp !w-auto" value={mf.type} onChange={e => setMf({ ...mf, type: e.target.value })}><option value="retiro">Retiro</option><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select><input className="inp !w-28" type="number" placeholder="Importe" value={mf.amount} onChange={e => setMf({ ...mf, amount: e.target.value })} /><input className="inp flex-1" placeholder="Motivo" value={mf.reason} onChange={e => setMf({ ...mf, reason: e.target.value })} />
        <button className="btn btn-s !py-1 text-sm" onClick={async () => { if (!mf.reason || Number(mf.amount) <= 0) return; const { error } = await sb.from('cash_movements').insert({ type: mf.type, amount: Number(mf.amount), reason: mf.reason }); if (error) return setMsg(error.message); setMf({ ...mf, amount: '', reason: '' }); setOpen({ ...open }) }}>Agregar</button></div>
      {mv.map(x => <p key={x.id} className="text-sm text-mute">{x.type} · {f(Number(x.amount))} · {x.reason}</p>)}</div>}
    <h2 className="font-bold">Cierres anteriores</h2>
    {hist.map(h => <div key={h.id} className="bg-coal rounded-xl p-3 text-sm flex justify-between"><span>{new Date(h.closed_at).toLocaleString('es-AR')}</span><span>Esperado {f(Number(h.expected))} · Contado {f(Number(h.counted))} · Dif. {f(Number(h.counted) - Number(h.expected))}</span></div>)}
    {!hist.length && <p className="text-mute">Sin cierres registrados.</p>}</main>
}
