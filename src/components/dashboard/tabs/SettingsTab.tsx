"use client";

import { Lock, ShieldCheck, User } from "lucide-react";
import { UserDashboardData } from "@/lib/types/dashboard";

interface SettingsTabProps {
  data: UserDashboardData;
}

export default function SettingsTab({ data }: SettingsTabProps) {
  return (
    <div className="dash-subtab-view">
      <div className="dash-subtab-header">
        <div>
          <div className="eyebrow text-emerald">
            <ShieldCheck size={13} /> SECURITY &amp; CREDENTIALS
          </div>
          <h2>Account Security &amp; Settings</h2>
          <p>
            Manage your account authentication credentials, two-factor verification, and profile information.
          </p>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__head">
          <div className="dash-card__title-wrap">
            <User size={18} className="text-cyan" />
            <h3>Profile &amp; Identity</h3>
          </div>
          <span className="badge badge--cyan">Tier 1 Institutional</span>
        </div>

        <div className="dash-settings-grid">
          <div className="dash-setting-row">
            <span>Operator Username</span>
            <strong className="font-mono">{data.user.username}</strong>
          </div>
          <div className="dash-setting-row">
            <span>Registered Email</span>
            <strong className="font-mono">{data.user.email}</strong>
          </div>
          <div className="dash-setting-row">
            <span>Unique Referral ID</span>
            <strong className="font-mono text-gold">{data.user.referralCode}</strong>
          </div>
          <div className="dash-setting-row">
            <span>KYC Verification</span>
            <span className="dash-chip is-good">Verified (Level 1)</span>
          </div>
          <div className="dash-setting-row">
            <span>Two-Factor Authentication</span>
            <span className="dash-chip is-good">Enabled (TOTP)</span>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__head">
          <div className="dash-card__title-wrap">
            <Lock size={18} className="text-gold" />
            <h3>Security Architecture</h3>
          </div>
        </div>
        <div className="dash-security-info">
          <p>
            All account authentication sessions are cryptographically protected via salted PBKDF2/bcrypt hashing, anti-tamper session tokens, and strict HTTP-only transport.
          </p>
        </div>
      </div>
    </div>
  );
}
