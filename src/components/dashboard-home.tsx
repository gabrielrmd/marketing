"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CalendarDays,
  Send,
  Mail,
  Globe,
  Camera,
  Megaphone,
  Target,
  Users,
  Plus,
  Sparkles,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChannelId, ContentStatus } from "@/lib/content/types";

type RecentContentItem = {
  id: string;
  title: string;
  channel: ChannelId;
  status: ContentStatus;
  created_at: string;
  scheduled_at: string | null;
};

type DashboardHomeProps = {
  recentContent: RecentContentItem[];
  hasTemplates: boolean;
  hasAssets: boolean;
  hasLeadMagnets: boolean;
};

const channelConfig: Record<
  ChannelId,
  { label: string; color: string; bg: string }
> = {
  linkedin: { label: "LinkedIn", color: "text-blue-700", bg: "bg-blue-50" },
  email: { label: "Email", color: "text-violet-700", bg: "bg-violet-50" },
  youtube: { label: "YouTube", color: "text-red-700", bg: "bg-red-50" },
  instagram: {
    label: "Instagram",
    color: "text-pink-700",
    bg: "bg-pink-50",
  },
  blog: { label: "Blog", color: "text-emerald-700", bg: "bg-emerald-50" },
  podcast: { label: "Podcast", color: "text-amber-700", bg: "bg-amber-50" },
};

const statusConfig: Record<
  ContentStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  draft: {
    label: "Draft",
    color: "text-slate-600",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  published: {
    label: "Published",
    color: "text-green-600",
    bg: "bg-green-50",
    dot: "bg-green-400",
  },
  failed: {
    label: "Failed",
    color: "text-red-600",
    bg: "bg-red-50",
    dot: "bg-red-400",
  },
};

function StepItem({
  icon,
  gradient,
  title,
  description,
  href,
  completed,
}: {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
          gradient
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {completed ? (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
          <Check className="h-3.5 w-3.5 text-green-600" />
        </div>
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}

function QuickCreateCard({
  icon,
  title,
  description,
  href,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md"
    >
      <div
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-white",
          gradient
        )}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
    </Link>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
  gradientFrom,
  gradientTo,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md"
    >
      <div
        className={cn(
          "h-24 w-full",
          `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
        )}
      >
        <div className="flex h-full items-center justify-center opacity-30">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function ContentCard({ item }: { item: RecentContentItem }) {
  const channel = channelConfig[item.channel];
  const status = statusConfig[item.status];
  const date = new Date(item.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/content/${item.id}`}
      className="group flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md"
    >
      <p className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-gray-700">
        {item.title || "Untitled"}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            channel.bg,
            channel.color
          )}
        >
          {channel.label}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            status.bg,
            status.color
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">{date}</p>
    </Link>
  );
}

export function DashboardHome({
  recentContent,
  hasTemplates,
  hasAssets,
  hasLeadMagnets,
}: DashboardHomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-teal-50/20">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Top row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Start here card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="font-[family-name:var(--font-oswald)] text-lg font-bold tracking-tight text-gray-900">
              Start here
            </h2>
            <div className="mt-4 space-y-1">
              <StepItem
                icon={<Sparkles className="h-5 w-5" />}
                gradient="bg-gradient-to-br from-[#F28C28] to-[#F8CE30]"
                title="Service"
                description="Define what you sell"
                href="/funnel/lead-magnets/new"
                completed={hasLeadMagnets}
              />
              <StepItem
                icon={<Globe className="h-5 w-5" />}
                gradient="bg-gradient-to-br from-[#2AB9B0] to-[#8ED16A]"
                title="Context"
                description="Define your brand"
                href="/content/templates"
                completed={hasTemplates}
              />
              <StepItem
                icon={<Palette className="h-5 w-5" />}
                gradient="bg-gradient-to-br from-[#8ED16A] to-[#F8CE30]"
                title="Moodboard"
                description="Define your style"
                href="/content/assets"
                completed={hasAssets}
              />
            </div>
          </div>

          {/* Calendar widget */}
          <div className="flex flex-col rounded-2xl border bg-white shadow-sm">
            <div className="p-6">
              <h2 className="font-[family-name:var(--font-oswald)] text-lg font-bold tracking-tight text-gray-900">
                Calendar
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Manage your calendar and stay on top of your work.
              </p>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2AB9B0]/10 via-[#8ED16A]/10 to-[#F8CE30]/10" />
              <CalendarDays className="relative h-16 w-16 text-[#2AB9B0]/40" />
            </div>
            <div className="p-6 pt-4">
              <Link
                href="/content"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#2AB9B0] hover:text-[#2AB9B0]/80"
              >
                View calendar
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick create */}
        <div>
          <h2 className="font-[family-name:var(--font-oswald)] text-lg font-bold tracking-tight text-gray-900">
            Quick create
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QuickCreateCard
              icon={<Send className="h-5 w-5" />}
              title="LinkedIn"
              description="Post to LinkedIn"
              href="/content/new?channel=linkedin"
              gradient="bg-gradient-to-br from-blue-600 to-blue-500"
            />
            <QuickCreateCard
              icon={<Mail className="h-5 w-5" />}
              title="Email"
              description="Write an email"
              href="/content/new?channel=email"
              gradient="bg-gradient-to-br from-violet-600 to-violet-500"
            />
            <QuickCreateCard
              icon={<Globe className="h-5 w-5" />}
              title="Blog"
              description="Write a blog post"
              href="/content/new?channel=blog"
              gradient="bg-gradient-to-br from-emerald-600 to-emerald-500"
            />
            <QuickCreateCard
              icon={<Camera className="h-5 w-5" />}
              title="Instagram"
              description="Create a post"
              href="/content/new?channel=instagram"
              gradient="bg-gradient-to-br from-pink-600 to-pink-500"
            />
          </div>
        </div>

        {/* Feature cards row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Megaphone className="h-12 w-12 text-white" />}
            title="Campaigns"
            description="Plan and track your campaigns"
            href="/campaigns"
            gradientFrom="from-[#F28C28]/20"
            gradientTo="to-[#F8CE30]/20"
          />
          <FeatureCard
            icon={<Target className="h-12 w-12 text-white" />}
            title="Funnel"
            description="Build your marketing funnel"
            href="/funnel"
            gradientFrom="from-[#2AB9B0]/20"
            gradientTo="to-[#8ED16A]/20"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-white" />}
            title="CRM"
            description="Manage your contacts"
            href="/crm"
            gradientFrom="from-[#8ED16A]/20"
            gradientTo="to-[#2AB9B0]/20"
          />
        </div>

        {/* AI prompt input */}
        <Link
          href="/content/new"
          className="group flex items-center gap-3 rounded-2xl border bg-white px-5 py-4 shadow-sm transition-all hover:border-[#2AB9B0]/40 hover:shadow-md"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2AB9B0] to-[#8ED16A]">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm text-gray-400 transition-colors group-hover:text-gray-500">
            What would you like to create?
          </span>
        </Link>

        {/* Recent content */}
        {recentContent.length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-oswald)] text-lg font-bold tracking-tight text-gray-900">
                Your Content
              </h2>
              <Link
                href="/content"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#2AB9B0] hover:text-[#2AB9B0]/80"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentContent.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
