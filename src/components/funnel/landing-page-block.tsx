import { PageBlock } from "@/lib/funnel/types";

// ─── Individual block renderers ───────────────────────────────────────────────

function HeroBlock({ content }: { content: Record<string, unknown> }) {
  const heading = content.heading as string | undefined;
  const subheading = content.subheading as string | undefined;

  return (
    <section className="bg-gradient-to-br from-au-teal to-au-green py-24 px-6 text-white text-center">
      {heading && (
        <h1 className="font-[family-name:var(--font-oswald)] text-5xl font-bold tracking-tight mb-4">
          {heading}
        </h1>
      )}
      {subheading && (
        <p className="text-xl max-w-2xl mx-auto opacity-90">{subheading}</p>
      )}
    </section>
  );
}

function TextBlock({ content }: { content: Record<string, unknown> }) {
  const html = content.html as string | undefined;
  const text = content.text as string | undefined;

  return (
    <section className="py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {html ? (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-base leading-relaxed">{text}</p>
        )}
      </div>
    </section>
  );
}

function CtaBlock({ content }: { content: Record<string, unknown> }) {
  const label = content.label as string | undefined;
  const url = content.url as string | undefined;
  const heading = content.heading as string | undefined;
  const subheading = content.subheading as string | undefined;

  return (
    <section className="py-16 px-6 text-center">
      {heading && (
        <h2 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight mb-3">
          {heading}
        </h2>
      )}
      {subheading && (
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          {subheading}
        </p>
      )}
      {label && (
        <a
          href={url ?? "#"}
          className="inline-block bg-au-orange text-white font-semibold text-lg px-8 py-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          {label}
        </a>
      )}
    </section>
  );
}

function FormBlock({
  blockId,
  content,
}: {
  blockId: string;
  content: Record<string, unknown>;
}) {
  const formId = content.form_id as string | undefined;
  const heading = content.heading as string | undefined;
  const subheading = content.subheading as string | undefined;
  const submitLabel = (content.submit_label as string | undefined) ?? "Submit";
  const showName = content.show_name !== false;

  return (
    <section className="py-16 px-6">
      <div className="max-w-lg mx-auto">
        {heading && (
          <h2 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight mb-3 text-center">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="text-base text-muted-foreground mb-8 text-center">
            {subheading}
          </p>
        )}
        {/* data-form-id is used by LPClient to intercept submission */}
        <form
          data-form-id={formId ?? blockId}
          className="space-y-4"
          aria-label="Sign up form"
        >
          {showName && (
            <div>
              <label
                htmlFor={`name-${blockId}`}
                className="block text-sm font-medium mb-1"
              >
                Name
              </label>
              <input
                id={`name-${blockId}`}
                type="text"
                name="name"
                placeholder="Your name"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-au-teal"
              />
            </div>
          )}
          <div>
            <label
              htmlFor={`email-${blockId}`}
              className="block text-sm font-medium mb-1"
            >
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id={`email-${blockId}`}
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-au-teal"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-au-orange text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

function ImageBlock({ content }: { content: Record<string, unknown> }) {
  const src = content.src as string | undefined;
  const alt = (content.alt as string | undefined) ?? "";
  const caption = content.caption as string | undefined;

  if (!src) return null;

  return (
    <section className="py-10 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto rounded-lg object-cover"
        />
        {caption && (
          <p className="text-sm text-muted-foreground mt-3">{caption}</p>
        )}
      </div>
    </section>
  );
}

function TestimonialBlock({ content }: { content: Record<string, unknown> }) {
  const quote = content.quote as string | undefined;
  const author = content.author as string | undefined;
  const role = content.role as string | undefined;

  return (
    <section className="py-14 px-6 bg-muted/40">
      <div className="max-w-2xl mx-auto text-center">
        <blockquote className="text-xl italic text-foreground leading-relaxed mb-6">
          {quote && <>&ldquo;{quote}&rdquo;</>}
        </blockquote>
        {author && (
          <cite className="not-italic">
            <span className="font-[family-name:var(--font-oswald)] font-semibold text-base">
              {author}
            </span>
            {role && (
              <span className="text-sm text-muted-foreground ml-2">
                &mdash; {role}
              </span>
            )}
          </cite>
        )}
      </div>
    </section>
  );
}

// ─── Main block dispatcher ────────────────────────────────────────────────────

export function LandingPageBlock({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "hero":
      return <HeroBlock content={block.content} />;
    case "text":
      return <TextBlock content={block.content} />;
    case "cta":
      return <CtaBlock content={block.content} />;
    case "form":
      return <FormBlock blockId={block.id} content={block.content} />;
    case "image":
      return <ImageBlock content={block.content} />;
    case "testimonial":
      return <TestimonialBlock content={block.content} />;
    default:
      return null;
  }
}
