"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/requests/new", label: "Contact" }
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="site-brand" aria-label="IQAR home">
        <span className="brand-mark">I</span>
        <span>IQAR <strong>Estates</strong></span>
      </Link>
      <div className="site-actions">
        <nav className="nav-links" aria-label="Primary navigation">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/requests/new" className="nav-cta">New Request</Link>
      </div>
    </header>
  );
}
