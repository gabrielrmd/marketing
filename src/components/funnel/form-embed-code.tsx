"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FormEmbedCodeProps = {
  formId: string;
  siteUrl: string;
};

export function FormEmbedCode({ formId, siteUrl }: FormEmbedCodeProps) {
  const [copied, setCopied] = useState(false);

  const submitUrl = `${siteUrl}/api/forms/${formId}/submit`;

  const snippet = `<!-- Form embed: ${formId} -->
<form id="form-${formId}" style="display:flex;flex-direction:column;gap:12px;max-width:400px;">
  <input type="text" name="name" placeholder="Your name" required
    style="padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;" />
  <input type="email" name="email" placeholder="your@email.com" required
    style="padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;" />

  <!-- Cloudflare Turnstile -->
  <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY"></div>

  <button type="submit"
    style="padding:10px 20px;background:#000;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;">
    Subscribe
  </button>
  <p id="form-${formId}-msg" style="font-size:13px;margin:0;"></p>
</form>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<script>
(function() {
  var form = document.getElementById('form-${formId}');
  var msg = document.getElementById('form-${formId}-msg');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    msg.textContent = 'Submitting...';
    var data = {
      name: form.name.value,
      email: form.email.value,
      'cf-turnstile-response': form.querySelector('[name="cf-turnstile-response"]') ?
        form.querySelector('[name="cf-turnstile-response"]').value : ''
    };
    fetch('${submitUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (res.error) {
        msg.textContent = res.error;
        msg.style.color = '#c00';
      } else {
        msg.textContent = 'Thanks! You\\'re signed up.';
        msg.style.color = '#090';
        form.reset();
      }
    })
    .catch(function() {
      msg.textContent = 'Something went wrong. Please try again.';
      msg.style.color = '#c00';
    });
  });
})();
</script>`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = snippet;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Embed Code
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Code"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Paste this snippet into any HTML page to embed the form. Replace{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
            YOUR_TURNSTILE_SITE_KEY
          </code>{" "}
          with your Cloudflare Turnstile site key.
        </p>
        <pre className="w-full overflow-x-auto rounded-lg border bg-muted/50 p-4 text-xs font-mono text-muted-foreground whitespace-pre leading-relaxed">
          {snippet}
        </pre>
      </CardContent>
    </Card>
  );
}
