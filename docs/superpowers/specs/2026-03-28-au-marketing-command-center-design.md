# Advertising Unplugged — Marketing Command Center

**Date:** 2026-03-28
**Status:** Approved
**Author:** Gabriel-Adrian Eremia + Claude

## Overview

An all-in-one marketing command center for Advertising Unplugged (AU). The platform manages content creation and publishing, lead generation funnels, campaign planning with analytics, and full CRM — starting as a personal tool for Gabriel, scaling to team use, and eventually exposing read-only dashboards to AU community members (Circle/Challenge participants).

## Architecture & Tech Stack

**Approach:** Modular Monolith — single Next.js app with cleanly separated route-based modules.

```
┌─────────────────────────────────────────────┐
│              Next.js 15 App                  │
│  ┌─────────┬────────┬──────────┬─────────┐  │
│  │ Content │ Funnel │ Campaign │   CRM   │  │
│  │ Module  │ Module │  Module  │ Module  │  │
│  └────┬────┴───┬────┴────┬─────┴────┬────┘  │
│       │        │         │          │        │
│  ┌────┴────────┴─────────┴──────────┴────┐  │
│  │         Analytics Module              │  │
│  │   (cross-cutting, reads all data)     │  │
│  └───────────────┬───────────────────────┘  │
└──────────────────┼──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───┴───┐   ┌─────┴─────┐  ┌────┴─────┐
│Supabase│  │  Resend    │  │ External │
│Postgres│  │  (Email)   │  │  APIs    │
│Auth    │  │            │  │ LinkedIn │
│Storage │  │            │  │ YouTube  │
│Edge Fn │  │            │  │ Plausible│
└────────┘  └────────────┘  └──────────┘
```

**Core stack:**

