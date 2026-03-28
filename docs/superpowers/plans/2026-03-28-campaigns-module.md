# Campaign Planning & Analytics Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Campaign Planning & Analytics module — campaign briefs with templates, budget tracking, three-layer KPI dashboards (marketing performance with pillar coverage + website traffic, funnel health with drop-off heatmap + time-in-stage + cohort analysis, revenue attribution with LTV by source), PDF report generation, and scheduled report email delivery.

**Architecture:** Route-based module under `/dashboard/campaigns` following established patterns. Server actions (mutations) in `lib/campaigns/actions.ts`, read-only analytics queries in `lib/campaigns/queries.ts`, pure helpers in `lib/campaigns/analytics.ts`, validation in `lib/campaigns/validation.ts`. Analytics queries aggregate cross-module data (content_items, funnel_events, email_sends, contacts, form_submissions). PDF via `@react-pdf/renderer`. Report scheduling via Supabase Edge Function + pg_cron.

**Tech Stack:** Next.js 15, Supabase Postgres + RLS + Edge Functions, @react-pdf/renderer, Recharts (charts), Resend (report delivery), Vitest

**Prerequisites:** Foundation, Content Module, and Funnel Module must be complete. All migrations (001-003) applied.

---

## File Structure

```
src/
├── app/(dashboard)/campaigns/
│   ├── page.tsx                          # Campaigns list (server)
│   ├── new/page.tsx                      # Create campaign
│   ├── [id]/
│   │   ├── page.tsx                      # Campaign detail/edit
│   │   └── budget/page.tsx               # Budget tracker for campaign
│   └── analytics/
│       ├── page.tsx                      # Analytics dashboard (server)
│       └── analytics-client.tsx          # Client dashboard with tab switching
├── components/campaigns/
│   ├── campaign-card.tsx                 # Campaign summary card
│   ├── campaign-form.tsx                 # Campaign brief form (create/edit)
│   ├── budget-table.tsx                  # Budget entries table with add/edit
│   ├── budget-summary.tsx               # Budget rollup (planned vs actual)
│   ├── kpi-card.tsx                      # Single KPI metric card
│   ├── channel-performance.tsx           # Channel metrics chart (Recharts)
│   ├── pillar-performance.tsx            # Content performance by pillar (Recharts)
│   ├── funnel-health-chart.tsx           # Stage conversion + drop-off heatmap
│   ├── time-in-stage.tsx                 # Average time contacts spend in each stage
│   ├── cohort-chart.tsx                  # Cohort retention analysis (Recharts)
│   ├── attribution-table.tsx             # Revenue attribution + LTV table
│   ├── report-generator.tsx              # PDF report generation + scheduling UI
│   └── date-range-picker.tsx             # Date range selector
├── lib/campaigns/
│   ├── types.ts                          # TypeScript types
│   ├── validation.ts                     # Pure validation functions
│   ├── actions.ts                        # Server actions (mutations only)
│   ├── queries.ts                        # Read-only analytics queries (server)
│   ├── analytics.ts                      # Pure analytics helper functions
│   └── pdf-report.tsx                    # @react-pdf/renderer document template
supabase/
├── migrations/
│   └── 004_campaigns.sql                 # Campaign tables + RLS + report_schedules
└── functions/
    └── send-scheduled-reports/index.ts   # Edge Function for scheduled report delivery
tests/
├── lib/campaigns/
│   ├── validation.test.ts
│   └── analytics.test.ts
```

---

### Task 1: Campaigns Database Migration

**Files:**
- Create: `supabase/migrations/004_campaigns.sql`

- [ ] **Step 1: Write the migration**

Include all 7 tables from the spec (campaigns, campaign_channels, campaign_content, budget_entries, analytics_events, dashboard_widgets, reports) PLUS a `report_schedules` table for automated report delivery. Use unique policy names per table (e.g., "Campaigns owner full access" not just "Owner full access") to match improved naming hygiene.

