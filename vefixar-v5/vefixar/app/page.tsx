import { publicClient } from '@/lib/server'
import ContactForm from './ContactForm'
export const revalidate = 60
const ars = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
export default async function Home() {
  const sb = publicClient()
  const [{ data: s }, { data: services }, { data: products }] = await Promise.all([
    sb.from('settings').select('*').eq('id', 1).single(),
    sb.from('services_public').select('*').order('sort'),
    sb.from('products_public').select('*').gt('stock', 0).order('created_at', { ascending: false })])
  const wa = s?.whatsapp ? (m: string) => `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(m)}` : null
  const rate = Number(s?.usd_rate) || 0, rnd = s?.rounding || 1
  const plans: number[][] = (s?.financing_plans ?? '').split(';').map((x: string) => x.split(':').map(Number)).filter((a: number[]) => a[0] > 0)
  const fin = plans.length > 0 && (!s?.financing_until || new Date(s.financing_until + 'T23:59:59') >= new Date())
  const label: Record<string, string> = { new: 'Nuevo', used: 'Seminuevo', outlet: 'Outlet' }
  return <main>
    <section className="min-h-[85vh] grid place-items-center text-center px-4 bg-ink">
      <div className="max-w-3xl"><img src="/logo.png" alt="VEFIXAR - Líderes en reparación" className="w-40 h-40 rounded-full mx-auto mb-6" />
        <h1 className="text-5xl md:text-7xl font-extrabold">LÍDERES EN <span className="text-brand">REPARACIÓN</span></h1>
        <p className="text-mute mt-6 text-lg">Soluciones técnicas para tus dispositivos. Precisión, confianza y tecnología en cada reparación.</p>
        {s?.experience && <p className="mt-4 text-brand font-semibold">{s.experience}</p>}<div className="flex gap-3 justify-center mt-8 flex-wrap">
          <a href={wa ? wa('Hola, quiero solicitar una reparación') : '#contacto'} className="btn btn-p">Solicitar reparación</a>
          <a href={wa ? wa('Hola, quiero hacer una consulta') : '#contacto'} className="btn btn-s">Consultar por WhatsApp</a></div></div></section>
    <section className="bg-ink2 py-16 px-4"><div className="max-w-5xl mx-auto"><h2 className="text-3xl font-bold mb-8">Servicios técnicos</h2>
      {!services?.length ? <p className="text-mute">Próximamente.</p> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{services.map(v => <div key={v.id} className="bg-coal rounded-xl p-5">
          <h3 className="font-bold text-lg">{v.name}</h3><p className="text-mute text-sm mt-2">{v.description}</p>
          {v.eta && <p className="text-sm mt-2">Tiempo estimado: {v.eta}</p>}
          <p className="text-brand font-semibold mt-2">{v.price_hint ? `Desde ${ars(Number(v.price_hint))}` : 'Consultar presupuesto'}</p>
          {wa && <a className="btn btn-s mt-3 text-sm" href={wa(`Hola, consulto por: ${v.name}`)}>Consultar</a>}</div>)}</div>}</div></section>
    <section className="bg-ink py-16 px-4"><div className="max-w-5xl mx-auto"><h2 className="text-3xl font-bold mb-2">Equipos y accesorios</h2>
      {rate > 0 && <p className="text-mute text-sm mb-8">Cotización: 1 USD = {ars(rate)}{s?.usd_rate_updated && ` · actualizada ${new Date(s.usd_rate_updated).toLocaleDateString('es-AR')}`}</p>}
      {!products?.length ? <p className="text-mute">Sin productos publicados.</p> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{products.map(p => {
          const usd = p.currency === 'USD' ? Number(p.price) : null
          const pesos = p.price_ars_manual ? Number(p.price_ars_manual) : usd && rate ? Math.round(usd * rate / rnd) * rnd : p.currency === 'ARS' ? Number(p.price) : null
          return <div key={p.id} className="bg-coal rounded-xl p-5">
            {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="rounded-lg mb-3 w-full aspect-square object-cover" />}
            {p.condition && <span className="bg-brand text-ink text-xs font-bold px-2 py-1 rounded">{label[p.condition]}</span>}
            <h3 className="font-bold mt-2">{p.name}</h3><p className="text-mute text-sm">{[p.storage, p.color].filter(Boolean).join(' · ')}</p>
            {usd && <p className="text-brand text-2xl font-bold mt-2">USD {usd.toLocaleString('es-AR')}</p>}
            {pesos && <p className="text-sm">{ars(pesos)}</p>}
            {fin && p.financing && pesos && <p className="text-xs text-mute mt-1">{plans.map(([c, r]) => `${c} cuotas de ${ars(Math.round(pesos * (1 + (r || 0) / 100) / c))}`).join(' · ')}{s?.financing_entity ? ` (${s.financing_entity})` : ''}</p>}
            {wa && <a className="btn btn-p mt-3 text-sm" href={wa(`Hola, consulto por ${p.name}${usd ? ` (USD ${usd})` : ''}`)}>Consultar por WhatsApp</a>}</div>})}</div>}</div></section>
    <section className="bg-ink py-16 px-4"><h2 className="text-3xl font-bold mb-8 text-center">Consultanos</h2><ContactForm /></section>
    <footer id="contacto" className="bg-ink2 py-12 px-4 text-center text-mute"><p className="text-white font-bold">{s?.business_name}</p>
      {s?.address && <p>{s.address}</p>}{s?.hours && <p>{s.hours}</p>}{s?.phone && <p>{s.phone}</p>}{s?.instagram && <a className="text-brand" href={s.instagram}>Instagram @vefixar</a>}</footer></main>
}
