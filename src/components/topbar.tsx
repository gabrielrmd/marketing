"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Sparkles } from "lucide-react";

const MONTHLY_GOAL = 25;

export function Topbar() {
  const { profile } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [contentCount, setContentCount] = useState(0);

  useEffect(() => {
    async function fetchMonthlyCount() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString();

      const { count, error } = await supabase
        .from("content_items")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth);

      if (!error && count !== null) {
        setContentCount(count);
      }
    }

    fetchMonthlyCount();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials =
    profile?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "AU";

  const progressPercent = Math.min(
    (contentCount / MONTHLY_GOAL) * 100,
    100,
  );

  const planLabel = profile?.role ?? "Starter";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      {/* Left — motivational streak */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold" style={{ color: "#F28C28" }}>
          🔥 Start creating!
        </span>
      </div>

      {/* Center — progress indicator */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          AU improves with every piece created:
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #14B8A6, #22C55E)",
              }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-foreground">
            {contentCount}/{MONTHLY_GOAL}
          </span>
        </div>
      </div>

      {/* Right — plan badge + avatar dropdown */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {planLabel}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
