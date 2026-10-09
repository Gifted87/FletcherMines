"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import Logo from "./Logo";

const LINKS = [
  { href: "#miners", label: "Active Miners" },
  { href: "#calculator", label: "ROI Calculator" },
  { href: "#platform", label: "How It Works" },
  { href: "#next-drop", label: "Current Drop" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled || open ? "is-scrolled" : ""}`}>
      <div className="container nav__inner">
        <Logo />

        <nav aria-label="Primary">
          <ul className="nav__links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__actions">
          <a href="/login" id="nav-login" className="btn btn--ghost">
            Log In
          </a>
          <a href="/signup" id="nav-get-started" className="btn btn--primary">
            Get Started <ArrowRight />
          </a>
          <button
            type="button"
            id="nav-menu-toggle"
            className="nav__toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div className={`nav__mobile ${open ? "is-open" : ""}`}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href="/login" className="btn btn--ghost btn--block">
          Log In
        </a>
        <a href="/signup" className="btn btn--primary btn--block">
          Get Started <ArrowRight />
        </a>
      </div>
    </header>
  );
}
