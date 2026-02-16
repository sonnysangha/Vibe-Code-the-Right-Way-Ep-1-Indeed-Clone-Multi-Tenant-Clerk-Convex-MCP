"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatSalary(min?: number, max?: number, currency?: string) {
  if (min === undefined && max === undefined) return "Salary not listed";
  const unit = currency ?? "USD";
  if (min !== undefined && max !== undefined) return `${min.toLocaleString()} - ${max.toLocaleString()} ${unit}`;
  return `${(max ?? min ?? 0).toLocaleString()} ${unit}`;
}

export default function FavoritesPage() {
  const favorites = useQuery(api.favorites.listMyFavorites, { limit: 200 });
  const removeFavorite = useMutation(api.favorites.removeFavorite);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Saved jobs</CardTitle>
          <CardDescription>Keep track of opportunities you want to revisit.</CardDescription>
        </CardHeader>
      </Card>

      {favorites === undefined && <p className="text-sm text-muted-foreground">Loading saved jobs...</p>}
      {favorites?.length === 0 && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            You have no favorites yet. Save jobs from the jobs page.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {favorites?.map((favorite) => {
          const job = favorite.job;
          if (!job) {
            return null;
          }
          return (
            <Card key={favorite._id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">
                    <Link href={`/jobs/${job._id}`} className="hover:underline">
                      {job.title}
                    </Link>
                  </CardTitle>
                  <Badge variant="secondary">{job.workplaceType.replace("_", "-")}</Badge>
                </div>
                <CardDescription>
                  {job.companyName} • {job.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/jobs/${job._id}`}>View job</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void removeFavorite({ jobId: job._id })}
                  >
                    Remove
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
