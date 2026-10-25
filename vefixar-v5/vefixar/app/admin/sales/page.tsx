'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
export default function Sales() {
  const [rows, setRows] = useState<any[]>([]), [msg, setMsg] = useState('')
  const load = async () => { const { data } = await sb.from('sales').select('id,total,status,payments,created_at,sale_items(qty,products(name))').order('created_at', { ascending: false }).limit(50); setRows(data ?? []) }
  useEffect(() => { load() }, [])
  async function voidSale(id: string) { if (!confirm('¿Anular la venta y devolver el stock?')) return; const { error } = await sb.rpc('void_sale', { sid: id }); setMsg(error ? error.message : ''); load() }
  return <main className="p-6 max-w-3xl space-y-3"><h1 className="text-2xl font-bold">Historial de ventas</h1>{msg && <p className="text-red-400">{msg}</p>}
    {rows.map(r => <div key={r.id} className="bg-coal rounded-xl p-4 flex justify-between gap-2"><div><p className="font-bold">{Number(r.total).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })} {r.status !== 'completed' && <span className="text-red-400 text-sm">({r.status === 'voided' ? 'anulada' : 'devuelta'})</span>}</p>
      <p className="text-mute text-sm">{new Date(r.created_at).toLocaleString('es-AR')} · {r.sale_items.map((i: any) => `${i.qty}× ${i.products?.name}`).join(', ')}</p></div>
      {r.status === 'completed' && <button onClick={() => voidSale(r.id)} className="btn btn-s !py-1 text-sm self-center">Anular</button>}</div>)}
    {!rows.length && <p className="text-mute">Todavía no hay ventas.</p>}</main>
}
