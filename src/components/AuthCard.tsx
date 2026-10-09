"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Gift,
  ArrowRight,
  LifeBuoy,
  Sparkles,
  Loader2,
  AlertCircle,
  Coins,
  Check,
  TrendingUp,
  MapPin,
  Activity,
  Server,
  Fingerprint,
  Copy,
  ExternalLink,
} from "lucide-react";
import Logo from "./Logo";
import { IMAGES } from "@/lib/images";

type AuthTab = "signup" | "login";

interface AuthUser {
  id: number;
  email: string;
  username: string;
  referralCode: string;
  referredBy?: string | null;
  usdtBalance: number;
  bonusClaimed?: boolean;
  referralCount?: number;
  referralEarnings?: number;
  createdAt?: string;
}

export default function AuthCard({ initialTab = "signup" }: { initialTab?: AuthTab }) {
  const searchParams = useSearchParams();
  const rawRef = searchParams.get("ref");
  const bonusParam = searchParams.get("bonus");
  const defaultRef = rawRef || (bonusParam ? "REF-84927" : "");

  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Signup fields
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(defaultRef);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Field-level error messages
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [loginIdError, setLoginIdError] = useState("");
  const [loginPwdError, setLoginPwdError] = useState("");

  // States & Validation
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [refStatus, setRefStatus] = useState<{ valid: boolean | null; message: string }>({
    valid: defaultRef ? true : null,
    message: defaultRef ? "Referral code applied. 50.00 USDT welcome bonus unlocked." : "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [signupSuccess, setSignupSuccess] = useState<AuthUser | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<AuthUser | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState("Account Verification Inquiry");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSuccess, setSupportSuccess] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);

  // Live mini telemetry sparkline for left panel (institutional HUD)
  const [telemetrySeries, setTelemetrySeries] = useState<number[]>([
    184.2, 184.8, 185.1, 184.9, 185.6, 186.0, 185.8, 186.42,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetrySeries((prev) => {
        const last = prev[prev.length - 1];
        const drift = (186.4 - last) * 0.15;
        const next = last + drift + (Math.random() - 0.5) * 0.4;
        return [...prev.slice(1), Number(next.toFixed(2))];
      });
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const sparklineD = useMemo(() => {
    const min = Math.min(...telemetrySeries) - 0.5;
    const max = Math.max(...telemetrySeries) + 0.5;
    const w = 180;
    const h = 36;
    const pts = telemetrySeries.map((v, i) => {
      const x = (i / (telemetrySeries.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * (h - 8) - 4;
      return [x, y] as const;
    });
    return pts
      .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
      .join(" ");
  }, [telemetrySeries]);

  // Username live check debounced
  useEffect(() => {
    if (!username || username.length < 3) {
      return;
    }
    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError("This username is already taken.");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (val.length < 3) {
      setUsernameStatus("idle");
      if (val.length > 0) {
        setUsernameError("Username must be at least 3 characters.");
      } else {
        setUsernameError("");
      }
    } else {
      setUsernameError("");
    }
  };

  // Referral manual check
  const validateReferral = async (code: string) => {
    if (!code) {
      setRefStatus({ valid: null, message: "" });
      setReferralError("");
      return;
    }
    try {
      const res = await fetch(`/api/auth/validate-ref?ref=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.valid) {
        setRefStatus({ valid: true, message: data.message });
        setReferralError("");
      } else {
        setRefStatus({ valid: false, message: "" });
        setReferralError("This referral code is not valid.");
      }
    } catch {
      setRefStatus({ valid: false, message: "" });
      setReferralError("This referral code is not valid.");
    }
  };

  // Password rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score = [hasMinLength, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;
  const strengthLabels = ["Basic", "Moderate", "Enterprise", "Bank-Grade"];
  const strengthText = password ? strengthLabels[score - 1] || "Basic" : "";

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Handle Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    let hasError = false;

    if (!emailValid) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (!username || username.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      hasError = true;
    } else if (usernameStatus === "taken") {
      setUsernameError("This username is already taken.");
      hasError = true;
    } else {
      setUsernameError("");
    }

    if (!hasUppercase || !hasNumber) {
      setPasswordError("Password must include at least one uppercase letter and one number.");
      hasError = true;
    } else if (!hasMinLength) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (!passwordsMatch) {
      setConfirmError("Passwords do not match.");
      hasError = true;
    } else {
      setConfirmError("");
    }

    if (refStatus.valid === false) {
      setReferralError("This referral code is not valid.");
      hasError = true;
    }

    if (!termsAgreed) {
      setTermsError("You must accept the terms before continuing.");
      hasError = true;
    } else {
      setTermsError("");
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
          referralCode,
          termsAgreed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }
      setSignupSuccess(data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during account creation.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    let hasError = false;

    if (!loginIdentifier.trim()) {
      setLoginIdError("Enter your registered email or username.");
      hasError = true;
    } else {
      setLoginIdError("");
    }

    if (!loginPassword) {
      setLoginPwdError("Enter your account password.");
      hasError = true;
    } else {
      setLoginPwdError("");
    }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }
      setLoginSuccess(data.user);
      // Immediately navigate to authenticated user dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotSuccess(data.message || "Password reset instructions have been dispatched.");
    } catch {
      setForgotSuccess("Request processed. Please check your inbox.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Support Ticket
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportEmail || !supportMessage) return;
    setSupportLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: supportEmail,
          subject: supportSubject,
          message: supportMessage,
        }),
      });
      const data = await res.json();
      setSupportSuccess(data.message || "Support ticket submitted.");
    } catch {
      setSupportSuccess("Inquiry dispatched to our desk.");
    } finally {
      setSupportLoading(false);
    }
  };

  const copyReferral = (code: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/signup?ref=${code}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="auth-wrap">
      {/* MOBILE-ONLY TOP HEADER: Shown on mobile viewport <= 900px */}
      <header className="auth-mobile-header">
        <div className="auth-mobile-header__logo">
          <Logo href="/" />
        </div>
        <div className="auth-mobile-header__badge">
          <span className="pulse-dot" />
          <span>99.98% Uptime · 50 USDT Bonus Active</span>
        </div>
        <h1 className="auth-mobile-header__title">
          {tab === "signup" ? "Create Mining Account" : "Institutional Log In"}
        </h1>
        <p className="auth-mobile-header__sub">
          {tab === "signup"
            ? "Claim your 50.00 USDT welcome allocation and access fixed-term mining blocks."
            : "Access your portfolio and daily 00:00 UTC mining yields."}
        </p>
      </header>

      {/* RIGHT PANEL: Institutional Terminal Form (Positioned at top on mobile via order: 1) */}
      <section className="auth-form-side">
        <div className="auth-card">
          {/* TAB SWITCHER */}
          {!signupSuccess && !loginSuccess && (
            <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
              <button
                type="button"
                role="tab"
                id="tab-btn-signup"
                aria-selected={tab === "signup"}
                className={`auth-tab ${tab === "signup" ? "is-active" : ""}`}
                onClick={() => {
                  setTab("signup");
                  setErrorMessage("");
                }}
              >
                <Fingerprint size={15} />
                <span>Create Account</span>
                <span className="auth-tab-pill">50 USDT</span>
              </button>
              <button
                type="button"
                role="tab"
                id="tab-btn-login"
                aria-selected={tab === "login"}
                className={`auth-tab ${tab === "login" ? "is-active" : ""}`}
                onClick={() => {
                  setTab("login");
                  setErrorMessage("");
                }}
              >
                <KeyRound size={15} />
                <span>Log In</span>
              </button>
            </div>
          )}

          {/* SIGNUP SUCCESS SCREEN */}
          {signupSuccess && (
            <div className="auth-success-screen">
              <div className="auth-success-icon">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="auth-success-title">Account Successfully Created</h2>
              <p className="auth-success-sub">
                Welcome to Fletcher Mines, <strong>{signupSuccess.username}</strong>. Your institutional mining account has been provisioned.
              </p>

              {/* Bonus notification banner */}
              <div className="auth-bonus-awarded">
                <div className="auth-bonus-awarded__top">
                  <div className="auth-bonus-awarded__icon-box">
                    <Gift size={20} className="gift-icon" />
                  </div>
                  <div>
                    <span className="auth-bonus-awarded__tag">Welcome Balance Credited</span>
                    <h3 className="auth-bonus-awarded__amount">+50.00 USDT</h3>
                  </div>
                </div>
                <p className="auth-bonus-awarded__desc">
                  Your 50 USDT signup bonus is now active on your ledger. Select an active mining block batch to begin generating fixed daily returns.
                </p>
              </div>

              {/* Unique Referral Card */}
              <div className="auth-referral-box">
                <div className="auth-referral-box__head">
                  <span className="auth-referral-box__title">
                    <Sparkles size={14} /> Your Unique Referral Link
                  </span>
                  <span className="badge badge--gold">+50 USDT Each</span>
                </div>
                <p className="auth-referral-box__desc">
                  Earn an additional <strong>50 USDT</strong> credited to your account for every investor who registers using your referral link.
                </p>
                <div className="auth-referral-input-wrap">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/signup?ref=${signupSuccess.referralCode}`
                        : `https://fletchermines.com/signup?ref=${signupSuccess.referralCode}`
                    }
                    className="auth-referral-input"
                  />
                  <button
                    type="button"
                    onClick={() => copyReferral(signupSuccess.referralCode)}
                    className="btn btn--secondary btn--sm"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={14} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Next Steps */}
              <div className="auth-next-steps">
                <h4>Next Steps to Activate Your Yield:</h4>
                <ol className="auth-steps-list">
                  <li>
                    <span className="step-num">1</span>
                    <span>Review current Batch 05 capacity and select your preferred maturity term (14 to 180 days).</span>
                  </li>
                  <li>
                    <span className="step-num">2</span>
                    <span>Deposit USDT via TRC-20 or ERC-20 to allocate into hardware blocks.</span>
                  </li>
                  <li>
                    <span className="step-num">3</span>
                    <span>Receive fixed daily yields automatically credited at 00:00 UTC daily.</span>
                  </li>
                </ol>
              </div>

              <Link href="/dashboard" className="btn btn--primary btn--lg btn--block">
                Proceed to Operator Dashboard <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* LOGIN SUCCESS SCREEN */}
          {loginSuccess && (
            <div className="auth-success-screen">
              <div className="auth-success-icon">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="auth-success-title">Authentication Verified</h2>
              <p className="auth-success-sub">
                Authenticated as <strong>{loginSuccess.username}</strong> ({loginSuccess.email}).
              </p>

              <div className="auth-account-summary">
                <div className="auth-summary-item">
                  <span>Ledger Balance</span>
                  <strong className="text-success">{loginSuccess.usdtBalance.toFixed(2)} USDT</strong>
                </div>
                <div className="auth-summary-item">
                  <span>Referral Code</span>
                  <strong>{loginSuccess.referralCode}</strong>
                </div>
                <div className="auth-summary-item">
                  <span>Referral Count</span>
                  <strong>{loginSuccess.referralCount ?? 0} miners</strong>
                </div>
              </div>

              <Link href="/dashboard" className="btn btn--primary btn--lg btn--block">
                Proceed to Mining Dashboard <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* SIGN UP FORM */}
          {tab === "signup" && !signupSuccess && (
            <div className="auth-flow">
              <div className="auth-flow__head desktop-only">
                <div className="eyebrow">
                  <ShieldCheck size={13} /> SECURE REGISTRATION
                </div>
                <h2>Create Investor Account</h2>
                <p>Register your account and claim your 50.00 USDT welcome allocation.</p>
                <div className="auth-switch-note">
                  Already registered?{" "}
                  <button type="button" onClick={() => setTab("login")}>
                    Log in here.
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="auth-error-box">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="auth-form" noValidate>
                {/* Field 1: Email Address */}
                <div className="auth-field">
                  <div className="auth-field__label-row">
                    <label htmlFor="reg-email">Work or Personal Email</label>
                    {email && !emailError && (
                      <span className={`auth-field-badge ${emailValid ? "is-valid" : "is-invalid"}`}>
                        {emailValid ? "VALID FORMAT" : "INVALID"}
                      </span>
                    )}
                  </div>
                  <div className={`auth-input-wrap ${emailError ? "is-error" : ""}`}>
                    <div className="auth-input-icon-box">
                      <Mail size={16} />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="investor@domain.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      required
                    />
                  </div>
                  {emailError ? (
                    <span className="auth-field-msg text-error">{emailError}</span>
                  ) : (
                    <span className="auth-field-helper">
                      Used for cryptographic security notices and settlement receipts.
                    </span>
                  )}
                </div>

                {/* Field 2: Username with Live Check */}
                <div className="auth-field">
                  <div className="auth-field__label-row">
                    <label htmlFor="reg-username">Platform Username</label>
                    {usernameStatus === "checking" && (
                      <span className="auth-field-badge is-checking">
                        <Loader2 size={10} className="spin" /> VERIFYING...
                      </span>
                    )}
                    {usernameStatus === "available" && !usernameError && (
                      <span className="auth-field-badge is-valid">
                        <Check size={10} /> AVAILABLE
                      </span>
                    )}
                  </div>
                  <div className={`auth-input-wrap ${usernameError ? "is-error" : ""}`}>
                    <div className="auth-input-icon-box">
                      <User size={16} />
                    </div>
                    <input
                      id="reg-username"
                      type="text"
                      placeholder="e.g. Satoshi_Alpha"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      minLength={3}
                      maxLength={20}
                      required
                    />
                  </div>
                  {usernameError ? (
                    <span className="auth-field-msg text-error">{usernameError}</span>
                  ) : (
                    <span className="auth-field-helper">
                      3–20 characters. Letters, numbers, and underscores only.
                    </span>
                  )}
                </div>

                {/* Field 3: Password with Entropy Matrix */}
                <div className="auth-field">
                  <div className="auth-field__label-row">
                    <label htmlFor="reg-password">Access Password</label>
                    {password && (
                      <span className={`auth-strength-pill auth-strength--${strengthText.toLowerCase()}`}>
                        {strengthText} Security
                      </span>
                    )}
                  </div>
                  <div className={`auth-input-wrap ${passwordError ? "is-error" : ""}`}>
                    <div className="auth-input-icon-box">
                      <Lock size={16} />
                    </div>
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter minimum 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {passwordError && (
                    <span className="auth-field-msg text-error">{passwordError}</span>
                  )}

                  {/* 4-Segment Illuminated Strength Meter */}
                  <div className="auth-strength-meter" aria-hidden="true">
                    <div className={`auth-strength-segment ${score >= 1 ? "is-active score-1" : ""}`} />
                    <div className={`auth-strength-segment ${score >= 2 ? "is-active score-2" : ""}`} />
                    <div className={`auth-strength-segment ${score >= 3 ? "is-active score-3" : ""}`} />
                    <div className={`auth-strength-segment ${score >= 4 ? "is-active score-4" : ""}`} />
                  </div>

                  {/* Dynamic Micro-Checklist */}
                  <div className="auth-password-checks">
                    <span className={`auth-check-item ${hasMinLength ? "is-satisfied" : ""}`}>
                      <Check size={12} /> 8+ Characters
                    </span>
                    <span className={`auth-check-item ${hasUppercase ? "is-satisfied" : ""}`}>
                      <Check size={12} /> Uppercase
                    </span>
                    <span className={`auth-check-item ${hasNumber ? "is-satisfied" : ""}`}>
                      <Check size={12} /> Number
                    </span>
                    <span className={`auth-check-item ${hasSymbol ? "is-satisfied" : ""}`}>
                      <Check size={12} /> Symbol
                    </span>
                  </div>
                </div>

                {/* Field 4: Confirm Password */}
                <div className="auth-field">
                  <div className="auth-field__label-row">
                    <label htmlFor="reg-confirm">Confirm Password</label>
                    {confirmPassword && !confirmError && (
                      <span className={`auth-field-badge ${passwordsMatch ? "is-valid" : "is-invalid"}`}>
                        {passwordsMatch ? "MATCHES" : "MISMATCH"}
                      </span>
                    )}
                  </div>
                  <div className={`auth-input-wrap ${confirmError ? "is-error" : ""}`}>
                    <div className="auth-input-icon-box">
                      <Lock size={16} />
                    </div>
                    <input
                      id="reg-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmError) setConfirmError("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmError && (
                    <span className="auth-field-msg text-error">{confirmError}</span>
                  )}
                </div>

                {/* Field 5: Referral Code (Always Visible & Editable) */}
                <div className="auth-field">
                  <div className="auth-field__label-row">
                    <label htmlFor="reg-ref">
                      Invitation Referral Code <span className="auth-optional">(Optional)</span>
                    </label>
                    {refStatus.valid && !referralError && (
                      <span className="auth-field-badge is-valid">
                        <Gift size={10} /> 50 USDT UNLOCKED
                      </span>
                    )}
                  </div>
                  <div className={`auth-input-wrap ${referralError ? "is-error" : ""}`}>
                    <div className="auth-input-icon-box">
                      <Gift size={16} />
                    </div>
                    <input
                      id="reg-ref"
                      type="text"
                      placeholder="e.g. REF-84927"
                      value={referralCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setReferralCode(val);
                        if (referralError) setReferralError("");
                        validateReferral(val);
                      }}
                      className="font-mono uppercase"
                    />
                  </div>
                  {referralError ? (
                    <span className="auth-field-msg text-error">{referralError}</span>
                  ) : refStatus.message ? (
                    <span className="auth-field-msg text-success">{refStatus.message}</span>
                  ) : (
                    <span className="auth-field-helper">
                      Enter a referral code to unlock welcome allocation bonuses.
                    </span>
                  )}
                </div>

                {/* Field 6: Terms & Risk Consent */}
                <div className="auth-checkbox-group">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => {
                        setTermsAgreed(e.target.checked);
                        if (termsError) setTermsError("");
                      }}
                      required
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="auth-inline-link">
                        Terms of Service <ExternalLink size={11} />
                      </Link>
                      ,{" "}
                      <Link href="/privacy" target="_blank" className="auth-inline-link">
                        Privacy Policy <ExternalLink size={11} />
                      </Link>
                      , and acknowledge the mining lock-up maturity terms.
                    </span>
                  </label>
                  {termsError && (
                    <span className="auth-field-msg text-error">{termsError}</span>
                  )}
                </div>

                {/* Submit button with exact loading state */}
                <button
                  type="submit"
                  id="signup-submit-btn"
                  disabled={loading}
                  className="btn btn--primary btn--lg btn--block"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin" /> Creating account…
                    </>
                  ) : (
                    <>
                      Create Secure Account <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="auth-microcopy">
                  Protected by AES-256 GCM encryption and cold treasury reserve verification.
                </p>
              </form>
            </div>
          )}

          {/* LOG IN FORM */}
          {tab === "login" && !loginSuccess && (
            <div className="auth-flow">
              <div className="auth-flow__head desktop-only">
                <div className="eyebrow">
                  <KeyRound size={13} /> SECURE SIGN IN
                </div>
                <h2>Institutional Log In</h2>
                <p>Welcome back. Access your active mining portfolio and yields.</p>
                <div className="auth-switch-note">
                  Don&apos;t have an account yet?{" "}
                  <button type="button" onClick={() => setTab("signup")}>
                    Create account here.
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="auth-error-box">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="login-id">Registered Email or Username</label>
                  <div className={`auth-input-wrap ${loginIdError ? "is-error" : ""}`}>
                    <div className="auth-input-icon-box">
                      <User size={16} />
                    </div>
                    <input
                      id="login-id"
                      type="text"
                      placeholder="Enter your email or username"
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        if (loginIdError) setLoginIdError("");
                      }}
                      required
                    />
                  </div>
                  {loginIdError && (
                    <span className="auth-field-msg text-error">{loginIdError}</span>
                  )}
                </div>

                <div className="auth-field">
                  <div className="auth-field__label-row">
                    <label htmlFor="login-pwd">Access Password</label>
                    <button
                      type="button"
                      className="auth-link-subtle"
                      onClick={() => setShowForgotModal(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className={`auth-input-wrap ${loginPwdError ? "is-error" : ""}`}>
                    <div className="auth-input-icon-box">
                      <Lock size={16} />
                    </div>
                    <input
                      id="login-pwd"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginPwdError) setLoginPwdError("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {loginPwdError && (
                    <span className="auth-field-msg text-error">{loginPwdError}</span>
                  )}
                </div>

                <div className="auth-checkbox-group">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember this session for 30 days</span>
                  </label>
                </div>

                {/* Submit button with exact loading state */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={loading}
                  className="btn btn--primary btn--lg btn--block"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin" /> Verifying credentials…
                    </>
                  ) : (
                    <>
                      Log In Securely <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="auth-microcopy">
                  Session protected with encrypted token and anti-tamper telemetry.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* LEFT PANEL: Trust, Infrastructure & Telemetry (Positioned below card on mobile via order: 2) */}
      <aside className="auth-brand" style={{ position: "relative" }}>
        {/* Photographic Datacenter Background with Scanlines & Vignette */}
        <div className="auth-brand__media" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <Image
            src={IMAGES.heroDatacenter}
            alt="Fletcher Mines Datacenter Facility"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            className="auth-brand__img"
          />
          <div className="auth-brand__overlay" />
          <div className="auth-brand__grid" />
        </div>

        {/* Brand Top Header (Desktop only) */}
        <div className="auth-brand__top desktop-only">
          <div className="auth-logo-wrap">
            <Logo href="/" />
          </div>
          <div className="auth-live-badge">
            <span className="pulse-dot" />
            <span>FM-GATEWAY · 99.98% Uptime</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="auth-brand__content">
          <div className="auth-brand__badge">
            <ShieldCheck size={14} />
            <span>Institutional Mining Infrastructure</span>
          </div>

          <h2 className="auth-brand__title">
            Direct Hardware Backing. <br />
            <span className="accent">Automated Daily Yields.</span>
          </h2>

          <p className="auth-brand__sub">
            Access institutional hash-rate blocks provisioned from Tier-4 high-density facilities.
            Fixed daily returns from 10% to 20% settled automatically at 00:00 UTC.
          </p>

          {/* Golden 50 USDT Allocation Voucher Card */}
          <div className="auth-voucher">
            <div className="auth-voucher__glow" aria-hidden="true" />
            <div className="auth-voucher__header">
              <div className="auth-voucher__icon">
                <Gift size={20} />
              </div>
              <div className="auth-voucher__info">
                <span className="auth-voucher__tag">
                  <Sparkles size={11} /> Institutional Allocation Voucher
                </span>
                <h4 className="auth-voucher__title">50.00 USDT Welcome Bonus</h4>
              </div>
            </div>
            <p className="auth-voucher__desc">
              Instant <strong>50.00 USDT</strong> credited upon account creation + <strong>50.00 USDT</strong> for
              each referred miner who allocates into a mining batch.
            </p>
            <div className="auth-voucher__meta">
              <div className="auth-voucher__status">
                <span className="auth-voucher__status-dot" />
                <span>Active Promotion · Instant Ledger Credit</span>
              </div>
              <span className="auth-voucher__code">VOUCHER #FM-50-PROMO</span>
            </div>
          </div>

          {/* Live Datacenter Telemetry HUD (matching homepage HashrateTerminal aesthetic) */}
          <div className="auth-telemetry-hud">
            <div className="auth-telemetry-hud__head">
              <div className="auth-telemetry-hud__title">
                <Activity size={14} />
                <span>REYKJAVIK HALL B · LIVE TELEMETRY</span>
              </div>
              <span className="auth-telemetry-hud__tag">
                <span className="pulse-dot" /> 186.42 PH/s
              </span>
            </div>

            <div className="auth-telemetry-hud__metrics">
              <div className="auth-telemetry-hud__metric">
                <span className="auth-telemetry-hud__label">Active Fleet</span>
                <strong className="auth-telemetry-hud__val">4,812+ miners</strong>
              </div>
              <div className="auth-telemetry-hud__metric">
                <span className="auth-telemetry-hud__label">Cold Reserves</span>
                <strong className="auth-telemetry-hud__val text-success">1.24x Verified</strong>
              </div>
              <div className="auth-telemetry-hud__metric">
                <span className="auth-telemetry-hud__label">Settlement</span>
                <strong className="auth-telemetry-hud__val">00:00 UTC</strong>
              </div>
            </div>

            {/* Mini SVG Telemetry Sparkline */}
            <div className="auth-telemetry-hud__spark">
              <svg viewBox="0 0 180 36" preserveAspectRatio="none" aria-hidden="true">
                <path d={sparklineD} fill="none" stroke="#34d399" strokeWidth="1.75" />
              </svg>
              <div className="auth-telemetry-hud__spark-info">
                <TrendingUp size={11} className="text-success" />
                <span>+2.14% 1h network efficiency</span>
              </div>
            </div>
          </div>

          {/* Institutional Trust Guarantees */}
          <div className="auth-trust-list">
            <div className="auth-trust-item">
              <span className="auth-trust-icon">
                <Lock size={15} />
              </span>
              <div>
                <strong>AES-256 Encrypted Session Authentication</strong>
                <span>Zero-knowledge credentials with salted PBKDF2 cryptography.</span>
              </div>
            </div>

            <div className="auth-trust-item">
              <span className="auth-trust-icon">
                <Server size={15} />
              </span>
              <div>
                <strong>Physical Mining Hardware Backing</strong>
                <span>Batches capped by operational Antminer S21 Pro capacity.</span>
              </div>
            </div>

            <div className="auth-trust-item">
              <span className="auth-trust-icon">
                <Coins size={15} />
              </span>
              <div>
                <strong>Segregated Cold Treasury &amp; Proof of Reserves</strong>
                <span>Client principal held in multi-signature offline cold storage vaults.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer with Support Link & Compliance Stamp */}
        <div className="auth-brand__footer">
          <div className="auth-brand__facility-tag">
            <MapPin size={13} />
            <span>Hall B Datacenter Facility · Oct 2026</span>
          </div>
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => setShowSupportModal(true)}
          >
            <LifeBuoy size={14} /> Institutional Support Desk
          </button>
        </div>
      </aside>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__head">
              <h3>Reset Your Password</h3>
              <p>Enter your registered account email to receive a cryptographically signed reset token.</p>
            </div>
            {forgotSuccess ? (
              <div className="auth-modal__success">
                <CheckCircle2 size={36} />
                <p>{forgotSuccess}</p>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess("");
                  }}
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="auth-modal__form">
                <div className="auth-field">
                  <label htmlFor="forgot-email">Registered Email Address</label>
                  <div className="auth-input-wrap">
                    <div className="auth-input-icon-box">
                      <Mail size={16} />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="name@domain.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="auth-modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={forgotLoading} className="btn btn--primary">
                    {forgotLoading ? <Loader2 size={14} className="spin" /> : "Send Reset Token"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CONTACT SUPPORT MODAL */}
      {showSupportModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowSupportModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__head">
              <h3>Institutional Support Desk</h3>
              <p>Direct priority support for mining block allocations, wallet deposits, and account access.</p>
            </div>
            {supportSuccess ? (
              <div className="auth-modal__success">
                <CheckCircle2 size={36} />
                <p>{supportSuccess}</p>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => {
                    setShowSupportModal(false);
                    setSupportSuccess("");
                  }}
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="auth-modal__form">
                <div className="auth-field">
                  <label htmlFor="support-email">Your Account Email</label>
                  <div className="auth-input-wrap">
                    <div className="auth-input-icon-box">
                      <Mail size={16} />
                    </div>
                    <input
                      id="support-email"
                      type="email"
                      placeholder="your.email@domain.com"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="support-subject">Subject</label>
                  <div className="auth-input-wrap">
                    <input
                      id="support-subject"
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="support-msg">Message / Description</label>
                  <textarea
                    id="support-msg"
                    rows={4}
                    className="auth-textarea"
                    placeholder="Describe your inquiry or transaction details..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setShowSupportModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={supportLoading} className="btn btn--primary">
                    {supportLoading ? <Loader2 size={14} className="spin" /> : "Submit Ticket"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
