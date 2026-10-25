import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sessionClient } from '@/lib/server'
export async function POST(req: Request) {
  const s = sessionClient(); const { data: { user } } = await s.auth.getUser()
  const me = user && (await s.from('profiles').select('role').eq('id', user.id).single()).data
  if (me?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { email, password, full_name, role } = await req.json()
  if (!/^\S+@\S+\.\S+$/.test(email) || String(password).length < 8 || !['admin', 'employee'].includes(role)) return NextResponse.json({ error: 'Datos inválidos (contraseña mínima 8)' }, { status: 400 })
  const adm = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await adm.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await adm.from('profiles').insert({ id: data.user.id, full_name, role, email })
  return NextResponse.json({ ok: true })
}
