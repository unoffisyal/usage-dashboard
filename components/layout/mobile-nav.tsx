"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
      <MobileNavLink href="/" icon={<BarChart3 className="w-5 h-5" />} active={pathname === "/"}>
        Dashboard
      </MobileNavLink>
      <MobileNavLink href="/settings" icon={<Settings className="w-5 h-5" />} active={pathname === "/settings"}>
        Settings
      </MobileNavLink>
    </nav>
  );
}

function MobileNavLink({
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
      className={`flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors ${
        active ? "text-text-primary" : "text-text-muted"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
