import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CandidateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Candidate</Badge>
          <p className="text-sm text-muted-foreground">Track jobs and applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Home</Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/jobs">Jobs</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/applications">Applications</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/favorites">Favorites</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile">Profile</Link>
        </Button>
      </nav>

      {children}
    </main>
  );
}
