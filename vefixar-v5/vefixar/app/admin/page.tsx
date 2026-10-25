import { sessionClient } from '@/lib/server'
export const dynamic = 'force-dynamic'
export default async function Admin() {
  const sb = sessionClient()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [rep, low, sales] = await Promise.all([
    sb.from('repairs').select('id', { count: 'exact', head: true }).not('status', 'in', '(delivered,cancelled,unrepairable)'),
    sb.from('products').select('id,stock,min_stock').is('deleted_at', null),
    sb.from('sales').select('total').eq('status', 'completed').gte('created_at', today.toISOString())])
  const lowN = (low.data ?? []).filter(p => p.stock <= p.min_stock).length
  const tot = (sales.data ?? []).reduce((a, s) => a + Number(s.total), 0)
  const cards = [['Ventas de hoy', tot.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })], ['Reparaciones pendientes', rep.count ?? 0], ['Productos con bajo stock', lowN]]
  return <main className="p-6 max-w-5xl mx-auto"><h1 className="text-2xl font-bold mb-6">Dashboard</h1>
    <div className="grid sm:grid-cols-3 gap-4">{cards.map(([t, v]) => <div key={String(t)} className="bg-coal rounded-xl p-5"><p className="text-mute text-sm">{t}</p><p className="text-3xl font-bold mt-2">{v}</p></div>)}</div></main>
}
