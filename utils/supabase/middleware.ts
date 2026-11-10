import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest){
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies:{
                getAll(){
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet){
                    cookiesToSet.forEach(({name,value})=> request.cookies.set(name,value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({name,value, options})=>
                    supabaseResponse.cookies.set(name, value, options))
                },
            },
        }
    )

    const {data:{user}} = await supabase.auth.getUser()

    if (request.nextUrl.pathname.startsWith('/admin') &&
        !request.nextUrl.pathname.startsWith('/admin/login')
    ){
        // No basta con tener sesión: solo entra quien tenga el rol "admin" en app_metadata
        // (lo asigna supabase/migrations/20261107_admin_role_rls.sql; el usuario no puede cambiárselo)
        if(!user || user.app_metadata?.role !== 'admin'){
            const url = request.nextUrl.clone()
            url.pathname = '/admin/login'
            if (user) url.searchParams.set('error', 'no-admin')
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}