import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes
const protectedPaths = ['/dashboard', '/profile', '/groups']

export function middleware(req: NextRequest) {
  const isProtected = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  const token = req.cookies.get('token')?.value

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

// ✅ Define matcher here instead of next.config.ts
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/groups/:path*'],
}
