import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")
  const email = req.auth?.user?.email
  const allowedEmail = "mailos.precizn@gmail.com"

  // 1. If trying to access dashboard and not logged in, redirect to login
  if (isDashboardPage && !isLoggedIn) {
     return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // 2. If trying to access dashboard, logged in, but not allowed email -> redirect to launching soon
  if (isDashboardPage && isLoggedIn && email !== allowedEmail) {
    return NextResponse.redirect(new URL("/launching-soon", req.nextUrl))
  }

  // 3. If accessing launching-soon but IS the allowed user, redirect to dashboard (optional, but good UX)
  if (req.nextUrl.pathname === "/launching-soon" && isLoggedIn && email === allowedEmail) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/launching-soon"],
}
