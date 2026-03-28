function renderNode(node: Record<string, unknown>): string {
  if (node.type === "text") {
    let text = (node.text as string) ?? "";
    const marks = (node.marks as Array<{ type: string }>) ?? [];
    for (const mark of marks) {
      if (mark.type === "bold") text = `<strong>${text}</strong>`;
      if (mark.type === "italic") text = `<em>${text}</em>`;
      if (mark.type === "link") text = `<a href="${(mark as any).attrs?.href ?? "#"}">${text}</a>`;
    }
    return text;
  }

  const children = ((node.content as Record<string, unknown>[]) ?? [])
    .map(renderNode)
    .join("");

  switch (node.type) {
    case "doc": return children;
    case "paragraph": return `<p>${children}</p>`;
    case "heading": return `<h${(node.attrs as any)?.level ?? 2}>${children}</h${(node.attrs as any)?.level ?? 2}>`;
    case "bulletList": return `<ul>${children}</ul>`;
    case "orderedList": return `<ol>${children}</ol>`;
    case "listItem": return `<li>${children}</li>`;
    case "image": return `<img src="${(node.attrs as any)?.src ?? ""}" alt="${(node.attrs as any)?.alt ?? ""}" />`;
    case "blockquote": return `<blockquote>${children}</blockquote>`;
    case "codeBlock": return `<pre><code>${children}</code></pre>`;
    case "hardBreak": return "<br />";
    default: return children;
  }
}

export function tiptapToHtml(json: Record<string, unknown>): string {
  if (!json || !json.type) return "";
  try {
    return renderNode(json);
  } catch {
    return "";
  }
}
