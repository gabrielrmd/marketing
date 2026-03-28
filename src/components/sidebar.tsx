"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PenSquare,
  LayoutTemplate,
  CalendarDays,
  ImageIcon,
  Dna,
  Megaphone,
  Target,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/content/new", label: "Create", icon: PenSquare },
      { href: "/content/templates", label: "Templates", icon: LayoutTemplate },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/content", label: "Calendar", icon: CalendarDays },
      { href: "/content/assets", label: "Library", icon: ImageIcon },
      { href: "/funnel", label: "Brand DNA", icon: Dna },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/funnel", label: "Funnel", icon: Target },
      { href: "/crm", label: "CRM", icon: Users },
      { href: "/campaigns/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--au-teal)] to-[var(--au-green)] text-xs font-bold text-white shadow-sm">
          AU
        </div>
        <span className="font-[family-name:var(--font-oswald)] text-lg font-semibold tracking-tight">
          AU
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section, sectionIdx) => (
          <div key={section.title}>
            {sectionIdx > 0 && (
              <div className="mx-2 my-2 border-t border-sidebar-border/40" />
            )}
            <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-gradient-to-r from-[var(--au-teal)]/15 to-[var(--au-green)]/10 font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active && "text-[var(--au-teal)]"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
