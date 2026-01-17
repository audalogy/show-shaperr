"use client";

import { Card } from "./Card";

export function Grid({ items, props }: { items: any[]; props: any }) {
  const columns = props.columns || 3;
  const gap = props.gap || "normal"; // compact, normal, spacious
  const style = props.style || "default";

  const gapClass = gap === "compact" ? "gap-2" : gap === "spacious" ? "gap-6" : "gap-4";
  const cardStyle = style === "netflix" ? "image-heavy" : style === "uber" ? "minimal" : "default";

  return (
    <Card
      items={items}
      props={{
        ...props,
        columns,
        style: cardStyle,
        imageSize: style === "netflix" ? "large" : "medium",
        showText: style !== "minimal",
      }}
    />
  );
}
