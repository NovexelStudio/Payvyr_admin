import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  const { pathname } = request.nextUrl

  // 1. Allow system files, images, and the login page
  if (
    pathname === '/login' || 
    pathname.startsWith('/_next') || 
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  // 2. If NO session, force user to Login Page
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. If ALREADY logged in and trying to go back to Login, send to Dashboard
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}