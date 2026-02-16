import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
]);
const isCandidateRoute = createRouteMatcher([
  "/server",
  "/jobs(.*)",
  "/applications(.*)",
  "/favorites(.*)",
  "/profile(.*)",
]);
const isCompanyRoute = createRouteMatcher(["/company(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  if (isCandidateRoute(req) || isCompanyRoute(req)) {
    await auth.protect();
  }

  if (!isCompanyRoute(req)) return;

  const { orgId, has } = await auth();
  if (!orgId) {
    return NextResponse.redirect(new URL("/pricing?reason=org_required", req.url));
  }

  const hasCompanyRole =
    has({ role: "org:admin" }) ||
    has({ role: "org:recruiter" }) ||
    has({ role: "org:member" });

  if (!hasCompanyRole) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
