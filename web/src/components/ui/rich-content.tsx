import { useEffect, useRef } from "react";
import katex from "katex";

export function RichContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const selector = '[data-type="inline-math"], [data-type="block-math"]';
    ref.current.querySelectorAll(selector).forEach((el) => {
      const latex = el.getAttribute("data-latex") || el.textContent || "";
      if (!latex) return;
      try {
        const isBlock = el.getAttribute("data-type") === "block-math";
        const rendered = katex.renderToString(latex, {
          displayMode: isBlock,
          throwOnError: false,
        });
        el.innerHTML = rendered;
      } catch {
        el.textContent = latex;
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
