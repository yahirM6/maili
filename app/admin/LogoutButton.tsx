'use client'

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function LogoutButton(){
    
    const router = useRouter()
    const supabase = createClient()
    
    const handleLogout = async () => {
        await supabase.auth.signOut()

        router.refresh()

        router.push('/admin/login')
    }


    return(
        <button 
        onClick={handleLogout}
        className="text-sm font-medium text-gray-500 hover:text-black transition-colors px-4 py-2 border border-transparent hover:border-gray-200 rounded-md"
        >
        Cerrar sesión
        </button>
    )
}