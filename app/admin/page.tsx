import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Extraemos todos los productos ordenados por fecha de creación (los más nuevos primero)
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

    const count = products?.length || 0

    return (
        <main className="min-h-screen bg-gray-50 p-10">
        <div className="max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-light text-gray-900">Panel Administrativo</h1>
                <p className="text-gray-500 mt-1">
                Autenticado como: <span className="font-medium">{user?.email}</span>
                </p>
            </div>
            <LogoutButton /> 
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Productos en Catálogo
                </h2>
                <p className="text-4xl font-light text-black">
                {count}
                </p>
            </div>
            </div>

            {/* NUEVA SECCIÓN: INVENTARIO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-medium text-gray-800">Inventario de Joyas</h2>
                <Link 
                href="/admin/new"
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                + Nuevo Producto
                </Link>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Producto</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Slug</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Grabado</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Estado</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products?.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No hay productos registrados aún.
                        </td>
                    </tr>
                    ) : (
                    products?.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{product.title}</td>
                        <td className="px-6 py-4">{product.slug}</td>
                        <td className="px-6 py-4">{product.allow_engraving ? 'Permitido' : 'No'}</td>
                        <td className="px-6 py-4">
                            {/* Clases dinámicas de Tailwind según el estado */}
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {product.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <Link href={`/admin/edit/${product.slug}`}
                            className='text-blue-500 hover:text-blue-800 font-medium text-sm'
                            >
                                Editar
                            </Link>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </div>
        </div>
        </main>
    )
    }