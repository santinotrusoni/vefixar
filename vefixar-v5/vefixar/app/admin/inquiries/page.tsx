'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
export default function Inq() {
  const [rows, setRows] = useState<any[]>([])
  const load = async () => { const { data } = await sb.from('inquiries').select('*').order('created_at', { ascending: false }).limit(100); setRows(data ?? []) }
  useEffect(() => { load() }, [])
  return <main className="p-6 max-w-3xl space-y-3"><h1 className="text-2xl font-bold">Consultas y canjes</h1>
    {rows.map(r => <div key={r.id} className="bg-coal rounded-xl p-4 space-y-1"><div className="flex justify-between"><p className="font-bold">{r.name} <span className="text-brand text-xs uppercase">{r.kind}</span></p><span className="text-mute text-xs">{new Date(r.created_at).toLocaleString('es-AR')}</span></div>
      <p className="text-sm">{r.message}</p>{Object.entries(r.data).map(([k, v]) => <p key={k} className="text-sm text-mute">{k.replace('_', ' ')}: {String(v)}</p>)}
      <div className="flex gap-2 pt-1"><a className="btn btn-s !py-1 text-sm" href={`https://wa.me/${r.phone.replace(/\D/g, '')}`}>WhatsApp</a>
        <button className="btn btn-s !py-1 text-sm" onClick={async () => { await sb.from('inquiries').update({ status: r.status === 'new' ? 'done' : 'new' }).eq('id', r.id); load() }}>{r.status === 'new' ? 'Marcar atendida' : 'Atendida ✓'}</button></div></div>)}
    {!rows.length && <p className="text-mute">Sin consultas.</p>}</main>
}
