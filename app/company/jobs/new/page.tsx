"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type JobFormValues = {
  title: string;
  description: string;
  location: string;
  employmentType: "full_time" | "part_time" | "contract" | "internship" | "temporary";
  workplaceType: "on_site" | "remote" | "hybrid";
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  tags: string;
};

export default function NewCompanyJobPage() {
  const router = useRouter();
  const { orgId } = useAuth();
  const [statusText, setStatusText] = useState<string | null>(null);

  const companyContext = useQuery(
    api.companies.getMyCompanyContext,
    orgId ? { clerkOrgId: orgId } : "skip",
  );
  const createJobListing = useMutation(api.jobs.createJobListing);

  const form = useForm<JobFormValues>({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      employmentType: "full_time",
      workplaceType: "hybrid",
      salaryMin: "",
      salaryMax: "",
      salaryCurrency: "USD",
      tags: "",
    },
  });

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">Select an organization to continue.</p>;
  }

  if (companyContext === undefined) {
    return <p className="text-sm text-muted-foreground">Loading company workspace...</p>;
  }

  if (!companyContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company workspace unavailable</CardTitle>
          <CardDescription>
            Your organization has not synced yet. Wait a few seconds and refresh.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const canManage =
    companyContext.role === "admin" || companyContext.role === "recruiter";
  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Read-only access</CardTitle>
          <CardDescription>
            Only admins and recruiters can create job listings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Post a new job</h2>
        <p className="text-sm text-muted-foreground">
          This listing will be visible in candidate search when published.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                setStatusText(null);
                const salaryMin = values.salaryMin.trim();
                const salaryMax = values.salaryMax.trim();

                try {
                  await createJobListing({
                    companyId: companyContext.companyId,
                    title: values.title.trim(),
                    description: values.description.trim(),
                    location: values.location.trim(),
                    employmentType: values.employmentType,
                    workplaceType: values.workplaceType,
                    salaryMin: salaryMin ? Number(salaryMin) : undefined,
                    salaryMax: salaryMax ? Number(salaryMax) : undefined,
                    salaryCurrency: values.salaryCurrency.trim() || undefined,
                    tags: values.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  });
                  setStatusText("Job listing created.");
                  router.push("/company/jobs");
                } catch (error) {
                  setStatusText(
                    error instanceof Error ? error.message : "Could not create job listing.",
                  );
                }
              })}
            >
              <FormField
                control={form.control}
                name="title"
                rules={{ required: "Title is required." }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job title</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Product Designer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                rules={{ required: "Description is required." }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={8} placeholder="Role summary, requirements, responsibilities..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="location"
                  rules={{ required: "Location is required." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment type</FormLabel>
                      <FormControl>
                        <select
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                          {...field}
                        >
                          <option value="full_time">Full time</option>
                          <option value="part_time">Part time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                          <option value="temporary">Temporary</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workplaceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workplace type</FormLabel>
                      <FormControl>
                        <select
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                          {...field}
                        >
                          <option value="on_site">On site</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="remote">Remote</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary min</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" placeholder="120000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary max</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" placeholder="160000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="typescript, design, saas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create listing"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/company/jobs")}
                >
                  Cancel
                </Button>
              </div>
              {statusText ? <p className="text-xs text-muted-foreground">{statusText}</p> : null}
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
