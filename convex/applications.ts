import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { getOrCreateViewerUser, getViewerUser } from "./lib/auth";
import { requireCompanyRole } from "./lib/companies";

const applicationStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("in_review"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("withdrawn"),
);

export const applyToJob = mutation({
  args: {
    jobId: v.id("jobListings"),
    coverLetter: v.optional(v.string()),
    resumeId: v.optional(v.id("resumes")),
    answers: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateViewerUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || !job.isActive) {
      throw new ConvexError("This job is unavailable.");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    const firstName = (profile?.firstName ?? user.firstName ?? "").trim();
    const lastName = (profile?.lastName ?? user.lastName ?? "").trim();
    if (!firstName || !lastName) {
      throw new ConvexError("Complete your profile before applying.");
    }

    if (args.resumeId) {
      const resume = await ctx.db.get(args.resumeId);
      if (!resume || resume.userId !== user._id) {
        throw new ConvexError("Invalid resume selected.");
      }
    }

    const existing = await ctx.db
      .query("applications")
      .withIndex("by_jobId_applicantUserId", (q) =>
        q.eq("jobId", args.jobId).eq("applicantUserId", user._id),
      )
      .unique();

    if (existing && existing.status !== "withdrawn") {
      throw new ConvexError("You already applied for this job.");
    }

    const now = Date.now();
    const applicationId = existing
      ? existing._id
      : await ctx.db.insert("applications", {
          jobId: args.jobId,
          companyId: job.companyId,
          applicantUserId: user._id,
          status: "submitted",
          coverLetter: args.coverLetter,
          resumeId: args.resumeId,
          answers: args.answers,
          createdAt: now,
          updatedAt: now,
        });

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "submitted",
        coverLetter: args.coverLetter,
        resumeId: args.resumeId,
        answers: args.answers,
        updatedAt: now,
      });
    }

    if (!existing) {
      await ctx.db.patch(args.jobId, {
        applicationCount: job.applicationCount + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(args.jobId, { updatedAt: now });
    }

    await ctx.runMutation(internal.notifications.createNotification, {
      userId: job.postedByUserId,
      type: "application_received",
      title: "New application received",
      message: `A candidate applied for ${job.title}.`,
      linkUrl: `/company/applications`,
      metadata: {
        applicationId,
        jobId: args.jobId,
      },
    });

    return applicationId;
  },
});

export const listMyApplications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx);
    if (!user) {
      return [];
    }

    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_applicantUserId_createdAt", (q) => q.eq("applicantUserId", user._id))
      .order("desc")
      .take(limit);

    return await Promise.all(
      applications.map(async (application) => {
        const job = await ctx.db.get(application.jobId);
        return {
          ...application,
          job,
        };
      }),
    );
  },
});

