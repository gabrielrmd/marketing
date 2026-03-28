# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the marketing project with Next.js 15, Supabase, auth, profiles, shared UI, and AU brand theming — ready for Module 1 (Content) to build on top of.

**Architecture:** Single Next.js 15 app with Supabase for database/auth/storage. Follows identical patterns to eyecandy-app and podcast projects (shadcn base-nova style, CVA components, Tailwind v4, path aliases). AU brand colors and fonts applied from the start.

**Tech Stack:** Next.js 15 (latest), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui (base-nova), Framer Motion, Supabase JS v2, Vitest, Playwright

> **Note:** `create-next-app@latest` will install the latest Next.js version available. The spec says "Next.js 15" — use whatever `latest` provides as Next.js 15.x or 16.x are both acceptable.

---

## File Structure

```
marketing/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (Oswald + Inter fonts, AU theme)
│   │   ├── globals.css                   # Tailwind imports + AU theme variables
│   │   ├── page.tsx                      # Landing/redirect to /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # Login page (magic link)
│   │   │   └── callback/route.ts         # Supabase auth callback handler
│   │   └── (dashboard)/
│   │       ├── layout.tsx                # Dashboard shell (sidebar + topbar)
│   │       └── page.tsx                  # Dashboard home
│   ├── components/
│   │   ├── ui/                           # shadcn components (button, input, card, etc.)
│   │   ├── sidebar.tsx                   # App sidebar with module navigation
│   │   └── topbar.tsx                    # Top bar with user menu
│   ├── lib/
│   │   ├── utils.ts                      # cn() helper
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser Supabase client
│   │   │   ├── server.ts                 # Server-side Supabase client
│   │   │   └── middleware.ts             # Auth middleware helper
│   │   └── constants.ts                  # AU pillars, channels, funnel stages, colors
│   └── hooks/
│       └── use-user.ts                   # Hook to get current user + profile
├── supabase/
│   └── migrations/
│       └── 001_profiles.sql              # profiles table + RLS + trigger
├── tests/
│   ├── setup.ts                          # Vitest setup
│   └── lib/
│       └── constants.test.ts             # Verify constants are correct
├── public/
│   └── fonts/                            # Oswald + Inter (self-hosted fallback)
├── package.json
├── tsconfig.json
├── next.config.ts
├── components.json
├── postcss.config.mjs
├── eslint.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── middleware.ts                          # Next.js middleware (auth redirect)
├── .env.local.example
└── .gitignore
```

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: Next.js project created with src/ directory, TypeScript, Tailwind, ESLint.

- [ ] **Step 2: Verify it runs**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML response from Next.js dev server.

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add -A
git commit -m "feat: scaffold Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 2: Configure shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/components/ui/button.tsx`

- [ ] **Step 1: Initialize shadcn**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx shadcn@latest init -y -s base-nova
```

Expected: `components.json` created with `style: "base-nova"`, `rsc: true`.

- [ ] **Step 2: Add core UI components**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx shadcn@latest add button input card badge avatar dropdown-menu separator tooltip dialog sheet tabs -y
```

Expected: Components added to `src/components/ui/`.

- [ ] **Step 3: Verify components.json matches AU projects**

Read `components.json` and confirm:
- `style: "base-nova"`
- `rsc: true`
- `tsx: true`
- `tailwind.baseColor: "neutral"`
- `tailwind.cssVariables: true`
- `iconLibrary: "lucide"`
- Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add -A
git commit -m "feat: configure shadcn/ui with base-nova style and core components"
```

---

### Task 3: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm install @supabase/supabase-js@^2 @supabase/ssr framer-motion resend
```

- [ ] **Step 2: Install dev dependencies**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add package.json package-lock.json
git commit -m "feat: add Supabase, Resend, Framer Motion, Vitest, Playwright deps"
```

---

### Task 4: AU Brand Theme (globals.css + layout.tsx)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace globals.css with AU theme**

Write `src/app/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

