import { Suspense } from "react";
import type { Metadata } from "next";
import AuthCard from "@/components/AuthCard";

export const metadata: Metadata = {
  title: "Create Account — Fletcher Mines Institutional Mining Platform",
  description: "Register your mining account and claim your 50 USDT welcome bonus. Allocate capital into fixed-rate mining blocks backed by verified infrastructure.",
};

export default function SignUpPage() {
  return (
    <main className="auth-page-container">
      <Suspense fallback={<div className="auth-loading">Loading secure portal...</div>}>
        <AuthCard initialTab="signup" />
      </Suspense>
    </main>
  );
}
