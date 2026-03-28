import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BlogIndexPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("content_items")
    .select("id, title, slug, body_text, published_at, pillar")
    .eq("channel", "blog")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-[family-name:var(--font-oswald)] text-4xl font-bold tracking-tight mb-8">Blog</h1>
      <div className="space-y-8">
        {(posts ?? []).map((post) => (
          <article key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group">
              <h2 className="font-[family-name:var(--font-oswald)] text-2xl font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
              <p className="mt-2 text-muted-foreground line-clamp-3">{post.body_text}</p>
              <p className="mt-1 text-xs text-muted-foreground">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
