import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
]);
 // protected route will handle all protected routes
export default clerkMiddleware((auth, req) => {
  // redirect case-insensitive `/Dashboard` to lowercase so the route exists
  const { pathname, search } = req.nextUrl;
  if (pathname.toLowerCase() === "/dashboard" && pathname !== "/dashboard") {
    const url = new URL(req.nextUrl);
    url.pathname = "/dashboard";
    url.search = search;
    return NextResponse.redirect(url);
  }

  // Dashboard is accessible but we handle feature
  // gating (chatbot) inside the component itself
  // So we don't hard redirect here — we let everyone in
  // but lock features inside based on auth state
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};