import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that should NOT redirect (publicly accessible)
const publicPaths = ["/login", "/register", "/cgu", "/privacy-policy"];

// Middleware function to check authentication
// This middleware runs on every request to check if the user is authenticated
// and redirects to the login page if not
// It uses the Next.js middleware API to intercept requests and perform checks
// before allowing them to proceed
// It checks if the request is for a public path or if the user is authenticated
// If the user is not authenticated and not on a public path, it redirects to the login page
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isAuth = Boolean(token);

  // Redirect if not authenticated and not on a public path
  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"], // match all routes except special Next.js/internal ones
};