:root {
  /* AU Brand Colors */
  --au-teal: #2AB9B0;
  --au-green: #8ED16A;
  --au-orange: #F28C28;
  --au-yellow: #F8CE30;
  --au-charcoal: #333333;

  /* Theme tokens (light) */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.637 0.124 182.5);  /* Teal-based */
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.637 0.124 182.5);  /* Teal-based */
  --radius: 0.625rem;

  /* Chart colors mapped to AU palette */
  --chart-1: var(--au-teal);
  --chart-2: var(--au-green);
  --chart-3: var(--au-orange);
  --chart-4: var(--au-yellow);
  --chart-5: var(--au-charcoal);

  /* Sidebar */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.637 0.124 182.5);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.637 0.124 182.5);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.687 0.134 182.5);  /* Teal lighter for dark */
  --primary-foreground: oklch(0.145 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.3 0 0);
  --input: oklch(0.3 0 0);
  --ring: oklch(0.687 0.134 182.5);

  --sidebar: oklch(0.175 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.687 0.134 182.5);
  --sidebar-primary-foreground: oklch(0.145 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.3 0 0);
  --sidebar-ring: oklch(0.687 0.134 182.5);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  }
}
```

- [ ] **Step 2: Update layout.tsx with AU fonts**

Write `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AU Marketing Command Center",
  description: "Advertising Unplugged — Clarity Over Noise",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify dev server renders with new theme**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML loads without errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: apply AU brand theme with Oswald + Inter fonts and teal primary"
```

---

### Task 5: Shared Constants

**Files:**
- Create: `src/lib/constants.ts`
- Create: `tests/lib/constants.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/lib/constants.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { AU_PILLARS, AU_CHANNELS, FUNNEL_STAGES, CONTENT_TYPES } from "@/lib/constants";

describe("AU Constants", () => {
  it("has 6 content pillars", () => {
    expect(AU_PILLARS).toHaveLength(6);
    expect(AU_PILLARS.map((p) => p.id)).toEqual([
      "library", "challenge", "circle", "stage", "summit", "stories",
    ]);
  });

  it("has all publishing channels", () => {
    expect(AU_CHANNELS.map((c) => c.id)).toEqual([
      "linkedin", "email", "youtube", "instagram", "blog", "podcast",
    ]);
  });

  it("has funnel stages in order", () => {
    expect(FUNNEL_STAGES.map((s) => s.id)).toEqual([
      "visitor", "subscriber", "engaged", "challenge_participant",
      "circle_member", "strategy_customer", "advocate",
    ]);
  });

  it("has content types", () => {
    expect(CONTENT_TYPES.map((t) => t.id)).toEqual([
      "educational", "promotional", "community", "storytelling",
    ]);
  });

  it("channels specify publishing mode", () => {
    const linkedin = AU_CHANNELS.find((c) => c.id === "linkedin");
    expect(linkedin?.mode).toBe("direct");

    const youtube = AU_CHANNELS.find((c) => c.id === "youtube");
    expect(youtube?.mode).toBe("prep_export");
  });
});
```

- [ ] **Step 2: Configure Vitest**

Write `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Write `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/constants.test.ts
```

Expected: FAIL — cannot find `@/lib/constants`.

- [ ] **Step 4: Write the implementation**

Write `src/lib/constants.ts`:

```ts
export type Pillar = { id: string; label: string; color: string };
export type Channel = { id: string; label: string; mode: "direct" | "prep_export" };
export type FunnelStage = { id: string; label: string; order: number };
export type ContentType = { id: string; label: string; color: string };

export const AU_PILLARS: Pillar[] = [
  { id: "library", label: "Unplugged Library", color: "var(--au-teal)" },
  { id: "challenge", label: "90-Day Challenge", color: "var(--au-green)" },
  { id: "circle", label: "Unplugged Circle", color: "var(--au-orange)" },
  { id: "stage", label: "Unplugged Stage", color: "var(--au-yellow)" },
  { id: "summit", label: "Summit & Pop-Ups", color: "var(--au-teal)" },
  { id: "stories", label: "Unplugged Stories", color: "var(--au-green)" },
];

export const AU_CHANNELS: Channel[] = [
  { id: "linkedin", label: "LinkedIn", mode: "direct" },
  { id: "email", label: "Email", mode: "direct" },
  { id: "youtube", label: "YouTube", mode: "prep_export" },
  { id: "instagram", label: "Instagram", mode: "prep_export" },
  { id: "blog", label: "Blog", mode: "direct" },
  { id: "podcast", label: "Podcast", mode: "prep_export" },
];

export const FUNNEL_STAGES: FunnelStage[] = [
  { id: "visitor", label: "Visitor", order: 0 },
  { id: "subscriber", label: "Subscriber", order: 1 },
  { id: "engaged", label: "Engaged", order: 2 },
  { id: "challenge_participant", label: "Challenge Participant", order: 3 },
  { id: "circle_member", label: "Circle Member", order: 4 },
  { id: "strategy_customer", label: "AI Strategy Builder Customer", order: 5 },
  { id: "advocate", label: "Advocate", order: 6 },
];

export const CONTENT_TYPES: ContentType[] = [
  { id: "educational", label: "Educational", color: "var(--au-teal)" },
  { id: "promotional", label: "Promotional", color: "var(--au-orange)" },
  { id: "community", label: "Community", color: "var(--au-green)" },
  { id: "storytelling", label: "Storytelling", color: "var(--au-yellow)" },
];
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/constants.test.ts
```

