'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
const E = { kind: 'iphone', name: '', sku: '', condition: 'new', storage: '', color: '', price: '', currency: 'USD', cost_price: '', stock: '1', min_stock: '0', published: true, financing: false }
export default function Products() {
  const [rows, setRows] = useState<any[]>([]), [f, setF] = useState<any>(E), [file, setFile] = useState<File | null>(null), [msg, setMsg] = useState(''), [edId, setEd] = useState<string | null>(null)
  const load = async () => { const { data } = await sb.from('products').select('*').is('deleted_at', null).order('created_at', { ascending: false }); setRows(data ?? []) }
  useEffect(() => { load() }, [])
  async function add(e: React.FormEvent) {
    e.preventDefault(); let images: string[] = []
    if (file) { const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, '_')}`; const u = await sb.storage.from('products').upload(path, file); if (u.error) return setMsg(u.error.message); images = [sb.storage.from('products').getPublicUrl(path).data.publicUrl] }
    const n = (v: string) => (v === '' ? null : Number(v))
    const { error } = await sb.from('products').upsert({ ...(edId ? { id: edId } : {}), ...f, sku: f.sku || null, condition: f.kind === 'iphone' ? f.condition : null, storage: f.storage || null, color: f.color || null, price: Number(f.price), cost_price: n(f.cost_price), stock: Number(f.stock), min_stock: Number(f.min_stock), ...(images.length || !edId ? { images } : {}) })
    if (error) return setMsg(error.message)
    setF(E); setFile(null); setEd(null); setMsg(''); load()
  }
  const i = (n: string, ph: string, t = 'text') => <input className="inp" type={t} placeholder={ph} value={f[n]} onChange={e => setF({ ...f, [n]: e.target.value })} />
  const s = (n: string, o: string[][]) => <select className="inp" value={f[n]} onChange={e => setF({ ...f, [n]: e.target.value })}>{o.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
  return <main className="p-6 max-w-4xl space-y-4"><h1 className="text-2xl font-bold">Productos</h1>
    <form onSubmit={add} className="bg-coal rounded-xl p-4 grid sm:grid-cols-3 gap-3">
      {s('kind', [['iphone', 'iPhone'], ['accessory', 'Accesorio'], ['other', 'Otro']])}{i('name', 'Nombre')}{i('sku', 'SKU')}
      {f.kind === 'iphone' && s('condition', [['new', 'Nuevo'], ['used', 'Seminuevo'], ['outlet', 'Outlet']])}{i('storage', 'Capacidad')}{i('color', 'Color')}
      {i('price', 'Precio venta', 'number')}{s('currency', [['USD', 'USD'], ['ARS', 'ARS']])}{i('cost_price', 'Costo (privado)', 'number')}{i('stock', 'Stock', 'number')}{i('min_stock', 'Stock mínimo', 'number')}
      <input type="file" accept="image/*" className="inp" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={f.published} onChange={e => setF({ ...f, published: e.target.checked })} />Publicar en la web</label>
      <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={f.financing} onChange={e => setF({ ...f, financing: e.target.checked })} />Mostrar cuotas</label>
      <button className="btn btn-p sm:col-span-3">{edId ? 'Actualizar' : 'Guardar'} producto</button></form>
    {msg && <p className="text-red-400">{msg}</p>}
    {rows.map(r => <div key={r.id} className="bg-coal rounded-xl p-4 flex justify-between items-center gap-2"><div><p className="font-bold">{r.name} <span className="text-mute text-sm">{[r.storage, r.color].filter(Boolean).join(' · ')}</span></p><p className="text-sm text-mute">{r.currency} {r.price} · stock {r.stock}</p></div>
      <span className="flex gap-2"><button className="btn btn-s !py-1 text-sm" onClick={() => { setEd(r.id); setF({ ...E, ...Object.fromEntries(Object.entries(r).filter(([k]) => k in E).map(([k, v]) => [k, v ?? ''])) }); scrollTo(0, 0) }}>Editar</button><button className="btn btn-s !py-1 text-sm" onClick={async () => { await sb.from('products').update({ published: !r.published }).eq('id', r.id); load() }}>{r.published ? 'Ocultar' : 'Publicar'}</button>
        <button className="text-red-400 text-sm" onClick={async () => { if (confirm('¿Eliminar?')) { await sb.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', r.id); load() } }}>Eliminar</button></span></div>)}</main>
}
