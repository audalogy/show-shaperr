import { z } from "zod";

export const StyleSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  fontScale: z.number().min(0.8).max(2).default(1),
  spacing: z.enum(["compact", "normal", "spacious"]).default("normal"),
  designStyle: z.enum(["minimal", "netflix", "uber", "default"]).optional(),
  appStyle: z.string().optional(), // For dynamic app names like "X", "Spotify", etc.
  cardStyle: z.enum(["minimal", "image-heavy", "compact"]).optional(),
});

export const ComponentBase = z.object({
  id: z.string(),
  type: z.enum(["table", "chart", "kpi", "card", "grid"]),
  props: z.record(z.string(), z.any()).default({}),
});

export const LayoutSchema = z.object({
  columns: z.number().min(1).max(3).default(1),
  order: z.array(z.string()).default([]),
});

export const DesignSchema = z.object({
  styles: StyleSchema,
  layout: LayoutSchema,
  components: z.array(ComponentBase).max(30),
});

export type Design = z.infer<typeof DesignSchema>;
export type Style = z.infer<typeof StyleSchema>;
export type Component = z.infer<typeof ComponentBase>;
export type Layout = z.infer<typeof LayoutSchema>;
