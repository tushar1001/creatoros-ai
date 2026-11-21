import { NextResponse, type NextRequest } from "next/server";

/**
 * Public storefront URLs: /store/{slug}
 * Rewritten internally to the single root page, which detects the
 * ?store= param (set below) and renders the public storefront view.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = pathname.match(/^\/store\/([a-z0-9-]+)/i);
  if (match) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("store", match[1]);
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/store/:path*"],
};
