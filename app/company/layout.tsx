import Link from "next/link";
import { OrganizationSwitcher, Protect, UserButton } from "@clerk/nextjs";

export default async function CompanyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Company workspace</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Organization scoped dashboard and billing controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrganizationSwitcher hidePersonal />
          <UserButton />
        </div>
      </header>

      <nav className="mb-6 flex items-center gap-2">
        <Link href="/company" className="rounded-md border px-3 py-2 text-sm">
          Dashboard
        </Link>
        <Link href="/company/jobs" className="rounded-md border px-3 py-2 text-sm">
          Jobs
        </Link>
        <Link href="/company/applications" className="rounded-md border px-3 py-2 text-sm">
          Applications
        </Link>
        <Protect permission="org:job_posting:manage">
          <Link href="/company/jobs/new" className="rounded-md border px-3 py-2 text-sm">
            Post job
          </Link>
        </Protect>
        <Protect role="org:admin">
          <Link href="/company/billing" className="rounded-md border px-3 py-2 text-sm">
            Billing
          </Link>
        </Protect>
      </nav>

      {children}
    </main>
  );
}
