"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatSalary(min?: number, max?: number, currency?: string) {
  if (min === undefined && max === undefined) return "Salary not listed";
  const unit = currency ?? "USD";
  if (min !== undefined && max !== undefined) return `${min.toLocaleString()} - ${max.toLocaleString()} ${unit}`;
  return `${(max ?? min ?? 0).toLocaleString()} ${unit}`;
}

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as Id<"jobListings">;
  const [coverLetter, setCoverLetter] = useState("");
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const job = useQuery(api.jobs.getJobListingById, { jobId });
  const isFavorited = useQuery(api.favorites.isJobFavorited, { jobId });
  const addFavorite = useMutation(api.favorites.addFavorite);
  const removeFavorite = useMutation(api.favorites.removeFavorite);
  const applyToJob = useMutation(api.applications.applyToJob);

  if (job === undefined) {
    return <p className="text-sm text-muted-foreground">Loading job...</p>;
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8">
          <p className="text-sm text-muted-foreground">Job not found.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/jobs">Back to jobs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{job.workplaceType.replace("_", "-")}</Badge>
            <Badge variant="secondary">{job.employmentType.replace("_", "-")}</Badge>
          </div>
          <CardTitle className="text-2xl">{job.title}</CardTitle>
          <CardDescription>
            {job.companyName} • {job.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {(job.tags ?? []).slice(0, 8).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/jobs">Back to jobs</Link>
            </Button>
            <Button
              variant={isFavorited ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                if (isFavorited) {
                  void removeFavorite({ jobId });
                } else {
                  void addFavorite({ jobId });
                }
              }}
            >
              {isFavorited ? "Saved" : "Save job"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply now</CardTitle>
          <CardDescription>Submit your application directly from this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover letter (optional)</Label>
            <Textarea
              id="coverLetter"
              rows={8}
              placeholder="Share why this role is a strong fit."
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              setStatusText(null);
              try {
                await applyToJob({
                  jobId,
                  coverLetter: coverLetter.trim() || undefined,
                });
                setStatusText("Application submitted.");
                setCoverLetter("");
              } catch (error) {
                const message = error instanceof Error ? error.message : "Could not submit application.";
                setStatusText(message);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit application"}
          </Button>
          {statusText && <p className="text-xs text-muted-foreground">{statusText}</p>}
        </CardContent>
      </Card>
    </section>
  );
}
