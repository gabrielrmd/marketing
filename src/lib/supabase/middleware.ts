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
    !request.nextUrl.pathname.startsWith("/callback") &&
    !request.nextUrl.pathname.startsWith("/blog") &&
    !request.nextUrl.pathname.startsWith("/lp")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Assign sticky A/B variant cookie for public landing pages
  if (request.nextUrl.pathname.startsWith("/lp/")) {
    // Extract the slug segment to build a page-scoped cookie name
    const slugSegment = request.nextUrl.pathname.split("/")[2];
    if (slugSegment) {
      // We use a generic cookie keyed to the slug (page ID not yet known here)
      const cookieName = `ab_lp_${slugSegment}`;
      const existing = request.cookies.get(cookieName);
      if (!existing) {
        const assigned = Math.random() < 0.5 ? "a" : "b";
        supabaseResponse.cookies.set(cookieName, assigned, {
          path: "/",
          maxAge: 60 * 60 * 24 * 90, // 90 days
          httpOnly: true,
          sameSite: "lax",
        });
      }
    }
  }

  return supabaseResponse;
}
