import { Suspense } from "react";
import type { Metadata } from "next";
import AuthCard from "@/components/AuthCard";

export const metadata: Metadata = {
  title: "Log In — Fletcher Mines Institutional Mining Platform",
  description: "Secure login to your Fletcher Mines vault dashboard. Manage allocations, monitor real-time hash-rate and withdraw settled daily yields.",
};

export default function LoginPage() {
  return (
    <main className="auth-page-container">
      <Suspense fallback={<div className="auth-loading">Loading secure portal...</div>}>
        <AuthCard initialTab="login" />
      </Suspense>
    </main>
  );
}