Key details:
- `analytics_events` includes `revenue decimal(10,2)` for attribution
- `reports` includes `pdf_path text` for Supabase Storage reference
- `report_schedules` includes `frequency` (weekly/monthly), `recipients` (text array of emails), `next_run_at` timestamptz, `enabled` boolean
- All tables get RLS with owner full access + team read
- `analytics_events` gets public insert policy (for tracking)
- Timestamps triggers using existing `update_updated_at()` function

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add supabase/migrations/004_campaigns.sql
git commit -m "feat: add campaigns migration with budgets, analytics events, reports, report schedules"
```

---

### Task 2: Types & Install Dependencies

**Files:**
- Create: `src/lib/campaigns/types.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm install @react-pdf/renderer recharts
```

- [ ] **Step 2: Write types matching migration schema**

Include: Campaign, CampaignChannel, CampaignContent, BudgetEntry, AnalyticsEvent, DashboardWidget, Report, ReportSchedule, and all union types.

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/campaigns/types.ts package.json package-lock.json
git commit -m "feat: add campaign types, install @react-pdf/renderer and recharts"
```

---

### Task 3: Validation & Analytics Helpers (TDD)

**Files:**
- Create: `src/lib/campaigns/validation.ts`
- Create: `src/lib/campaigns/analytics.ts`
- Create: `tests/lib/campaigns/validation.test.ts`
- Create: `tests/lib/campaigns/analytics.test.ts`

- [ ] **Step 1: Write validation tests**

Tests for:
- `validateCampaign({ title, campaign_type, start_date, end_date })` — title required, valid type, end after start
- `validateBudgetEntry({ description, amount, entry_type })` — description required, amount positive, valid type

- [ ] **Step 2: Write analytics tests**

Tests for:
- `calculateBudgetRollup(entries)` — sums planned vs actual, calculates variance + percentage
- `calculateChannelPerformance(events)` — groups by channel, counts impressions/clicks/conversions
- `calculateFunnelConversions(contacts)` — counts per stage, calculates stage-to-stage conversion rates
- `calculateDropOffRates(stageData)` — percentage lost between each stage pair
- `calculateTimeInStage(contacts)` — average days per contact in each stage (using updated_at - created_at or stage change timestamps)
- `calculateCohortRetention(contacts, periodDays)` — groups contacts by signup month, tracks which stages they've reached
- `calculateCostPerAcquisition(spend, conversions)` — handles zero division
- `calculateLTV(revenue, customers)` — average revenue per customer, handles zero
- `calculatePillarPerformance(contentItems)` — groups by pillar, counts published items per pillar

- [ ] **Step 3: Run tests — verify fail**
- [ ] **Step 4: Write validation.ts**
- [ ] **Step 5: Write analytics.ts** — pure functions, no Supabase. All functions listed above.
- [ ] **Step 6: Run tests — verify pass**
- [ ] **Step 7: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/campaigns/validation.ts src/lib/campaigns/analytics.ts tests/lib/campaigns/
git commit -m "feat: add campaign validation and analytics helpers (budget, funnel, cohort, LTV, pillar) with tests"
```

---

### Task 4: Campaign Server Actions (Mutations)

**Files:**
- Create: `src/lib/campaigns/actions.ts`

- [ ] **Step 1: Write server actions (mutations only)**

Follow `lib/content/actions.ts` pattern. Include:
- Campaigns: `createCampaign` (calls `validateCampaign`), `updateCampaign`, `getCampaigns`, `getCampaign`, `deleteCampaign`
- Campaign channels: `addCampaignChannel`, `updateCampaignChannel`, `getCampaignChannels`
- Campaign content: `linkContent`, `unlinkContent`, `getCampaignContent`
- Budget: `addBudgetEntry` (calls `validateBudgetEntry`), `updateBudgetEntry`, `deleteBudgetEntry`, `getBudgetEntries`
- Reports: `createReport`, `getReports`, `getReport`, `updateReport`
- Report schedules: `createReportSchedule`, `updateReportSchedule`, `getReportSchedules`, `deleteReportSchedule`

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/campaigns/actions.ts
git commit -m "feat: add campaign server actions for CRUD, budget, reports, and schedules"
```

---

### Task 5: Analytics Queries (Read-Only Server Functions)

**Files:**
- Create: `src/lib/campaigns/queries.ts`

