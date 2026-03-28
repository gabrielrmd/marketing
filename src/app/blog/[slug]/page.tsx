import { createClient } from "@/lib/supabase/server";
import { tiptapToHtml } from "@/lib/content/tiptap-html";
import { notFound } from "next/navigation";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("content_items")
    .select("*")
    .eq("slug", slug)
    .eq("channel", "blog")
    .eq("status", "published")
    .single();

  if (!post) notFound();

  const html = tiptapToHtml(post.body as Record<string, unknown>);

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-[family-name:var(--font-oswald)] text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}</p>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
