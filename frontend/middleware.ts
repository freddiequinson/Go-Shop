import { NextRequest, NextResponse } from 'next/server'

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block CVE-2025-29927: Next.js middleware bypass via x-middleware-subrequest header
  if (request.headers.get('x-middleware-subrequest')) {
    return new NextResponse(null, { status: 403 })
  }

  // SECURITY: block Next.js 16 experimental MCP server endpoints (RCE vector)
  // Attackers probe /.well-known/mcp, /_next/mcp, and send x-nextjs-mcp-* headers
  if (
    pathname.startsWith('/.well-known/mcp') ||
    pathname.startsWith('/_next/mcp') ||
    pathname.includes('/mcp/') ||
    request.headers.get('x-nextjs-mcp') ||
    request.headers.get('x-mcp-session')
  ) {
    return new NextResponse(null, { status: 404 })
  }

  // Apply security headers to all responses
  const response = NextResponse.next()
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Admin path protection: require access_token cookie
  // NOTE: Customer pages (/cart, /orders, /checkout etc.) are intentionally NOT protected
  // here — they self-protect via client-side useAuth() and the backend API enforces auth.
  // Protecting them here would break existing sessions that pre-date the cookie.
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|launch-assets|public).*)',
  ],
}