- **Framework:** Next.js 15, React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui, Framer Motion
- **Database:** Supabase Postgres with Row-Level Security
- **Auth:** Supabase Auth (email + social login, role-based)
- **File Storage:** Supabase Storage
- **Email Delivery:** Resend (transactional + marketing)
- **Background Jobs:** Supabase Edge Functions + pg_cron
- **Web Analytics:** Plausible
- **Deployment:** Vercel
- **Fonts & Brand:** Oswald + Inter, AU color palette (Electric Teal #2AB9B0, Vibrant Green #8ED16A, Bold Orange #F28C28, Bright Yellow #F8CE30, Charcoal #333333), dark mode support

## Module 1: Content & Social Media Management

**Priority:** Highest — built first.

### Features

- **Content Calendar** — Monthly/weekly/daily views. Drag-and-drop scheduling. Filter by channel (LinkedIn, YouTube, Instagram, Blog, Podcast, Email). Color-coded by content type (educational, promotional, community, storytelling).
- **Content Editor** — Rich text editor with markdown support. Template system pre-loaded with AU brand voice guidelines. Version history.
- **Multi-Channel Management:**
  - LinkedIn — Direct publish via API (text posts, articles, images)
  - Email — Direct send via Resend (newsletters, sequences)
  - YouTube — Prep & export (title, description, tags, thumbnail)
  - Instagram — Prep & export (caption, hashtags, image preview at correct dimensions)
  - Blog — Direct publish (built into the platform)
  - Podcast — Episode planning & show notes
- **Asset Library** — Upload and organize images, videos, graphics. Tag and search. Auto-resize for different platforms.
- **Content Pillars** — Map content to AU's six pillars (Library, Challenge, Circle, Stage, Summit, Stories) for balanced coverage tracking.

### Data Model

| Table | Purpose |
|-------|---------|
| `content_items` | Posts, articles, episodes — status (draft/scheduled/published), channel, pillar, scheduled_at |
| `content_templates` | Reusable templates with AU brand voice |
| `assets` | Files in Supabase Storage, tagged and searchable |
| `publishing_logs` | What was published where, with API responses |
| `content_calendar_views` | Saved calendar filters/views per user |

## Module 2: Lead Generation & Funnel

**Priority:** Second — built after Content module.

### Features

- **Landing Page Builder** — Drag-and-drop builder for lead magnets, challenge signups, Circle enrollment, AI Strategy Builder promos. Pre-built AU-branded templates. Custom URLs. A/B testing (two variants, automatic winner selection).
- **Lead Magnets** — Create gated content (PDF guides, Unplugged Library templates, mini-courses). Auto-deliver via Resend on signup. Track downloads and conversion rates.
- **Email Sequences** — Visual sequence builder (trigger → delay → send → condition → branch). Pre-built sequences: welcome series, Challenge nurture, Circle upsell, AI Strategy Builder drip. Per-step analytics (open rate, click rate, unsubscribe, drop-off).
- **Form Builder** — Embeddable signup forms. Popup/slide-in/inline variants. Auto-tag contacts by source and lead magnet.
- **Conversion Tracking** — UTM parameter capture. Source attribution. Funnel visualization with stage-to-stage conversion rates.

### Data Model

| Table | Purpose |
|-------|---------|
| `landing_pages` | Page config, slug, A/B variants, status |
| `lead_magnets` | Gated assets linked to landing pages, download count |
| `email_sequences` | Sequence definition with steps, delays, conditions |
| `email_sequence_steps` | Individual emails with template and timing |
| `email_sends` | Log of every email sent, with open/click tracking |
| `form_submissions` | Form captures with UTM data and source |
| `funnel_events` | Timestamped events tracking contacts through stages |

## Module 3: Campaign Planning & Analytics

**Priority:** Third.

### Features

- **Campaign Briefs** — Structured templates per campaign type: product launch, seasonal, evergreen, event. Each captures: objective, audience segment, channels, budget, timeline, KPIs, content pieces needed. Links to content items and email sequences.
- **Budget Tracker** — Per-campaign and per-channel budgets. Actual vs. planned tracking. Monthly/quarterly rollups. Overspend alerts.
- **KPI Dashboards** — Three layers:
  - Marketing Performance: channel metrics (social engagement, email rates, website traffic, content performance by pillar)
  - Funnel Health: stage-by-stage conversion rates, drop-off heatmap, time-in-stage, cohort analysis
  - Revenue Attribution: campaign/channel/content → Challenge signups, Circle memberships, AI Strategy Builder purchases. Cost per acquisition. LTV by source.
- **Reporting** — Auto-generated weekly/monthly reports. PDF export (AU-branded). Scheduled email delivery.

### Data Model

| Table | Purpose |
|-------|---------|
| `campaigns` | Brief, objective, status, date range, budget |
| `campaign_channels` | Per-channel budget and KPI targets |
| `campaign_content` | Links campaigns to content_items and email_sequences |
| `budget_entries` | Planned vs. actual spend line items |
| `analytics_events` | Unified event stream (page views, signups, purchases, email opens) |
| `dashboard_widgets` | User-configured dashboard layouts and saved views |
| `reports` | Generated report snapshots with PDF export references |

## Module 4: CRM & Audience Management

**Priority:** Fourth.

### Features

- **Contact Database** — Unified profile per person. Auto-created from form submissions, email signups, manual entry. Profile: name, email, company, source, tags, activity timeline, funnel stage, lead score, assigned team member.
- **Pipeline View** — Kanban board with AU funnel stages: Visitor → Subscriber → Engaged → Challenge Participant → Circle Member → AI Strategy Builder Customer → Advocate. Drag-and-drop or auto-move via triggers. Filterable by segment, source, date, owner.
- **Lead Scoring** — Points-based, auto-calculated:
  - +5 downloads lead magnet
  - +10 joins 90-Day Challenge
  - +15 attends live event/webinar
  - +20 subscribes to Circle
  - +50 purchases AI Strategy Builder
  - -5 inactive 30 days
  - Thresholds: Cold (<20), Warm (20-50), Hot (50+), Customer (purchased)
  - Rules configurable.
- **Segmentation** — Dynamic segments based on tags, score, stage, activity, source. Pre-built: "Challenge-ready," "Upgrade candidates," "At-risk." Used for email targeting, dashboard filtering, content personalization.
- **Activity Timeline** — Every interaction logged: emails opened/clicked, content downloaded, pages visited, forms submitted, purchases. Team notes and tasks attached.
- **Team Features** — Assign contacts to team members. Task creation on contacts. Internal notes. Per-member activity feed.

### Data Model

| Table | Purpose |
|-------|---------|
| `contacts` | Core profile: name, email, company, source, lead_score, stage, assigned_to |
| `contact_tags` | Many-to-many tags |
| `contact_activities` | Timestamped activity log (type, metadata, linked content/email/campaign) |
| `contact_notes` | Team notes |
| `contact_tasks` | Follow-up tasks assigned to team members |
| `segments` | Dynamic segment definitions (filter rules as JSON) |
| `segment_contacts` | Materialized membership, refreshed on schedule |
| `lead_score_rules` | Configurable scoring rules (action → points) |

## Auth, Roles & Multi-Tenancy

Three roles via Supabase Auth + RLS:

| Role | Access | Use Case |
|------|--------|----------|
| **Owner** | Everything | Gabriel |
| **Team** | Content, CRM, Campaigns — scoped to assigned contacts/campaigns. No billing, roles, or integration settings. | VA, content creator, social media manager |
| **Community** | Read-only dashboards, personal analytics only. No access to AU internal CRM or campaigns. | Circle Pro members, Challenge participants |

- Invite via magic link, role assigned on accept.
- Community access tied to Circle/Challenge membership status.
- RLS on every table. Team sees only assigned data. Community sees only own data.
- Single-instance for AU. No org/workspace abstraction needed yet.

## Integrations & External APIs

### Direct Publishing (via Edge Functions)

| Service | Method | Capability |
|---------|--------|------------|
| LinkedIn | OAuth 2.0 + REST API | Publish posts/articles/images. Read engagement metrics. |
| Resend | API key | Send transactional + marketing emails. Webhooks for open/click/bounce. |
| Plausible | API key | Pull traffic, page views, referral sources into dashboards. |

### Prep & Export (no API)

| Service | How |
|---------|-----|
| YouTube | Generate formatted title, description, tags, thumbnail. Copy/download. |
| Instagram | Generate caption, hashtags, correctly-sized image preview. Copy. |

### Webhooks (Inbound)

- Resend → email events → update `email_sends` and `contact_activities`
- Stripe (future) → payment events → auto-update contact stage, log revenue

### Data Sync

- Podcast project → pull episode data for content calendar
- Eyecandy-app / AI Strategy Builder → purchase events pushed to CRM via webhook

### Scheduled Jobs (pg_cron)

- Every 15 min: publish scheduled posts to LinkedIn
- Every hour: pull LinkedIn engagement metrics
- Daily: refresh segments, recalculate lead scores, aggregate analytics
- Weekly: generate and email performance reports

## Error Handling

- **API failures:** Edge Functions retry 3x with exponential backoff. Failed publishes show "failed" status with error. Dashboard notification for manual retry.
- **Email bounces:** Resend webhooks mark contacts as bounced. Auto-suppress after 2 hard bounces. Flagged in CRM timeline.
- **Stale data:** Dashboard widgets show "last updated" timestamps. Failed cron jobs log error and alert via email.
- **Auth edge cases:** Expired magic links show "request new link" flow. Role changes take effect on next session refresh.

## Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest | Utility functions, lead score calculations, segment filter logic, data transformations |
| Component | Vitest + Testing Library | UI components (calendar, pipeline board, sequence builder, dashboard widgets) |
| Integration | Vitest + Supabase local (Docker) | API routes hitting real Supabase. RLS policy validation. Email sequence execution. |
| E2E | Playwright | Critical flows: login → create → schedule → publish. Contact → score → auto-stage. Sequence → send test email. |

**Test priorities for MVP:** RLS policies (security), funnel event tracking (revenue), content publishing flows.

## Build Order

1. Content & Social Media Module
2. Lead Generation & Funnel Module
3. Campaign Planning & Analytics Module
4. CRM & Audience Management Module

Each module is usable on its own. Analytics is cross-cutting and grows as modules are added.
