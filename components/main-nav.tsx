"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/customers", label: "Customers" },
  { href: "/requests", label: "Requests" }
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-links">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
