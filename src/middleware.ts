import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route configuration constants
 * 
 * Define protected and public routes for cleaner route management
 */
const ROUTE_CONFIG = {
  /**
   * Routes that require authentication
   * Users will be redirected to login if not authenticated
   */
  PROTECTED_ROUTES: {
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    ACCOUNT: '/account',
  },

  /**
   * Routes accessible only to non-authenticated users
   * Authenticated users will be redirected to dashboard
   */
  AUTH_ROUTES: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  /**
   * Default redirect destinations
   */
  REDIRECTS: {
    /** Redirect destination after successful login */
    AFTER_LOGIN: '/dashboard',
    /** Redirect destination when accessing protected routes without auth */
    UNAUTHORIZED: '/login',
  },
};

/**
 * Helper to determine if the current path is in a list of protected paths
 */
function isProtectedRoute(pathname: string): boolean {
  return Object.values(ROUTE_CONFIG.PROTECTED_ROUTES).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Helper to determine if the current path is an auth-only path
 */
function isAuthRoute(pathname: string): boolean {
  return Object.values(ROUTE_CONFIG.AUTH_ROUTES).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Extract token from request cookies
 * Returns null if no valid token is found
 */
function getAuthToken(request: NextRequest): string | null {
  try {
    const tokenCookie = request.cookies.get('auth_token');
    if (!tokenCookie) return null;

    // Optional: Validate token structure/expiry if needed
    // This would depend on how your tokens are structured
    return tokenCookie.value;
  } catch (error) {
    console.error('Error extracting auth token:', error);
    return null;
  }
}

/**
 * Next.js Middleware
 * 
 * Handles authentication and route protection across the application
 * 
 * @param request - Incoming request object
 * @returns NextResponse object with appropriate redirects or the original request
 */
export function middleware(request: NextRequest): NextResponse {
  try {
    const { pathname, search } = request.nextUrl;
    const token = getAuthToken(request);
    const isAuthenticated = !!token;

    // Case 1: Auth routes should not be accessible if already authenticated
    if (isAuthRoute(pathname) && isAuthenticated) {
      // Get the intended destination from query params or use default
      const destination = 
        new URL(ROUTE_CONFIG.REDIRECTS.AFTER_LOGIN, request.url).toString();
      
      return NextResponse.redirect(destination);
    }

    // Case 2: Protected routes require authentication
    if (isProtectedRoute(pathname) && !isAuthenticated) {
      // Create login URL with the current path as the "from" parameter
      // This allows redirecting back after login
      const loginUrl = new URL(ROUTE_CONFIG.REDIRECTS.UNAUTHORIZED, request.url);
      loginUrl.searchParams.set('from', pathname + search);
      
      return NextResponse.redirect(loginUrl);
    }

    // Default: Allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    // Log any unexpected errors but don't block the request
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

/**
 * Middleware matcher configuration
 * 
 * Defines which paths this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes (/api/*)
     * - Static files (_next/static/*, _next/image/*)
     * - Favicon and public assets (favicon.ico, /public/*)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 