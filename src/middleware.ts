import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'de'];
const defaultLocale = 'en';

// Static file extensions to bypass locale routing
const staticFileExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.css', '.js', '.json', '.woff', '.woff2', '.ttf', '.eot'];

function getLocale(request: NextRequest) {
  const headers = new Headers(request.headers);
  const acceptLanguage = headers.get('accept-language') || '';
  headers.set('accept-language', acceptLanguage);
  
  const negotiator = new Negotiator({ headers: Object.fromEntries(headers) });
  const languages = negotiator.languages();
  
  return match(languages, locales, defaultLocale);
}

function isStaticResource(pathname: string): boolean {
  // Skip middleware for any file in public directory with extensions
  if (staticFileExtensions.some(ext => pathname.endsWith(ext))) {
    return true;
  }
  
  // Skip middleware for any path that looks like a file (has a dot)
  if (pathname.includes('.') && !pathname.endsWith('/')) {
    return true;
  }
  
  // Skip for known path patterns
  return (
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    // Specific font patterns
    pathname === '/InterVariable.woff2' ||
    pathname === '/InterVariable-Italic.woff2' ||
    pathname === '/Inter' ||
    pathname.startsWith('/Inter/') ||
    pathname.startsWith('/fonts/')
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Log the pathname for debugging
  console.log('Middleware processing:', pathname);
  
  // Skip locale routing for static resources
  if (isStaticResource(pathname)) {
    console.log('Skipping middleware for static resource:', pathname);
    return NextResponse.next();
  }
  
  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameHasLocale) return;
  
  // Redirect if there is no locale in the pathname
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  console.log('Redirecting to:', request.nextUrl.pathname);
  return NextResponse.redirect(request.nextUrl);
}

// Fix the matcher configuration to avoid capturing groups
export const config = {
  matcher: [
    // Match all paths except static files, _next, and API routes
    '/((?!_next|api|favicon.ico).*)',
  ],
};