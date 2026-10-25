'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/browser'
const F: [string, string][] = [['business_name', 'Nombre comercial'], ['slogan', 'Eslogan'], ['whatsapp', 'WhatsApp (solo dígitos, con código de país)'], ['phone', 'Teléfono'], ['address', 'Dirección'], ['hours', 'Horarios'], ['instagram', 'URL de Instagram'], ['experience', 'Texto de experiencia (vacío = ocultar)'], ['usd_rate', 'Cotización USD → ARS'], ['rounding', 'Redondeo (ej. 1000)'], ['financing_plans', 'Cuotas cantidad:recargo% separadas por ; (ej. 3:10;6:20). Vacío = sin cuotas'], ['financing_entity', 'Entidad / medio de pago'], ['financing_until', 'Vigencia de cuotas (AAAA-MM-DD)']]
export default function Config() {
  const [s, setS] = useState<any>({}), [msg, setMsg] = useState('')
  useEffect(() => { sb.from('settings').select('*').eq('id', 1).single().then(r => setS(r.data ?? {})) }, [])
  async function save(e: React.FormEvent) {
    e.preventDefault(); const old = await sb.from('settings').select('usd_rate').eq('id', 1).single(); const p: any = {}
    F.forEach(([k]) => { p[k] = s[k] === '' || s[k] == null ? null : s[k] }); p.usd_rate = p.usd_rate === null ? null : Number(p.usd_rate); p.rounding = Number(p.rounding) || 1000
    if (Number(old.data?.usd_rate) !== p.usd_rate) p.usd_rate_updated = new Date().toISOString()
    const { error } = await sb.from('settings').update(p).eq('id', 1); setMsg(error ? error.message : 'Guardado')
  }
  return <main className="p-6 max-w-2xl"><h1 className="text-2xl font-bold mb-4">Configuración</h1><form onSubmit={save} className="bg-coal rounded-xl p-4 space-y-3">
    {F.map(([k, l]) => <label key={k} className="block text-sm text-mute">{l}<input className="inp" value={s[k] ?? ''} onChange={e => setS({ ...s, [k]: e.target.value })} /></label>)}
    {msg && <p className="text-brand">{msg}</p>}<button className="btn btn-p w-full">Guardar</button></form></main>
}