- [ ] **Step 1: Write analytics queries**

"use server" file with read-only cross-module queries:

- `getMarketingPerformance(dateFrom, dateTo)` — queries:
  - `content_items`: published count by pillar (pillar performance)
  - `email_sends`: count sent/opened/clicked for open rate + click rate
  - `analytics_events`: grouped by channel for engagement metrics
  - `form_submissions`: total in date range
  - Returns: { contentByPillar, emailStats, channelMetrics, websiteTraffic (from analytics_events where event_type = 'page_view'), totalSubmissions }

- `getFunnelHealth()` — queries:
  - `contacts`: count per stage for distribution
  - `contacts`: avg(updated_at - created_at) grouped by stage for time-in-stage
  - `funnel_events`: conversion events for drop-off rates
  - `contacts`: grouped by created_at month + current stage for cohort analysis
  - Returns: { stageDistribution, timeInStage, dropOffRates, cohortData }

- `getRevenueAttribution(dateFrom, dateTo)` — queries:
  - `analytics_events` where revenue is not null: grouped by campaign/channel/source
  - Calculates CPA (spend/conversions) and LTV (total revenue / unique customers)
  - Returns: { attributionBySource, attributionByCampaign, attributionByChannel, overallLTV }

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/campaigns/queries.ts
git commit -m "feat: add analytics queries with pillar performance, funnel health, cohort, LTV, and attribution"
```

---

### Task 6: PDF Report Template

**Files:**
- Create: `src/lib/campaigns/pdf-report.tsx`

- [ ] **Step 1: Write AU-branded PDF report**

Using `@react-pdf/renderer`:
- Register Oswald + Inter fonts from Google Fonts
- Header: "AU Marketing Report" + date range, AU brand colors
- Summary: key metrics (content published, email open rate, submissions, total spend)
- Channel Performance table
- Funnel stage distribution
- Budget: planned vs actual with variance
- Footer: "Advertising Unplugged — Clarity Over Noise"

Export `AUReport` component.

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/campaigns/pdf-report.tsx
git commit -m "feat: add AU-branded PDF report template"
```

---

### Task 7: Campaigns List & Create Pages

**Files:**
- Create: `src/app/(dashboard)/campaigns/page.tsx`
- Create: `src/app/(dashboard)/campaigns/new/page.tsx`
- Create: `src/components/campaigns/campaign-card.tsx`
- Create: `src/components/campaigns/campaign-form.tsx`

- [ ] **Step 1: Write campaign card** — title, type badge, status badge, dates, budget
- [ ] **Step 2: Write campaign form** — all fields, used for create + edit
- [ ] **Step 3: Write list page** (server) — calls `getCampaigns()`, grid of cards
- [ ] **Step 4: Write create page** ("use client") — form + save via `createCampaign`
- [ ] **Step 5: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/campaigns/page.tsx src/app/\(dashboard\)/campaigns/new/ src/components/campaigns/campaign-card.tsx src/components/campaigns/campaign-form.tsx
git commit -m "feat: add campaigns list and create pages"
```

---

### Task 8: Campaign Detail & Budget Pages

**Files:**
- Create: `src/app/(dashboard)/campaigns/[id]/page.tsx`
- Create: `src/app/(dashboard)/campaigns/[id]/budget/page.tsx`
- Create: `src/components/campaigns/budget-table.tsx`
- Create: `src/components/campaigns/budget-summary.tsx`

- [ ] **Step 1: Write budget table** — editable, add/delete rows
- [ ] **Step 2: Write budget summary** — planned vs actual, variance, overspend alert
- [ ] **Step 3: Write campaign detail** — editable form, linked content, budget summary
- [ ] **Step 4: Write budget page** — full budget management
- [ ] **Step 5: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/campaigns/\\[id\\]/ src/components/campaigns/budget-table.tsx src/components/campaigns/budget-summary.tsx
git commit -m "feat: add campaign detail and budget tracking pages"
```

---

### Task 9: KPI Dashboard Components

