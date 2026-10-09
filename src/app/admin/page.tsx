import { Suspense } from "react";
import { connection } from "next/server";
import { getAdminOverviewData } from "@/lib/adminData";
import { getAdminServerSession } from "@/lib/auth";
import AdminClientView from "./AdminClientView";
import AdminLoginGate from "@/components/admin/AdminLoginGate";

async function AdminDataLoader() {
  await connection();
  const adminSession = await getAdminServerSession();

  if (!adminSession) {
    return <AdminLoginGate />;
  }

  const initialData = getAdminOverviewData();
  return <AdminClientView initialData={initialData} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-shell" style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="font-mono text-sm text-gold">Initializing Fletcher Mines Admin OS...</div>
        </div>
      }
    >
      <AdminDataLoader />
    </Suspense>
  );
}
