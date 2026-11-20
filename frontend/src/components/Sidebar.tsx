"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Practice" },
  { href: "/progress", label: "Progress" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar" aria-label="Main">
      <div className="brand">
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Rapport</span>
      </div>
      <div className="nav-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href || (link.href === "/" && pathname.startsWith("/practice"))
                ? "nav-link active"
                : "nav-link"
            }
          >
            {link.label}
          </Link>
        ))}
        <span className="nav-link muted">Message helper · soon</span>
      </div>
    </nav>
  );
}