// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow the gate page itself
  if (pathname === "/articles") return NextResponse.next();

  // Protect only article detail routes like /articles/slug
  if (pathname.startsWith("/articles/")) {
    const cookie = req.cookies.get("fff_granted");
    if (!cookie || cookie.value !== "1") {
      const url = new URL("/articles", req.url); // send them to the gate
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Limit middleware to the articles subtree
export const config = {
  matcher: ["/articles/:path*"],
};
