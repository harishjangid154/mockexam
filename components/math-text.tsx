"use client";

import { InlineMath } from "react-katex";

type MathTextProps = {
  text: string;
  className?: string;
};

export function MathText({ text, className }: MathTextProps) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={`${part}-${index}`} math={part.slice(1, -1)} />;
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </span>
  );
}
