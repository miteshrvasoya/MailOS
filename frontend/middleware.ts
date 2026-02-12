import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")

  // If trying to access dashboard and not logged in, redirect to login
  if (isDashboardPage && !isLoggedIn) {
     return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // If accessing launching-soon but logged in, redirect to dashboard
  if (req.nextUrl.pathname === "/launching-soon" && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/launching-soon"],
}