function normalizeSkillsFilter(skills: string[] | undefined): string[] {
  if (!skills || skills.length === 0) return [];
  return skills.map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export const listCompanyApplications = query({
  args: {
    companyId: v.id("companies"),
    status: v.optional(applicationStatusValidator),
    jobId: v.optional(v.id("jobListings")),
    limit: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    minYearsExperience: v.optional(v.number()),
    maxYearsExperience: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx);
    if (!user) {
      throw new ConvexError("You must be signed in.");
    }

    await requireCompanyRole(ctx, args.companyId, user._id, [
      "admin",
      "recruiter",
      "member",
    ]);

    const company = await ctx.db.get(args.companyId);
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500));

    const useAdvancedFilters =
      company?.plan === "growth" &&
      (normalizeSkillsFilter(args.skills).length > 0 ||
        args.minYearsExperience !== undefined ||
        args.maxYearsExperience !== undefined);

    let applicationIds: Id<"applications">[];

    if (useAdvancedFilters) {
      const skillsFilter = normalizeSkillsFilter(args.skills);
      const minYears = args.minYearsExperience ?? -Infinity;
      const maxYears =
        args.maxYearsExperience !== undefined ? args.maxYearsExperience : Infinity;

      const rawRows = args.status
        ? await ctx.db
            .query("applications")
            .withIndex("by_companyId_status", (q) =>
              q.eq("companyId", args.companyId).eq("status", args.status!),
            )
            .take(500)
        : await ctx.db
            .query("applications")
            .withIndex("by_companyId_createdAt", (q) =>
              q.eq("companyId", args.companyId),
            )
            .order("desc")
            .take(500);

      const jobFiltered = args.jobId
        ? rawRows.filter((row) => row.jobId === args.jobId)
        : rawRows;

      const passed: Id<"applications">[] = [];
      for (const app of jobFiltered) {
        if (passed.length >= limit) break;
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", app.applicantUserId))
          .unique();
        const years = profile?.yearsExperience ?? 0;
        if (years < minYears || years > maxYears) continue;
        if (skillsFilter.length > 0) {
          const profileSkills = (profile?.skills ?? []).map((s) =>
            s.toLowerCase(),
          );
          const hasSkill = skillsFilter.some((s) =>
            profileSkills.some((ps) => ps.includes(s) || s.includes(ps)),
          );
          if (!hasSkill) continue;
        }
        passed.push(app._id);
      }
      applicationIds = passed;
    } else {
      const rows = args.status
        ? await ctx.db
            .query("applications")
            .withIndex("by_companyId_status", (q) =>
              q.eq("companyId", args.companyId).eq("status", args.status!),
            )
            .take(limit * 2)
        : await ctx.db
            .query("applications")
            .withIndex("by_companyId_createdAt", (q) =>
              q.eq("companyId", args.companyId),
            )
            .order("desc")
            .take(limit * 2);

      const filtered = args.jobId
        ? rows.filter((row) => row.jobId === args.jobId)
        : rows;
      applicationIds = filtered.slice(0, limit).map((a) => a._id);
    }

    const applications = await Promise.all(
      applicationIds.map((id) => ctx.db.get(id)),
    );
    const limited = applications.filter(
      (a): a is NonNullable<typeof a> => a !== null,
    );

    return await Promise.all(
      limited.map(async (application) => {
        const [job, applicant] = await Promise.all([
          ctx.db.get(application.jobId),
          ctx.db.get(application.applicantUserId),
        ]);

        const [profile, experiences, education, certifications, resumes] =
          await Promise.all([
            ctx.db
              .query("profiles")
              .withIndex("by_userId", (q) =>
                q.eq("userId", application.applicantUserId),
              )
              .unique(),
            ctx.db
              .query("experiences")
              .withIndex("by_userId", (q) =>
                q.eq("userId", application.applicantUserId),
              )
              .collect(),
            ctx.db
              .query("education")
              .withIndex("by_userId", (q) =>
                q.eq("userId", application.applicantUserId),
              )
              .collect(),
            ctx.db
              .query("certifications")
              .withIndex("by_userId", (q) =>
                q.eq("userId", application.applicantUserId),
              )
              .collect(),
            ctx.db
              .query("resumes")
              .withIndex("by_userId", (q) =>
                q.eq("userId", application.applicantUserId),
              )
              .collect(),
          ]);

        const resumesWithUrls = await Promise.all(
          resumes.map(async (r) => ({
            ...r,
            fileUrl: r.storageId
              ? await ctx.storage.getUrl(r.storageId)
              : (r.fileUrl ?? null),
          })),
        );

        return {
          ...application,
          job,
          applicant,
          profile,
          experiences: experiences.sort((a, b) => a.order - b.order),
          education: education.sort((a, b) => a.order - b.order),
          certifications,
          resumes: resumesWithUrls,
        };
      }),
    );
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(v.literal("in_review"), v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateViewerUser(ctx);
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new ConvexError("Application not found.");
    }

    await requireCompanyRole(ctx, application.companyId, user._id, ["admin", "recruiter"]);

    const now = Date.now();
    await ctx.db.patch(application._id, {
      status: args.status,
      decidedByUserId: user._id,
      decidedAt: now,
      updatedAt: now,
    });

    const job = await ctx.db.get(application.jobId);
    if (args.status === "accepted" && job?.autoCloseOnAccept && job.isActive) {
      await ctx.db.patch(job._id, {
        isActive: false,
        closedAt: now,
        updatedAt: now,
      });

      const pendingApps = await ctx.db
        .query("applications")
        .withIndex("by_jobId_createdAt", (q) => q.eq("jobId", application.jobId))
        .collect();

      await Promise.all(
        pendingApps
          .filter(
            (a) =>
              a._id !== application._id &&
              (a.status === "submitted" || a.status === "in_review"),
          )
          .map((a) =>
            ctx.runMutation(internal.notifications.createNotification, {
              userId: a.applicantUserId,
              type: "job_closed",
              title: "Job listing closed",
              message: `${job.title} at ${job.companyName} is no longer accepting applications.`,
              linkUrl: `/applications`,
              metadata: { jobId: job._id },
            }),
          ),
      );
    }

    const statusLabel = args.status.replace("_", " ");
    const title =
      args.status === "accepted"
        ? "Congratulations! You've been accepted"
        : `Application ${statusLabel}`;
    const message = job
      ? args.status === "accepted"
        ? `Congratulations! You've been accepted for ${job.title}.`
        : `Your application for ${job.title} is now ${statusLabel}.`
      : `Your application status is now ${statusLabel}.`;

    await ctx.runMutation(internal.notifications.createNotification, {
      userId: application.applicantUserId,
      type: "application_status",
      title,
      message,
      linkUrl: job ? `/jobs/${job._id}` : `/applications`,
      metadata: {
        applicationId: application._id,
        jobId: application.jobId,
        status: args.status,
      },
    });

    return await ctx.db.get(application._id);
  },
});

export const withdrawApplication = mutation({
  args: {
    applicationId: v.id("applications"),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateViewerUser(ctx);
    const application = await ctx.db.get(args.applicationId);

    if (!application || application.applicantUserId !== user._id) {
      throw new ConvexError("Application not found.");
    }

    if (application.status === "accepted" || application.status === "rejected") {
      throw new ConvexError("You cannot withdraw a finalized application.");
    }

    await ctx.db.patch(application._id, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(application._id);
  },
});
