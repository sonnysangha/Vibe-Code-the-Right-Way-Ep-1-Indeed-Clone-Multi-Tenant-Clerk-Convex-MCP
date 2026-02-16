import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, BriefcaseBusiness, Building2, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-8 md:py-10">
        <header className="flex items-center justify-between rounded-full border border-slate-200/80 bg-white/85 px-5 py-2.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <BriefcaseBusiness className="size-4" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">Jobly</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hiring made feel-good simple</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex dark:text-slate-300">
            <Link href="/jobs" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Jobs
            </Link>
            <Link href="/company" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Companies
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/">
                <Button variant="ghost" size="sm" className="rounded-full">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/">
                <Button size="sm" className="rounded-full bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  Create account
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200">
              Candidate-first experience
            </Badge>
            <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight md:text-6xl">
              Find jobs you actually want, then apply in minutes.
            </h1>
            <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
              Discover opportunities, save favorites, and track every application in one clean
              workspace. Always free for job seekers.
            </p>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <Search className="size-4" />
                  Search title, company, or skill
                </div>
                <Button asChild className="rounded-xl">
                  <Link href="/jobs" className="gap-2">
                    Explore jobs
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/company">For companies</Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-full text-slate-600 dark:text-slate-300">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="space-y-2">
                <Badge variant="outline" className="w-fit rounded-full">
                  <Sparkles className="mr-1 size-3.5" />
                  Why candidates love it
                </Badge>
                <CardTitle className="text-xl">Simple, calm, and focused</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  No noisy dashboards. Just jobs, applications, and progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>• Smart filters and clean search results</p>
                <p>• Favorites and application history in one place</p>
                <p>• Clear yes/no status updates from companies</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="space-y-2">
                <Badge variant="outline" className="w-fit rounded-full">
                  <Building2 className="mr-1 size-3.5" />
                  For hiring teams
                </Badge>
                <CardTitle className="text-xl">Structured company workspace</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Post roles, review candidates, and scale through organization plans.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300">Free, Starter, Growth</p>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/company/billing">Open plans</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Candidate price</p>
            <p className="mt-1 text-3xl font-semibold">$0</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Company plans</p>
            <p className="mt-1 text-3xl font-semibold">3 tiers</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Max seats</p>
            <p className="mt-1 text-3xl font-semibold">10</p>
          </div>
        </section>
      </div>
    </main>
  );
}
