import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

// A line of maths typeset by KaTeX, like a textbook. Wrap a part in \htmlClass{name}{...} to style it on its own.
export const Equation: React.FC<{
  tex: string;
  fontSize: number;
  style?: React.CSSProperties;
}> = ({ tex, fontSize, style }) => {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        throwOnError: false,
        trust: true,
        strict: false,
        output: "html",
      }),
    [tex],
  );
  return (
    <span
      style={{ fontSize, whiteSpace: "nowrap", ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
