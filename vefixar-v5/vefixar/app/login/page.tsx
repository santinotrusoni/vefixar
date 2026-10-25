'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
export default function Login() {
  const [email, setE] = useState(''), [pw, setP] = useState(''), [err, setErr] = useState('')
  async function go(e: React.FormEvent) {
    e.preventDefault()
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { error } = await sb.auth.signInWithPassword({ email, password: pw })
    if (error) setErr('Credenciales inválidas'); else location.href = '/admin'
  }
  return <main className="min-h-screen grid place-items-center p-4"><form onSubmit={go} className="bg-coal p-8 rounded-xl w-full max-w-sm space-y-4">
    <h1 className="text-2xl font-bold">Panel <span className="text-brand">VEFIXAR</span></h1>
    <input className="w-full bg-ink2 p-3 rounded-lg" type="email" placeholder="Email" value={email} onChange={e => setE(e.target.value)} required />
    <input className="w-full bg-ink2 p-3 rounded-lg" type="password" placeholder="Contraseña" value={pw} onChange={e => setP(e.target.value)} required />
    {err && <p className="text-red-400 text-sm">{err}</p>}
    <button className="btn btn-p w-full">Ingresar</button></form></main>
}
