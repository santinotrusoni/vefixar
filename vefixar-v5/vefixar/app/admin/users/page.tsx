'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
export default function Users() {
  const [rows, setRows] = useState<any[]>([]), [f, setF] = useState({ email: '', password: '', full_name: '', role: 'employee' }), [msg, setMsg] = useState('')
  const load = async () => { const { data } = await sb.from('profiles').select('*'); setRows(data ?? []) }
  useEffect(() => { load() }, [])
  async function add(e: React.FormEvent) {
    e.preventDefault(); const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); const j = await r.json()
    if (!r.ok) return setMsg(j.error); setF({ email: '', password: '', full_name: '', role: 'employee' }); setMsg(''); load()
  }
  return <main className="p-6 max-w-3xl space-y-4"><h1 className="text-2xl font-bold">Usuarios</h1>
    <form onSubmit={add} className="bg-coal rounded-xl p-4 grid sm:grid-cols-2 gap-2"><input className="inp" placeholder="Nombre" value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} required /><input className="inp" type="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required />
      <input className="inp" type="password" placeholder="Contraseña (mín. 8)" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required /><select className="inp" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="employee">Empleado</option><option value="admin">Administrador</option></select>
      <button className="btn btn-p sm:col-span-2">Crear usuario</button></form>{msg && <p className="text-red-400">{msg}</p>}
    {rows.map(r => <div key={r.id} className="bg-coal rounded-xl p-3 flex justify-between items-center"><span>{r.full_name} <span className="text-mute text-sm">{r.email}</span></span>
      <select className="inp !w-auto" value={r.role} onChange={async e => { if (confirm('¿Cambiar el rol?')) { await sb.from('profiles').update({ role: e.target.value }).eq('id', r.id); load() } }}><option value="employee">Empleado</option><option value="admin">Administrador</option></select></div>)}</main>
}
