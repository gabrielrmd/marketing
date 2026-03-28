type TiptapMark = { type: string; attrs?: Record<string, string | number | null> };
type TiptapNode = {
  type?: string;
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, string | number | null>;
  content?: TiptapNode[];
};

function renderNode(node: TiptapNode): string {
  if (node.type === "text") {
    let text = node.text ?? "";
    const marks = node.marks ?? [];
    for (const mark of marks) {
      if (mark.type === "bold") text = `<strong>${text}</strong>`;
      if (mark.type === "italic") text = `<em>${text}</em>`;
      if (mark.type === "link") text = `<a href="${mark.attrs?.href ?? "#"}">${text}</a>`;
    }
    return text;
  }

  const children = (node.content ?? [])
    .map(renderNode)
    .join("");

  switch (node.type) {
    case "doc": return children;
    case "paragraph": return `<p>${children}</p>`;
    case "heading": return `<h${node.attrs?.level ?? 2}>${children}</h${node.attrs?.level ?? 2}>`;
    case "bulletList": return `<ul>${children}</ul>`;
    case "orderedList": return `<ol>${children}</ol>`;
    case "listItem": return `<li>${children}</li>`;
    case "image": return `<img src="${node.attrs?.src ?? ""}" alt="${node.attrs?.alt ?? ""}" />`;
    case "blockquote": return `<blockquote>${children}</blockquote>`;
    case "codeBlock": return `<pre><code>${children}</code></pre>`;
    case "hardBreak": return "<br />";
    default: return children;
  }
}

export function tiptapToHtml(json: TiptapNode): string {
  if (!json || !json.type) return "";
  try {
    return renderNode(json);
  } catch {
    return "";
  }
}
