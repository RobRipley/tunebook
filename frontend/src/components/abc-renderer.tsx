import { useEffect, useRef } from "react";
import abcjs from "abcjs";

type AbcRendererProps = {
  abc: string;
  preview?: boolean;
};

function cleanAbcForPreview(abc: string): string {
  // Strip W: (words), B: (book), Z: (transcriber), F: (file URL), C: (composer), O: (origin) lines
  // Keep only essential fields: X, T, R, M, L, Q, K, and the music notation
  return abc
    .split("\n")
    .filter((line) => !line.match(/^[WBZFCO]:/))
    .join("\n");
}

export function AbcRenderer({ abc, preview = false }: AbcRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !abc) return;
    const notation = preview ? cleanAbcForPreview(abc) : abc;
    abcjs.renderAbc(ref.current, notation, {
      responsive: "resize",
      staffwidth: preview ? 300 : undefined,
      paddingtop: 0,
      paddingbottom: 0,
      paddingleft: 0,
      paddingright: 0,
    });
  }, [abc, preview]);

  return (
    <div
      ref={ref}
      className={preview ? "max-h-20 overflow-hidden" : ""}
    />
  );
}
