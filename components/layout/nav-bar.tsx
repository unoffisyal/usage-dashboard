"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, Activity } from "lucide-react";

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex items-center justify-between border-b border-border bg-surface px-6 h-14">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
        <Activity className="w-5 h-5 text-gemini" />
        <span>API Usage Dashboard</span>
      </Link>
      <nav className="flex items-center gap-1">
        <NavLink href="/" icon={<BarChart3 className="w-4 h-4" />} active={pathname === "/"}>
          Dashboard
        </NavLink>
        <NavLink href="/settings" icon={<Settings className="w-4 h-4" />} active={pathname === "/settings"}>
          Settings
        </NavLink>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  icon,
  active,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-text-primary/5 text-text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
