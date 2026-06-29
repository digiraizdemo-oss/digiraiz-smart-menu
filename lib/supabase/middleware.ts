import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const SUPER_ADMIN_EMAIL = "sayyedparvez7@gmail.com"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
  const isPublicMenuRoute = request.nextUrl.pathname.startsWith("/menu")

  // Public menu routes are always accessible
  if (isPublicMenuRoute) {
    return supabaseResponse
  }

  // If trying to access admin routes
  if (isAdminRoute) {
    // Not logged in - redirect to login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Logged in but not super admin - redirect to unauthorized
    if (user.email !== SUPER_ADMIN_EMAIL) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/unauthorized"
      return NextResponse.redirect(url)
    }
  }

  // If logged in super admin trying to access auth routes, redirect to admin
  if (isAuthRoute && user && user.email === SUPER_ADMIN_EMAIL) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
