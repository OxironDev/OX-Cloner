import { NextResponse } from "next/server";

const locales = ['tr', 'en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ja', 'ar', 'id'];
const defaultLocale = 'en';

export function proxy(request) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;

  // Exclude API routes, static files, and Next.js internal paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Get locale from cookie if exists
  let locale = defaultLocale;
  const cookieLocale = request.cookies.get('oxiron_lang')?.value;

  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    // Basic accept-language matching
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferredLocales = acceptLanguage.split(',').map(lang => lang.split(';')[0].split('-')[0].trim());

    for (const prefLocale of preferredLocales) {
      if (locales.includes(prefLocale)) {
        locale = prefLocale;
        break;
      }
    }
  }

  // Redirect if there is no locale
  request.nextUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  const response = NextResponse.redirect(request.nextUrl);
  // Optional: Set cookie if it was automatically detected
  if (!cookieLocale) {
    response.cookies.set('oxiron_lang', locale);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
