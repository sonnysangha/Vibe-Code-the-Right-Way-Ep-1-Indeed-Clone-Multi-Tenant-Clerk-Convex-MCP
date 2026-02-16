import { ConvexError, v } from "convex/values";
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

    await ctx.db.patch(args.jobId, {
      applicationCount: job.applicationCount + 1,
      updatedAt: now,
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

export const listCompanyApplications = query({
  args: {
    companyId: v.id("companies"),
    status: v.optional(applicationStatusValidator),
    jobId: v.optional(v.id("jobListings")),
    limit: v.optional(v.number()),
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

    const limit = Math.max(1, Math.min(args.limit ?? 100, 500));
    const rows = args.status
      ? await ctx.db
          .query("applications")
          .withIndex("by_companyId_status", (q) =>
            q.eq("companyId", args.companyId).eq("status", args.status!),
          )
          .take(limit * 2)
      : await ctx.db
          .query("applications")
          .withIndex("by_companyId_createdAt", (q) => q.eq("companyId", args.companyId))
          .order("desc")
          .take(limit * 2);

    const filtered = args.jobId ? rows.filter((row) => row.jobId === args.jobId) : rows;
    const limited = filtered.slice(0, limit);

    return await Promise.all(
      limited.map(async (application) => {
        const [job, applicant] = await Promise.all([
          ctx.db.get(application.jobId),
          ctx.db.get(application.applicantUserId),
        ]);
        return {
          ...application,
          job,
          applicant,
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
    await ctx.db.insert("notifications", {
      userId: application.applicantUserId,
      type: "application_status",
      title: `Application ${args.status.replace("_", " ")}`,
      message: job
        ? `Your application for ${job.title} is now ${args.status.replace("_", " ")}.`
        : `Your application status is now ${args.status.replace("_", " ")}.`,
      metadata: {
        applicationId: application._id,
        jobId: application.jobId,
        status: args.status,
      },
      isRead: false,
      createdAt: now,
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
