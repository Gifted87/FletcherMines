import { Suspense } from "react";
import { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboardData";
import { getServerSession } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Operator Dashboard — Fletcher Mines Institutional Mining Platform",
  description:
    "Institutional financial control center. Track deployed mining blocks, physical hashrate yields, liquid wallet balances, and contract maturity schedules.",
};

async function DashboardContent({ searchParams }: { searchParams?: Promise<{ user?: string }> }) {
  await connection();
  const params = searchParams ? await searchParams : undefined;
  const session = await getServerSession();

  let targetUserId: number | undefined = undefined;

  // Allow explicit user query for admin inspection or direct deep dive
  if (params?.user) {
    targetUserId = Number(params.user);
  } else if (session) {
    targetUserId = session.userId;
  }

  if (!targetUserId) {
    redirect("/login");
  }

  const data = getDashboardData(targetUserId);

  if (!data) {
    redirect("/login");
  }

  return <DashboardShell initialData={data} />;
}

export default function DashboardPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="dash-loading-screen">
          <Loader2 className="animate-spin text-gold" size={32} />
          <p>Connecting to Institutional Ledger...</p>
        </div>
      }
    >
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
