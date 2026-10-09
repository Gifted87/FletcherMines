import Link from "next/link";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Fletcher Mines home">
      <svg className="logo__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" stroke="#2e3b52" strokeWidth="1.5" fill="#121925" />
        <path d="M16 6.5 24.5 11v10L16 25.5 7.5 21V11L16 6.5Z" stroke="url(#fm-g)" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7.5 11 16 15.5 24.5 11M16 15.5v10" stroke="url(#fm-g)" strokeWidth="1.6" strokeLinejoin="round" />
        <defs>
          <linearGradient id="fm-g" x1="7" y1="6" x2="25" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#d4a94e" />
          </linearGradient>
        </defs>
      </svg>
      <span>
        Fletcher Mines
        <span className="logo__sub">Mining Infrastructure</span>
      </span>
    </Link>
  );
}
