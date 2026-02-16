import Link from "next/link";
import { Protect } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanySummaryCards } from "./_components/company-summary-cards";

export default async function CompanyDashboardPage() {
  const { has, orgId } = await auth();
  if (!orgId) {
    return (
      <section className="rounded-lg border p-4 text-sm text-muted-foreground">
        Select an organization to continue.
      </section>
    );
  }

  const canInviteTeam = has({ feature: "team_management" });
  const canPostMoreJobs = has({ feature: "job_posting" });
  const canManageInvites = has({ permission: "org:team_management:invite" });
  const canManageJobs = has({ role: "org:admin" }) || has({ role: "org:recruiter" });

  return (
    <section className="space-y-6">
      <CompanySummaryCards orgId={orgId} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="Team invites"
          enabled={canInviteTeam && canManageInvites}
          description="Feature + permission check: org:team_management:invite"
        />
        <FeatureCard
          title="Job posting"
          enabled={canPostMoreJobs}
          description="Feature check: job_posting"
        />
        <FeatureCard
          title="Job management actions"
          enabled={canManageJobs}
          description="Role check: org:admin or org:recruiter"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>Create and manage active listings.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/company/jobs">View jobs</Link>
            </Button>
            <Protect permission="org:job_posting:manage" fallback={null}>
              <Button asChild size="sm">
                <Link href="/company/jobs/new">Post new job</Link>
              </Button>
            </Protect>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Review candidates and make decisions.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/company/applications">Open application review</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Protect
        role="org:admin"
        fallback={
          <p className="rounded-lg border p-4 text-sm">
            Only organization admins can manage billing.
          </p>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Billing controls</CardTitle>
            <CardDescription>Upgrade plans and manage workspace limits.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href="/company/billing">Open billing</Link>
            </Button>
          </CardContent>
        </Card>
      </Protect>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <article className="rounded-lg border p-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <p className="mt-3 text-sm">
        Status: <span className={enabled ? "text-green-600" : "text-amber-600"}>{enabled ? "enabled" : "locked"}</span>
      </p>
      {!enabled && (
        <p className="mt-1 text-xs text-slate-500">Upgrade plan or adjust permissions to unlock.</p>
      )}
    </article>
  );
}
