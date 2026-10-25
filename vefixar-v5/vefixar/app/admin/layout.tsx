import Link from 'next/link'
const nav = [['/admin', 'Dashboard'], ['/admin/pos', 'Ventas'], ['/admin/repairs', 'Reparaciones'], ['/admin/products', 'Productos'], ['/admin/sales', 'Historial'], ['/admin/cash', 'Caja'], ['/admin/finance', 'Finanzas'], ['/admin/inquiries', 'Consultas'], ['/admin/config', 'Configuración'], ['/admin/users', 'Usuarios']]
export default function L({ children }: { children: React.ReactNode }) {
  return <div className="md:flex min-h-screen"><aside className="bg-ink2 md:w-56 p-4 flex md:block gap-2 overflow-x-auto items-center">
    <img src="/logo.png" alt="VEFIXAR" className="w-16 h-16 rounded-full md:mb-6 shrink-0" />
    {nav.map(([h, n]) => <Link key={h} href={h} className="block px-3 py-2 rounded-lg hover:bg-brand/10 hover:text-brand whitespace-nowrap">{n}</Link>)}</aside>
    <div className="flex-1">{children}</div></div>
}