**Files:**
- Create: `src/components/campaigns/kpi-card.tsx`
- Create: `src/components/campaigns/channel-performance.tsx`
- Create: `src/components/campaigns/pillar-performance.tsx`
- Create: `src/components/campaigns/funnel-health-chart.tsx`
- Create: `src/components/campaigns/time-in-stage.tsx`
- Create: `src/components/campaigns/cohort-chart.tsx`
- Create: `src/components/campaigns/attribution-table.tsx`
- Create: `src/components/campaigns/date-range-picker.tsx`

- [ ] **Step 1: Write KPI card** — metric name, value, trend arrow + percentage
- [ ] **Step 2: Write channel performance** — Recharts BarChart per channel, AU colors
- [ ] **Step 3: Write pillar performance** — Recharts BarChart grouping content by AU pillar
- [ ] **Step 4: Write funnel health chart** — stage bars + drop-off percentages between stages (heatmap-style color: green → yellow → red based on drop-off severity)
- [ ] **Step 5: Write time-in-stage** — horizontal bar chart showing average days per stage
- [ ] **Step 6: Write cohort chart** — Recharts heatmap/table showing signup month vs stage reached, color intensity = retention %
- [ ] **Step 7: Write attribution table** — source, conversions, revenue, CPA, LTV columns. Sortable.
- [ ] **Step 8: Write date range picker** — two date inputs + presets (7d, 30d, this month, last quarter)
- [ ] **Step 9: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/campaigns/
git commit -m "feat: add KPI dashboard components (channel, pillar, funnel, cohort, attribution, time-in-stage)"
```

---

### Task 10: Analytics Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/campaigns/analytics/page.tsx`
- Create: `src/app/(dashboard)/campaigns/analytics/analytics-client.tsx`

- [ ] **Step 1: Write server page** — fetches initial data from all three queries
- [ ] **Step 2: Write client page** — tabbed interface (shadcn Tabs):

**Performance tab:**
- KPI cards: content published, email open rate, website page views, total submissions
- ChannelPerformance chart
- PillarPerformance chart
- DateRangePicker

**Funnel Health tab:**
- FunnelHealthChart (with drop-off heatmap)
- TimeInStage chart
- CohortChart

**Attribution tab:**
- KPI cards: total revenue, avg CPA, overall LTV, top channel
- AttributionTable
- DateRangePicker

Date range changes trigger refresh via `useTransition`.

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/campaigns/analytics/
git commit -m "feat: add three-layer analytics dashboard with performance, funnel, and attribution tabs"
```

---

### Task 11: Report Generation, PDF Export & Scheduling

**Files:**
- Create: `src/components/campaigns/report-generator.tsx`
- Create: `supabase/functions/send-scheduled-reports/index.ts`

- [ ] **Step 1: Write report generator component**

"use client". Shows:
1. Date range picker + report type selector
2. "Generate Report" button → creates report record, renders PDF via `@react-pdf/renderer`, uploads to Supabase Storage, updates report with pdf_path
3. Past reports list with download links
4. "Email Report" button → sends PDF via Resend
5. Schedule section: frequency (weekly/monthly), recipients (email input), enable/disable toggle. Creates/updates report_schedule.

- [ ] **Step 2: Write scheduled reports Edge Function**

`supabase/functions/send-scheduled-reports/index.ts` — Deno Edge Function:
1. Queries `report_schedules` where `enabled = true` and `next_run_at <= now()`
2. For each schedule: generates report data, creates PDF, sends via Resend to recipients
3. Updates `next_run_at` (weekly = +7 days, monthly = +1 month)
4. Include pg_cron setup comment

- [ ] **Step 3: Add report generator to analytics page**

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/campaigns/report-generator.tsx supabase/functions/send-scheduled-reports/ src/app/\(dashboard\)/campaigns/analytics/analytics-client.tsx
git commit -m "feat: add PDF report generation, email delivery, and scheduled report automation"
```

---

### Task 12: Verify Campaigns Module

- [ ] **Step 1: Run linter** — `npm run lint`
- [ ] **Step 2: Run all tests** — `npx vitest run`
- [ ] **Step 3: Build check** — `npm run build`
- [ ] **Step 4: Fix issues and commit specific files**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add [specific files]
git commit -m "fix: resolve lint and build issues in campaigns module"
```
