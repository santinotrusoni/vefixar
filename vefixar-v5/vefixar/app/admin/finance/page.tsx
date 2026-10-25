'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
const f = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const COL = ['#FF5A1F', '#FFFFFF', '#A3A3A3', '#FFB38F', '#7A7A7A', '#D94A15']
const KIND: Record<string, string> = { iphone: 'iPhone', accessory: 'Accesorios', other: 'Otros' }
function Donut({ data }: { data: [string, number][] }) {
  const t = data.reduce((a, d) => a + d[1], 0); if (!t) return <p className="text-mute">Sin datos en el período.</p>
  const R = 40, C = 2 * Math.PI * R; let off = 0
  return <div className="flex flex-wrap gap-6 items-center"><svg viewBox="0 0 100 100" className="w-48 h-48 -rotate-90">{data.map(([l, v], i) => { const len = v / t * C; const el = <circle key={l} cx="50" cy="50" r={R} fill="none" stroke={COL[i % COL.length]} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />; off += len; return el })}</svg>
    <ul className="text-sm space-y-1">{data.map(([l, v], i) => <li key={l}><span style={{ background: COL[i % COL.length] }} className="inline-block w-3 h-3 rounded-sm mr-2" />{l}: {f(v)} ({Math.round(v / t * 100)}%)</li>)}</ul></div>
}
const add = (m: Record<string, number>, k: string, v: number) => { m[k] = (m[k] || 0) + v }
export default function Finance() {
  const [per, setPer] = useState('month'), [chart, setChart] = useState('cat'), [sales, setSales] = useState<any[]>([]), [exp, setExp] = useState<any[]>([]), [rep, setRep] = useState<any[]>([]), [hist, setHist] = useState<any[]>([]), [e, setE] = useState({ concept: '', category: '', amount: '' }), [msg, setMsg] = useState('')
  const from = () => { const d = new Date(); d.setHours(0, 0, 0, 0); if (per === 'week') d.setDate(d.getDate() - 6); if (per === 'month') d.setDate(1); if (per === 'year') d.setMonth(0, 1); return d.toISOString() }
  const load = async () => {
    const [a, b, c] = await Promise.all([sb.from('sales').select('id,total,payments,created_at,sale_items(qty,unit_price,unit_cost,products(kind))').eq('status', 'completed').gte('created_at', from()), sb.from('expenses').select('*').gte('created_at', from()), sb.from('repairs').select('quote,repair_parts(qty,unit_cost)').eq('status', 'delivered').gte('delivered_at', from())])
    setSales(a.data ?? []); setExp(b.data ?? []); setRep(c.data ?? [])
    const d = new Date(); d.setMonth(d.getMonth() - 11, 1); d.setHours(0, 0, 0, 0)
    const h = await sb.from('sales').select('total,created_at').eq('status', 'completed').gte('created_at', d.toISOString()); setHist(h.data ?? [])
  }
  useEffect(() => { load() }, [per])
  const items = sales.flatMap(s => s.sale_items), revenue = sales.reduce((a, s) => a + Number(s.total), 0)
  const partial = items.some((i: any) => i.unit_cost == null), cogs = items.reduce((a: number, i: any) => a + i.qty * Number(i.unit_cost ?? 0), 0)
  const repRev = rep.reduce((a, r) => a + Number(r.quote ?? 0), 0), repCost = rep.reduce((a, r) => a + r.repair_parts.reduce((b: number, p: any) => b + p.qty * Number(p.unit_cost ?? 0), 0), 0)
  const expTot = exp.reduce((a, x) => a + Number(x.amount), 0)
  const byCat: Record<string, number> = {}, byPay: Record<string, number> = {}, byExp: Record<string, number> = {}
  items.forEach((i: any) => add(byCat, KIND[i.products?.kind] ?? 'Otros', i.qty * Number(i.unit_price)))
  sales.forEach(s => s.payments.forEach((p: any) => add(byPay, p.method, Number(p.amount))))
  exp.forEach(x => add(byExp, x.category || 'Sin categoría', Number(x.amount)))
  const data = Object.entries(chart === 'cat' ? byCat : chart === 'pay' ? byPay : byExp)
  async function addExp(ev: React.FormEvent) { ev.preventDefault(); const { error } = await sb.from('expenses').insert({ concept: e.concept, category: e.category || null, amount: Number(e.amount) }); if (error) return setMsg(error.message); setE({ concept: '', category: '', amount: '' }); setMsg(''); load() }
  function csv() { const rows = [['fecha', 'total', 'medios'], ...sales.map(s => [s.created_at, s.total, s.payments.map((p: any) => `${p.method}:${p.amount}`).join('|')])]
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(';')).join('\n')], { type: 'text/csv' })); a.download = 'ventas.csv'; a.click() }
  const card = (t: string, v: string) => <div className="bg-coal rounded-xl p-4"><p className="text-mute text-sm">{t}</p><p className="text-xl font-bold mt-1">{v}</p></div>
  return <main className="p-6 max-w-4xl space-y-5"><h1 className="text-2xl font-bold">Finanzas</h1>
    <div className="flex gap-2 flex-wrap"><select className="inp !w-auto" value={per} onChange={e => setPer(e.target.value)}><option value="today">Hoy</option><option value="week">7 días</option><option value="month">Este mes</option><option value="year">Este año</option></select>
      <select className="inp !w-auto" value={chart} onChange={e => setChart(e.target.value)}><option value="cat">Ventas por categoría</option><option value="pay">Ventas por medio de pago</option><option value="exp">Gastos por categoría</option></select><button onClick={csv} className="btn btn-s !py-2 text-sm">Exportar CSV</button></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{card('Ventas', f(revenue))}{card('Costo de mercadería', partial ? 'Estimación parcial' : f(cogs))}{card('Margen bruto', partial ? 'Ganancia no calculada' : f(revenue - cogs))}{card('Gastos', f(expTot))}{card('Reparaciones entregadas', f(repRev))}{card('Resultado estimado', partial ? 'Ganancia no calculada' : f(revenue + repRev - cogs - repCost - expTot))}</div>
    <div className="bg-coal rounded-xl p-5"><Donut data={data} /></div>
    {(() => { const m: Record<string, number> = {}; hist.forEach(s => add(m, s.created_at.slice(0, 7), Number(s.total))); const ks = Object.keys(m).sort(), mx = Math.max(1, ...Object.values(m))
      return <div className="bg-coal rounded-xl p-5"><p className="text-mute text-sm mb-3">Evolución mensual de ventas (12 meses)</p>{ks.length ? <div className="flex items-end gap-2 h-40">{ks.map(k => <div key={k} className="flex-1 h-full flex flex-col justify-end text-center text-xs"><div className="bg-brand rounded-t" style={{ height: `${m[k] / mx * 85}%` }} title={f(m[k])} />{k.slice(5)}/{k.slice(2, 4)}</div>)}</div> : <p className="text-mute">Sin datos.</p>}</div> })()}
    <form onSubmit={addExp} className="bg-coal rounded-xl p-4 grid sm:grid-cols-4 gap-2"><input className="inp" placeholder="Concepto" value={e.concept} onChange={x => setE({ ...e, concept: x.target.value })} required /><input className="inp" placeholder="Categoría (alquiler, insumos…)" value={e.category} onChange={x => setE({ ...e, category: x.target.value })} /><input className="inp" type="number" placeholder="Importe" value={e.amount} onChange={x => setE({ ...e, amount: x.target.value })} required /><button className="btn btn-p !py-2">Registrar gasto</button></form>{msg && <p className="text-red-400">{msg}</p>}</main>
}
