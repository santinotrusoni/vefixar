'use client'
import { useState } from 'react'
import { sb } from '@/lib/browser'
export default function ContactForm() {
  const [kind, setKind] = useState<'consulta' | 'canje'>('consulta'), [f, setF] = useState<Record<string, string>>({}), [msg, setMsg] = useState(''), [done, setDone] = useState(false)
  const i = (n: string, ph: string, req = false) => <input className="inp" placeholder={ph} required={req} value={f[n] ?? ''} onChange={e => setF({ ...f, [n]: e.target.value })} />
  async function send(e: React.FormEvent) {
    e.preventDefault(); if (f.web) return setDone(true)
    const { name, phone, message, web, ...data } = f
    const { error } = await sb.rpc('submit_inquiry', { p_kind: kind, p_name: name, p_phone: phone, p_message: message ?? '', p_data: data })
    if (error) setMsg(error.message); else { setDone(true); setMsg('') }
  }
  if (done) return <div className="max-w-xl mx-auto text-center"><p className="text-brand font-bold">¡Gracias! Recibimos tu consulta y te vamos a contactar.</p></div>
  return <form onSubmit={send} className="max-w-xl mx-auto bg-coal rounded-xl p-6 space-y-3">
    <div className="flex gap-2">{(['consulta', 'canje'] as const).map(k => <button type="button" key={k} onClick={() => setKind(k)} className={`btn !py-2 text-sm ${kind === k ? 'btn-p' : 'btn-s'}`}>{k === 'consulta' ? 'Consulta' : 'Consultar canje'}</button>)}</div>
    {i('name', 'Nombre', true)}{i('phone', 'Teléfono / WhatsApp', true)}
    {kind === 'canje' && <>{i('equipo_entrega', 'Modelo que entregás')}{i('capacidad', 'Capacidad')}{i('estado', 'Estado general')}{i('bateria', 'Estado de batería')}{i('modelo_interes', 'Modelo que te interesa')}<p className="text-mute text-xs">La tasación final la valida el local; esto es solo una consulta.</p></>}
    <textarea className="inp" rows={3} placeholder="Mensaje" value={f.message ?? ''} onChange={e => setF({ ...f, message: e.target.value })} />
    <input tabIndex={-1} autoComplete="off" className="hidden" value={f.web ?? ''} onChange={e => setF({ ...f, web: e.target.value })} />
    {msg && <p className="text-red-400 text-sm">{msg}</p>}<button className="btn btn-p w-full">Enviar</button></form>
}
