import { CreateOrganization, OrganizationSwitcher, PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function PricingPage() {
  const { orgId } = await auth();

  console.log("orgId", orgId);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold">Company plans</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Select a plan for your organization. Billing for this app is organization-based.
      </p>

      {!orgId ? (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            First step: create or select an organization. After that, your plans will appear.
          </p>
          <div className="w-full overflow-x-auto rounded-md border p-3">
            <CreateOrganization
              afterCreateOrganizationUrl="/pricing"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border p-4">
            <div className="mb-3">
              <OrganizationSwitcher hidePersonal />
            </div>
            <PricingTable for="organization" />
          </div>
        </>
      )}
    </main>
  );
}
