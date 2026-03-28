import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PageBlock } from "@/lib/funnel/types";
import { LandingPageBlock } from "@/components/funnel/landing-page-block";
import { LPClient } from "./lp-client";

export default async function LandingPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── 1. Load published landing page ────────────────────────────────────────
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!page) notFound();

  // ── 2. Sticky A/B variant ─────────────────────────────────────────────────
  // Middleware sets `ab_lp_<slug>` before the page renders; here we just read.
  // Fallback: also check the page-ID-scoped cookie for future-proofing.
  const cookieStore = await cookies();

  const slugCookieName = `ab_lp_${slug}`;
  const idCookieName = `ab_variant_${page.id}`;

  const rawVariant =
    cookieStore.get(idCookieName)?.value ??
    cookieStore.get(slugCookieName)?.value ??
    "a";

  const variant: "a" | "b" = rawVariant === "b" ? "b" : "a";

  // ── 3. Select blocks for this variant ─────────────────────────────────────
  const blocks: PageBlock[] =
    variant === "b" && page.ab_test_active && page.variant_b_blocks
      ? (page.variant_b_blocks as PageBlock[])
      : (page.blocks as PageBlock[]);

  // ── 4. Increment visitor counter ─────────────────────────────────────────
  const visitorField = variant === "b" ? "visitors_b" : "visitors_a";
  await supabase.rpc("increment_field", {
    p_table: "landing_pages",
    p_id: page.id,
    p_field: visitorField,
  });

  // ── 5. Find form block to wire up LPClient ────────────────────────────────
  const formBlock = blocks.find((b) => b.type === "form");
  const formId = formBlock
    ? ((formBlock.content.form_id as string | undefined) ?? null)
    : null;

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  // ── 6. Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <main>
        {blocks.map((block) => (
          <LandingPageBlock key={block.id} block={block} />
        ))}
      </main>

      {/* Client wrapper: Turnstile + form submission + UTM tracking */}
      <LPClient
        formId={formId}
        variant={variant}
        siteKey={siteKey}
        pageId={page.id}
      />
    </>
  );
}
