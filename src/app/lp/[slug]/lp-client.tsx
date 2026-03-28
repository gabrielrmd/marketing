"use client";

import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

interface LPClientProps {
  formId: string | null;
  variant: "a" | "b";
  siteKey: string;
  pageId: string;
}

export function LPClient({ formId, variant, siteKey, pageId }: LPClientProps) {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    if (!formId) return;

    // Collect UTM params from URL
    const searchParams = new URLSearchParams(window.location.search);
    const utmParams = {
      utm_source: searchParams.get("utm_source") ?? undefined,
      utm_medium: searchParams.get("utm_medium") ?? undefined,
      utm_campaign: searchParams.get("utm_campaign") ?? undefined,
      utm_content: searchParams.get("utm_content") ?? undefined,
      utm_term: searchParams.get("utm_term") ?? undefined,
    };

    // Find all forms with data-form-id matching our formId
    const forms = document.querySelectorAll<HTMLFormElement>(
      `form[data-form-id="${formId}"]`
    );

    const handleSubmit = async (e: SubmitEvent) => {
      e.preventDefault();
      if (isSubmitting || submitted) return;

      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);

      const email = formData.get("email") as string | null;
      const name = formData.get("name") as string | null;

      if (!email) {
        setError("Email is required.");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const body: Record<string, unknown> = {
          email,
          name: name ?? undefined,
          variant,
          landing_page_id: pageId,
          ...utmParams,
        };

        if (turnstileToken) {
          body.turnstile_token = turnstileToken;
        }

        const res = await fetch(`/api/forms/${formId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Submission failed. Please try again.");
        }

        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        // Reset Turnstile on error so user can try again
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      } finally {
        setIsSubmitting(false);
      }
    };

    forms.forEach((form) => {
      form.addEventListener("submit", handleSubmit);
    });

    return () => {
      forms.forEach((form) => {
        form.removeEventListener("submit", handleSubmit);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, variant, pageId, turnstileToken, submitted]);

  if (!formId) return null;

  if (submitted) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-au-teal text-white px-6 py-4 rounded-lg shadow-lg max-w-sm">
        <p className="font-semibold">You&apos;re in!</p>
        <p className="text-sm opacity-90 mt-1">
          Thanks for signing up. Check your inbox.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Invisible Turnstile widget */}
      <div className="sr-only" aria-hidden>
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
          options={{ size: "invisible" }}
        />
      </div>

      {/* Inline error toast */}
      {error && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 bg-destructive text-destructive-foreground px-6 py-4 rounded-lg shadow-lg max-w-sm"
        >
          <p className="font-semibold">Submission error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loading overlay — prevents double-submission */}
      {isSubmitting && (
        <div
          aria-live="polite"
          className="fixed inset-0 z-40 bg-background/60 flex items-center justify-center"
        >
          <p className="text-lg font-medium animate-pulse">Submitting…</p>
        </div>
      )}
    </>
  );
}
