'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
const ST: [string, string][] = [['received', 'Recibido'], ['diagnosing', 'En diagnóstico'], ['quoted', 'Presupuestado'], ['awaiting_auth', 'Esperando autorización'], ['awaiting_parts', 'Esperando repuestos'], ['repairing', 'En reparación'], ['repaired', 'Reparado'], ['ready', 'Listo para entregar'], ['delivered', 'Entregado'], ['unrepairable', 'Sin reparación'], ['cancelled', 'Cancelado']]
function Card({ r, prods, reload, onErr }: { r: any; prods: any[]; reload: () => void; onErr: (m: string) => void }) {
  const [b, setB] = useState<Record<string, any>>({ labor: r.labor ?? '', parts_charge: r.parts_charge ?? '', other_charges: r.other_charges ?? '', discount: r.discount ?? '' }), [pm, setPm] = useState(''), [pmeth, setPmeth] = useState('efectivo'), [d, setD] = useState(r.deposit ?? 0), [dg, setDg] = useState(r.diagnosis ?? ''), [pid, setPid] = useState(''), [qty, setQty] = useState('1')
  const lbl = ST.find(s => s[0] === r.status)?.[1]
  const n = (v: any) => Number(v) || 0, tot = n(b.labor) + n(b.parts_charge) + n(b.other_charges) - n(b.discount), paid = n(d) + (r.repair_payments ?? []).reduce((a: number, p: any) => a + Number(p.amount), 0)
  const link = `https://wa.me/${(r.customers?.phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${r.customers?.name ?? ''}, tu equipo (orden #${r.order_no}) está: ${lbl}. Seguimiento: ${location.origin}/seguimiento/${r.track_token}`)}`
  const run = async (p: PromiseLike<{ error: any }>) => { const { error } = await p; onErr(error?.message ?? ''); reload() }
  return <div className="bg-coal rounded-xl p-4 space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><div><p className="font-bold">#{r.order_no} · {r.brand_model}</p><p className="text-mute text-sm">{r.customers?.name} {r.customers?.phone && `· ${r.customers.phone}`} — {r.issue}</p></div>
      <select className="inp !w-auto" value={r.status} onChange={async e => { const s = e.target.value; await run(sb.from('repairs').update({ status: s, ...(s === 'delivered' ? { delivered_at: new Date().toISOString() } : {}) }).eq('id', r.id)); await sb.from('repair_history').insert({ repair_id: r.id, status: s }) }}>{ST.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    <div className="grid sm:grid-cols-3 gap-2">{[['labor', 'Mano de obra'], ['parts_charge', 'Repuestos'], ['other_charges', 'Otros cargos'], ['discount', 'Descuento']].map(([k, l]) => <input key={k} className="inp" type="number" placeholder={l} value={b[k]} onChange={e => setB({ ...b, [k]: e.target.value })} />)}<input className="inp" type="number" placeholder="Seña" value={d} onChange={e => setD(e.target.value)} /><input className="inp" placeholder="Diagnóstico" value={dg} onChange={e => setDg(e.target.value)} /></div>
    <div className="flex flex-wrap gap-2"><button className="btn btn-s !py-1 text-sm" onClick={() => run(sb.from('repairs').update({ quote: tot || null, labor: n(b.labor), parts_charge: n(b.parts_charge), other_charges: n(b.other_charges), discount: n(b.discount), deposit: Number(d) || 0, diagnosis: dg }).eq('id', r.id))}>Guardar</button>
      <a className="btn btn-s !py-1 text-sm" href={link} target="_blank">Avisar por WhatsApp</a></div>
    <div className="flex flex-wrap gap-2 items-center"><select className="inp !w-auto" value={pid} onChange={e => setPid(e.target.value)}><option value="">Repuesto del inventario…</option>{prods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select>
      <input className="inp !w-16" type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} /><button disabled={!pid} className="btn btn-s !py-1 text-sm disabled:opacity-40" onClick={() => run(sb.rpc('use_repair_part', { rid: r.id, pid, q: Number(qty) }))}>Usar repuesto</button></div>
    <div className="flex flex-wrap gap-2 items-center text-sm"><span>Total {tot.toLocaleString('es-AR')} · Cobrado {paid.toLocaleString('es-AR')} · <b className="text-brand">Saldo {(tot - paid).toLocaleString('es-AR')}</b></span>
      <select className="inp !w-auto" value={r.quote_status} onChange={e => run(sb.from('repairs').update({ quote_status: e.target.value }).eq('id', r.id))}><option value="pending">Presupuesto pendiente</option><option value="accepted">Aceptado</option><option value="rejected">Rechazado</option></select>
      <input className="inp !w-24" type="number" placeholder="Cobro" value={pm} onChange={e => setPm(e.target.value)} /><select className="inp !w-auto" value={pmeth} onChange={e => setPmeth(e.target.value)}>{['efectivo', 'transferencia', 'debito', 'credito', 'mercadopago'].map(m => <option key={m}>{m}</option>)}</select>
      <button disabled={n(pm) <= 0} className="btn btn-s !py-1 text-sm disabled:opacity-40" onClick={async () => { await run(sb.from('repair_payments').insert({ repair_id: r.id, amount: n(pm), method: pmeth })); setPm('') }}>Registrar cobro</button></div>
    {r.repair_parts?.length > 0 && <p className="text-mute text-sm">Repuestos: {r.repair_parts.map((p: any) => `${p.qty}× ${p.products?.name}`).join(', ')}</p>}</div>
}
export default function Repairs() {
  const [rows, setRows] = useState<any[]>([]), [prods, setProds] = useState<any[]>([]), [f, setF] = useState({ name: '', phone: '', device: 'Celular', brand_model: '', issue: '' }), [msg, setMsg] = useState('')
  const load = async () => {
    const [a, b] = await Promise.all([sb.from('repairs').select('id,order_no,track_token,device,brand_model,issue,status,quote,deposit,diagnosis,labor,parts_charge,other_charges,discount,quote_status,repair_payments(amount),customers(name,phone),repair_parts(qty,products(name))').order('created_at', { ascending: false }), sb.from('products').select('id,name,stock').is('deleted_at', null).gt('stock', 0)])
    setRows(a.data ?? []); setProds(b.data ?? [])
  }
  useEffect(() => { load() }, [])
  async function add(e: React.FormEvent) {
    e.preventDefault()
    const c = await sb.from('customers').insert({ name: f.name, phone: f.phone }).select('id').single(); if (c.error) return setMsg(c.error.message)
    const r = await sb.from('repairs').insert({ customer_id: c.data.id, device: f.device, brand_model: f.brand_model, issue: f.issue }).select('id').single(); if (r.error) return setMsg(r.error.message)
    await sb.from('repair_history').insert({ repair_id: r.data.id, status: 'received' }); setF({ ...f, name: '', phone: '', brand_model: '', issue: '' }); setMsg(''); load()
  }
  const k = (n: keyof typeof f, ph: string) => <input className="inp" placeholder={ph} value={f[n]} onChange={e => setF({ ...f, [n]: e.target.value })} required={n !== 'phone'} />
  return <main className="p-6 max-w-4xl space-y-4"><h1 className="text-2xl font-bold">Reparaciones</h1>
    <form onSubmit={add} className="bg-coal rounded-xl p-4 grid sm:grid-cols-2 gap-3">{k('name', 'Cliente')}{k('phone', 'Teléfono (con código de país)')}{k('device', 'Tipo de dispositivo')}{k('brand_model', 'Marca y modelo')}
      <div className="sm:col-span-2">{k('issue', 'Problema informado')}</div><button className="btn btn-p sm:col-span-2">Registrar ingreso</button></form>
    {msg && <p className="text-red-400">{msg}</p>}{rows.map(r => <Card key={r.id} r={r} prods={prods} reload={load} onErr={setMsg} />)}
    {!rows.length && <p className="text-mute">Todavía no hay reparaciones registradas.</p>}</main>
}
