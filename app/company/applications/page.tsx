"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CompanyStatus = "submitted" | "in_review" | "accepted" | "rejected" | "withdrawn";
type DecisionStatus = "in_review" | "accepted" | "rejected";

export default function CompanyApplicationsPage() {
  const { orgId } = useAuth();
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | "all">("all");
  const [statusText, setStatusText] = useState<string | null>(null);
  const [mutatingApplicationId, setMutatingApplicationId] = useState<string | null>(null);

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip",
  );
  const applications = useQuery(
    api.applications.listCompanyApplications,
    companyContext
      ? {
          companyId: companyContext.companyId,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 200,
        }
      : "skip",
  );
  const updateApplicationStatus = useMutation(api.applications.updateApplicationStatus);

  const canDecide =
    companyContext?.role === "admin" || companyContext?.role === "recruiter";

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">Select an organization to continue.</p>;
  }

  if (companyContext === undefined || applications === undefined) {
    return <p className="text-sm text-muted-foreground">Loading applications...</p>;
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
        <h2 className="text-xl font-semibold">Applications</h2>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as CompanyStatus | "all")}
        >
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {statusText ? <p className="text-xs text-muted-foreground">{statusText}</p> : null}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No applications found for this filter.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {applications.map((application) => (
          <Card key={application._id}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {application.job?.title ?? "Unknown job"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Applicant: {formatApplicant(application.applicant)}
                  </p>
                </div>
                <Badge variant={statusVariant(application.status)}>
                  {application.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.coverLetter ? (
                <p className="text-sm text-muted-foreground line-clamp-3">{application.coverLetter}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No cover letter provided.</p>
              )}

              {canDecide && application.status !== "withdrawn" ? (
                <div className="flex flex-wrap gap-2">
                  {(["in_review", "accepted", "rejected"] as DecisionStatus[]).map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      size="sm"
                      variant="outline"
                      disabled={
                        mutatingApplicationId === application._id ||
                        application.status === nextStatus
                      }
                      onClick={async () => {
                        setStatusText(null);
                        setMutatingApplicationId(application._id);
                        try {
                          await updateApplicationStatus({
                            applicationId: application._id,
                            status: nextStatus,
                          });
                          setStatusText(`Application moved to ${nextStatus.replace("_", " ")}.`);
                        } catch (error) {
                          setStatusText(
                            error instanceof Error
                              ? error.message
                              : "Could not update application status.",
                          );
                        } finally {
                          setMutatingApplicationId(null);
                        }
                      }}
                    >
                      Mark {nextStatus.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {canDecide
                    ? "No actions available for withdrawn applications."
                    : "Read-only access for your role."}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function formatApplicant(
  applicant: { firstName?: string; lastName?: string; email?: string } | null,
) {
  if (!applicant) {
    return "Unknown applicant";
  }
  const fullName = `${applicant.firstName ?? ""} ${applicant.lastName ?? ""}`.trim();
  return fullName || applicant.email || "Unknown applicant";
}

function statusVariant(status: CompanyStatus): "default" | "secondary" | "outline" {
  if (status === "accepted") return "default";
  if (status === "in_review" || status === "submitted") return "secondary";
  return "outline";
}