Expected: PASS — all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add vitest.config.ts tests/ src/lib/constants.ts
git commit -m "feat: add AU constants (pillars, channels, funnel stages, content types) with tests"
```

---

### Task 6: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Create .env.local.example**

Write `.env.local.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_your-api-key

# LinkedIn (optional — direct publishing)
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Plausible (optional — analytics)
PLAUSIBLE_API_KEY=
PLAUSIBLE_SITE_ID=
```

- [ ] **Step 2: Create browser Supabase client**

Write `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create server Supabase client**

Write `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Create middleware helper**

Write `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/callback")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 5: Create Next.js middleware**

Write `middleware.ts` (project root):

```ts
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 6: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add .env.local.example src/lib/supabase/ middleware.ts
git commit -m "feat: add Supabase client (browser, server, middleware) with auth redirect"
```

---

### Task 7: Profiles Migration + RLS

**Files:**
- Create: `supabase/migrations/001_profiles.sql`

- [ ] **Step 1: Write the migration**

Write `supabase/migrations/001_profiles.sql`:

```sql
-- Profiles table extending auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  role text not null default 'community' check (role in ('owner', 'team', 'community')),
  avatar_url text,
  notification_preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Owner can see and edit all profiles
create policy "Owner full access" on public.profiles
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

-- Users can read their own profile
create policy "Users read own profile" on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile (except role)
create policy "Users update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Team members can see other team members
create policy "Team sees team" on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner', 'team')
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add supabase/
git commit -m "feat: add profiles table migration with RLS and auto-create trigger"
```

---

### Task 8: Auth Pages (Login + Callback)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/callback/route.ts`

- [ ] **Step 1: Create login page**

Write `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (!error) {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-oswald text-2xl font-bold tracking-tight">
            AU Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Clarity Over Noise
          </p>
        </div>

        {sent ? (
          <p className="text-center text-sm text-muted-foreground">
            Check your email for the magic link.
          </p>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create auth callback route**

Write `src/app/(auth)/callback/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(auth\)/
git commit -m "feat: add login page (magic link) and auth callback route"
```

---

### Task 9: Dashboard Shell (Sidebar + Topbar)

**Files:**
- Create: `src/components/sidebar.tsx`
- Create: `src/components/topbar.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/hooks/use-user.ts`

- [ ] **Step 1: Create use-user hook**

Write `src/hooks/use-user.ts`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  display_name: string | null;
  role: "owner" | "team" | "community";
  avatar_url: string | null;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { user, profile, loading };
}
```

- [ ] **Step 2: Create sidebar**

Write `src/components/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Megaphone,
  Target,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/content", label: "Content", icon: CalendarDays },
  { href: "/dashboard/funnel", label: "Funnel", icon: Target },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/crm", label: "CRM", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--au-teal)] to-[var(--au-green)] flex items-center justify-center text-sm font-bold text-white">
          AU
        </div>
        <span className="font-oswald text-lg font-semibold tracking-tight">
          Command Center
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create topbar**

Write `src/components/topbar.tsx`:

```tsx
"use client";

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
import { LogOut } from "lucide-react";

export function Topbar() {
  const { profile } = useUser();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "AU";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

- [ ] **Step 4: Create dashboard layout**

Write `src/app/(dashboard)/layout.tsx`:

```tsx
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create dashboard home page**

Write `src/app/(dashboard)/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to the AU Marketing Command Center.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update root page to redirect to dashboard**

Write `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 7: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/hooks/ src/components/sidebar.tsx src/components/topbar.tsx src/app/\(dashboard\)/ src/app/page.tsx
git commit -m "feat: add dashboard shell with sidebar, topbar, user menu, and navigation"
```

---

### Task 10: Verify Full Foundation

- [ ] **Step 1: Run linter**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm run lint
```

Expected: No errors.

- [ ] **Step 2: Run tests**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 3: Build check**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm run build
```

Expected: Build succeeds (may have warnings about missing env vars — that's fine).

- [ ] **Step 4: Commit any fixes**

If any issues arose, fix and commit:

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add -A
git commit -m "fix: resolve lint and build issues in foundation"
```
