"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanySummaryCards({ orgId }: { orgId: string }) {
  const companyContext = useQuery(api.companies.getMyCompanyContext, { clerkOrgId: orgId });
  const jobs = useQuery(
    api.jobs.listCompanyJobs,
    companyContext ? { companyId: companyContext.companyId, includeClosed: true, limit: 200 } : "skip",
  );
  const applications = useQuery(
    api.applications.listCompanyApplications,
    companyContext ? { companyId: companyContext.companyId, limit: 400 } : "skip",
  );

  if (companyContext === undefined || jobs === undefined || applications === undefined) {
    return <p className="text-sm text-muted-foreground">Loading company metrics...</p>;
  }

  if (!companyContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company context unavailable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your organization data is still syncing. Refresh in a few seconds.
        </CardContent>
      </Card>
    );
  }

  const activeJobs = jobs.filter((job) => job.isActive).length;
  const submitted = applications.filter((application) => application.status === "submitted").length;
  const inReview = applications.filter((application) => application.status === "in_review").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Organization" value={companyContext.companyName} />
      <MetricCard label="Your role" value={companyContext.role} />
      <MetricCard label="Active jobs" value={String(activeJobs)} />
      <MetricCard label="Pipeline" value={`${submitted} submitted / ${inReview} in review`} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold capitalize">{value}</p>
      </CardContent>
    </Card>
  );
}
