import { publicClient } from '@/lib/server'
export const dynamic = 'force-dynamic'
const L: Record<string, string> = { received: 'Recibido', diagnosing: 'En diagnóstico', quoted: 'Presupuestado', awaiting_auth: 'Esperando tu autorización', awaiting_parts: 'Esperando repuestos', repairing: 'En reparación', repaired: 'Reparado', ready: 'Listo para retirar', delivered: 'Entregado', unrepairable: 'Sin reparación', cancelled: 'Cancelado' }
export default async function T({ params }: { params: { token: string } }) {
  const ok = /^[0-9a-f-]{36}$/i.test(params.token)
  const { data } = ok ? await publicClient().rpc('get_repair_status', { tok: params.token }) : { data: null }
  if (!data) return <main className="min-h-screen grid place-items-center"><p className="text-mute">No encontramos esa reparación.</p></main>
  return <main className="min-h-screen grid place-items-center p-4"><div className="bg-coal rounded-xl p-8 w-full max-w-md space-y-3">
    <img src="/logo.png" alt="VEFIXAR" className="w-16 h-16 rounded-full" /><h1 className="text-xl font-bold">Orden #{data.order_no}</h1><p className="text-mute">{data.device}</p>
    <p className="text-2xl font-bold text-brand">{L[data.status] ?? data.status}</p>
    <ul className="text-sm text-mute space-y-1">{data.history.map((h: any, i: number) => <li key={i}>{new Date(h.at).toLocaleString('es-AR')} — {L[h.status] ?? h.status}</li>)}</ul></div></main>
}
