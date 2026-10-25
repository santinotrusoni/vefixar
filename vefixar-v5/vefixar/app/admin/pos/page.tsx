'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
type P = { id: string; name: string; sku: string | null; barcode: string | null; price: number; currency: string; price_ars_manual: number | null; stock: number }
const M = ['efectivo', 'transferencia', 'debito', 'credito', 'mercadopago']
export default function POS() {
  const [prods, setProds] = useState<P[]>([]), [rate, setRate] = useState(0), [q, setQ] = useState(''), [cart, setCart] = useState<Record<string, number>>({}), [pay, setPay] = useState<Record<string, string>>({}), [msg, setMsg] = useState('')
  const load = async () => {
    const [a, b] = await Promise.all([sb.from('products').select('id,name,sku,barcode,price,currency,price_ars_manual,stock').is('deleted_at', null).gt('stock', 0), sb.from('settings').select('usd_rate').eq('id', 1).single()])
    setProds((a.data as P[]) ?? []); setRate(Number(b.data?.usd_rate) || 0)
  }
  useEffect(() => { load() }, [])
  const unit = (p: P) => p.price_ars_manual ? Number(p.price_ars_manual) : p.currency === 'USD' ? Math.round(Number(p.price) * rate) : Number(p.price)
  const items = Object.entries(cart).map(([id, qty]) => ({ p: prods.find(x => x.id === id)!, qty })).filter(i => i.p)
  const total = items.reduce((a, i) => a + unit(i.p) * i.qty, 0)
  const paid = M.reduce((a, m) => a + (Number(pay[m]) || 0), 0)
  const found = q ? prods.filter(p => [p.name, p.sku, p.barcode].some(v => v?.toLowerCase().includes(q.toLowerCase()))).slice(0, 8) : []
  async function confirm() {
    if (!items.length) return setMsg('Carrito vacío')
    if (paid !== total) return setMsg('Los pagos no suman el total')
    const { error } = await sb.rpc('create_sale', { items: items.map(i => ({ product_id: i.p.id, qty: i.qty, unit_price: unit(i.p) })), payments: M.filter(m => Number(pay[m]) > 0).map(m => ({ method: m, amount: Number(pay[m]) })) })
    if (error) return setMsg(error.message)
    setCart({}); setPay({}); setQ(''); setMsg('Venta registrada'); load()
  }
  const f = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
  return <main className="p-6 max-w-3xl space-y-4"><h1 className="text-2xl font-bold">Venta de mostrador</h1>
    <input className="inp" placeholder="Buscar por nombre, SKU o código de barras" value={q} onChange={e => setQ(e.target.value)} />
    {found.map(p => <button key={p.id} disabled={!unit(p)} onClick={() => { setCart({ ...cart, [p.id]: Math.min((cart[p.id] || 0) + 1, p.stock) }); setQ('') }} className="flex justify-between w-full bg-coal p-3 rounded-lg disabled:opacity-40"><span>{p.name} <span className="text-mute">(stock {p.stock})</span></span><span className="text-brand">{unit(p) ? f(unit(p)) : 'Falta cotización'}</span></button>)}
    <div className="bg-coal rounded-xl p-4 space-y-2">{items.map(i => <div key={i.p.id} className="flex justify-between items-center"><span>{i.p.name}</span>
      <span className="flex gap-2 items-center"><input type="number" min={1} max={i.p.stock} className="inp !w-16" value={i.qty} onChange={e => setCart({ ...cart, [i.p.id]: Math.max(1, Math.min(i.p.stock, Number(e.target.value))) })} />{f(unit(i.p) * i.qty)}
        <button onClick={() => { const c = { ...cart }; delete c[i.p.id]; setCart(c) }} className="text-red-400">✕</button></span></div>)}
      <p className="text-xl font-bold pt-2">Total: <span className="text-brand">{f(total)}</span></p></div>
    <div className="bg-coal rounded-xl p-4 grid grid-cols-2 gap-3">{M.map(m => <label key={m} className="text-sm text-mute capitalize">{m}<input type="number" className="inp" value={pay[m] ?? ''} onChange={e => setPay({ ...pay, [m]: e.target.value })} /></label>)}
      <p className="col-span-2 text-sm">Pagado: {f(paid)} · Diferencia: {f(total - paid)}</p></div>
    {msg && <p className="text-brand">{msg}</p>}<button onClick={confirm} className="btn btn-p w-full">Confirmar venta</button></main>
}
