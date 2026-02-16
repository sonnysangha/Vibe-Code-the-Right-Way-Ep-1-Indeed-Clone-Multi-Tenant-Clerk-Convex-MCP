"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "temporary";
type WorkplaceType = "on_site" | "remote" | "hybrid";

function formatSalary(min?: number, max?: number, currency?: string) {
  if (min === undefined && max === undefined) return "Salary not listed";
  const unit = currency ?? "USD";
  if (min !== undefined && max !== undefined) return `${min.toLocaleString()} - ${max.toLocaleString()} ${unit}`;
  return `${(max ?? min ?? 0).toLocaleString()} ${unit}`;
}

export default function JobsPage() {
  const [searchText, setSearchText] = useState("");
  const [location, setLocation] = useState("");
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");

  const jobs = useQuery(api.jobs.searchJobListings, {
    searchText: searchText.trim() || undefined,
    location: location.trim() || undefined,
    workplaceType: workplaceType || undefined,
    employmentType: employmentType || undefined,
    limit: 30,
  });
  const favorites = useQuery(api.favorites.listMyFavorites, { limit: 200 });
  const addFavorite = useMutation(api.favorites.addFavorite);
  const removeFavorite = useMutation(api.favorites.removeFavorite);

  const favoriteJobIds = useMemo(
    () => new Set((favorites ?? []).map((item) => item.job?._id).filter(Boolean)),
    [favorites],
  );

  return (
    <section className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Find your next role</CardTitle>
          <CardDescription>Use filters to narrow opportunities quickly.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Search title, company, skill"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Input
            placeholder="Location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={workplaceType}
            onChange={(event) => setWorkplaceType(event.target.value as WorkplaceType | "")}
          >
            <option value="">Any workplace</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on_site">On-site</option>
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value as EmploymentType | "")}
          >
            <option value="">Any type</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="temporary">Temporary</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {jobs === undefined && <p className="text-sm text-muted-foreground">Loading jobs...</p>}
        {jobs?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No jobs match your filters yet.
            </CardContent>
          </Card>
        )}
        {jobs?.map((job) => {
          const isFavorite = favoriteJobIds.has(job._id);
          return (
            <Card key={job._id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl">
                      <Link href={`/jobs/${job._id}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {job.companyName} • {job.location}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{job.workplaceType.replace("_", "-")}</Badge>
                    <Badge variant="secondary">{job.employmentType.replace("_", "-")}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                <p className="text-sm font-medium">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm">
                    <Link href={`/jobs/${job._id}`}>View details</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={isFavorite ? "secondary" : "outline"}
                    onClick={() => {
                      if (isFavorite) {
                        void removeFavorite({ jobId: job._id });
                      } else {
                        void addFavorite({ jobId: job._id });
                      }
                    }}
                  >
                    {isFavorite ? "Saved" : "Save job"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
