import { useEffect, useRef } from "react";
import abcjs from "abcjs";

type AbcRendererProps = {
  abc: string;
  preview?: boolean;
};

export function AbcRenderer({ abc, preview = false }: AbcRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !abc) return;
    abcjs.renderAbc(ref.current, abc, {
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
