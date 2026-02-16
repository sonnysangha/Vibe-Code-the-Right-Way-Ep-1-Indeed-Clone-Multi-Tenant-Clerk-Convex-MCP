"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompanyJobsPage() {
  const { orgId } = useAuth();
  const [includeClosed, setIncludeClosed] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [mutatingJobId, setMutatingJobId] = useState<string | null>(null);

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip",
  );
  const jobs = useQuery(
    api.jobs.listCompanyJobs,
    companyContext
      ? { companyId: companyContext.companyId, includeClosed, limit: 100 }
      : "skip",
  );
  const closeJobListing = useMutation(api.jobs.closeJobListing);
  const updateJobListing = useMutation(api.jobs.updateJobListing);

  const canManage =
    companyContext?.role === "admin" || companyContext?.role === "recruiter";

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">Select an organization to continue.</p>;
  }

  if (companyContext === undefined || jobs === undefined) {
    return <p className="text-sm text-muted-foreground">Loading company jobs...</p>;
  }

  if (!companyContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company workspace unavailable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your organization has not synced into Convex yet. Wait a few seconds and refresh.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Company jobs</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeClosed((value) => !value)}
          >
            {includeClosed ? "Hide closed" : "Show closed"}
          </Button>
          {canManage ? (
            <Button asChild size="sm">
              <Link href="/company/jobs/new">New listing</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {statusText ? <p className="text-xs text-muted-foreground">{statusText}</p> : null}

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No job listings found.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {jobs.map((job) => (
          <Card key={job._id}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {job.location} · {job.workplaceType.replace("_", " ")} ·{" "}
                    {job.employmentType.replace("_", " ")}
                  </p>
                </div>
                <Badge variant={job.isActive ? "secondary" : "outline"}>
                  {job.isActive ? "Active" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Applications: {job.applicationCount} · Updated {formatDate(job.updatedAt)}
              </p>
              <p className="text-sm">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>

              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  {job.isActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mutatingJobId === job._id}
                      onClick={async () => {
                        setStatusText(null);
                        setMutatingJobId(job._id);
                        try {
                          await closeJobListing({
                            companyId: companyContext.companyId,
                            jobId: job._id,
                          });
                          setStatusText("Job listing closed.");
                        } catch (error) {
                          setStatusText(
                            error instanceof Error ? error.message : "Could not close job listing.",
                          );
                        } finally {
                          setMutatingJobId(null);
                        }
                      }}
                    >
                      Close listing
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mutatingJobId === job._id}
                      onClick={async () => {
                        setStatusText(null);
                        setMutatingJobId(job._id);
                        try {
                          await updateJobListing({
                            companyId: companyContext.companyId,
                            jobId: job._id,
                            isActive: true,
                          });
                          setStatusText("Job listing reopened.");
                        } catch (error) {
                          setStatusText(
                            error instanceof Error ? error.message : "Could not reopen job listing.",
                          );
                        } finally {
                          setMutatingJobId(null);
                        }
                      }}
                    >
                      Reopen listing
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Read-only access for your role.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function formatSalary(
  salaryMin?: number,
  salaryMax?: number,
  salaryCurrency?: string,
) {
  if (salaryMin === undefined && salaryMax === undefined) {
    return "Salary not specified";
  }
  const currency = salaryCurrency ?? "USD";
  if (salaryMin !== undefined && salaryMax !== undefined) {
    return `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} ${currency}`;
  }
  return `${(salaryMin ?? salaryMax ?? 0).toLocaleString()} ${currency}`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}
