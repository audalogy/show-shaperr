"use client";

export function Card({ items, props }: { items: any[]; props: any }) {
  const style = props.style || "default";
  const limit = props.limit || 20;
  const sortBy = props.sortBy;
  const showText = props.showText !== false; // Default true
  const imageSize = props.imageSize || "medium"; // small, medium, large

  let data = items ?? [];
  
  // Apply sorting
  if (sortBy) {
    data = [...data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortBy === "premiered") {
        const aDate = aVal ? new Date(aVal).getTime() : 0;
        const bDate = bVal ? new Date(bVal).getTime() : 0;
        return bDate - aDate;
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return bVal - aVal;
      }
      
      return (bVal ?? 0) - (aVal ?? 0);
    });
  }
  
  // Apply limit
  data = data.slice(0, limit);

  const imageHeight = imageSize === "large" ? "h-64" : imageSize === "small" ? "h-32" : "h-48";
  const cardPadding = style === "minimal" ? "p-2" : "p-4";

  return (
    <div className="rounded border overflow-hidden">
      <div className={`grid ${props.columns ? `grid-cols-${props.columns}` : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"} gap-4 ${cardPadding}`}>
        {data.map((item) => (
          <div
            key={item.id}
            className={`rounded border overflow-hidden ${style === "minimal" ? "shadow-sm" : "shadow-md"} hover:shadow-lg transition-shadow`}
          >
            {item.image && (
              <div className={`relative w-full ${imageHeight} bg-gray-200`}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {showText && (
              <div className={`${cardPadding} ${style === "minimal" ? "space-y-1" : "space-y-2"}`}>
                <h3 className={`font-semibold ${style === "minimal" ? "text-sm" : "text-base"} truncate`}>
                  {item.title}
                </h3>
                {style !== "minimal" && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    {item.rating && (
                      <span>⭐ {item.rating.toFixed(1)}</span>
                    )}
                    {item.premiered && (
                      <span>{new Date(item.premiered).getFullYear()}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
