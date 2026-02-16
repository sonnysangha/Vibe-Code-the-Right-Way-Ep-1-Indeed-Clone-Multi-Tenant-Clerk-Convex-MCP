import { v } from "convex/values";
import { query } from "./_generated/server";
import { getViewerUser } from "./lib/auth";

export const getMyCompanyContext = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx);
    if (!user) {
      return null;
    }

    const company = await ctx.db
      .query("companies")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
    if (!company) {
      return null;
    }

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_companyId_userId", (q) =>
        q.eq("companyId", company._id).eq("userId", user._id),
      )
      .unique();
    if (!membership || membership.status !== "active") {
      return null;
    }

    return {
      companyId: company._id,
      companyName: company.name,
      companySlug: company.slug,
      role: membership.role,
      clerkOrgId: company.clerkOrgId,
    };
  },
});
