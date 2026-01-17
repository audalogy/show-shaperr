import { cn } from "@/lib/utils";

export function KPI({ summary, items, props }: { summary: any; items?: any[]; props: any }) {
  const label = props.label ?? "Total";
  const className = props.className || "";
  
  // Use filtered count if items are provided and KPI should reflect table filtering
  // Otherwise use summary.total
  let value = summary?.total ?? 0;
  
  if (props.useFilteredCount && items) {
    // If KPI is configured to use filtered count (e.g., "Show filtered count"),
    // we'd need table props passed, but for now default to summary.total
    value = items.length;
  }

  return (
    <div className={cn("rounded border p-4 flex items-center justify-between", className)}>
      <div className="text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
