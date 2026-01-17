import { z } from "zod";

const PresetStyleSchema = z.object({
  theme: z.enum(["light", "dark"]),
  fontScale: z.number().min(0.8).max(2),
  appClass: z.string().optional(),
  cardClass: z.string().optional(),
  tableClass: z.string().optional(),
  chartClass: z.string().optional(),
});

const PresetLayoutSchema = z.object({
  columns: z.number().min(1).max(3),
  suggestedOrder: z.array(z.string()).optional(),
});

const ComponentOverrideSchema = z.object({
  id: z.string(),
  type: z.enum(["table", "chart", "kpi", "card", "grid"]).optional(),
  props: z.record(z.string(), z.any()).optional(),
});

const PresetSchema = z.object({
  styles: PresetStyleSchema,
  layout: PresetLayoutSchema,
  componentOverrides: z.array(ComponentOverrideSchema).optional(),
});

export const PRESETS = {
  spotify: {
    styles: {
      theme: "dark" as const,
      fontScale: 1,
      appClass: "bg-black text-white",
      cardClass: "bg-gray-900 rounded-lg border-green-500",
      tableClass: "bg-black text-white border-green-500",
      chartClass: "bg-black text-[#1DB954]", // Spotify green
    },
    layout: {
      columns: 1, // Vertical list format
      suggestedOrder: ["table1", "chart1", "kpi1"], // List style
    },
    componentOverrides: [], // Keep table as-is for list format
  },
  doordash: {
    styles: {
      theme: "light" as const,
      fontScale: 1,
      appClass: "bg-white text-gray-900",
      cardClass: "bg-white rounded-lg border-red-400 shadow-sm",
      tableClass: "bg-white text-gray-900 border-[#FF3008]", // DoorDash red
      chartClass: "bg-white text-[#FF3008]",
    },
    layout: {
      columns: 2, // 2-column card list
      suggestedOrder: ["table1", "card1", "chart1"],
    },
    componentOverrides: [],
  },
  uber: {
    styles: {
      theme: "light" as const,
      fontScale: 1,
      appClass: "bg-white text-black",
      cardClass: "bg-gray-50 rounded-lg border-gray-200 shadow-sm",
      tableClass: "bg-white text-black border-gray-200",
      chartClass: "bg-white text-black",
    },
    layout: {
      columns: 1, // Minimal single column
      suggestedOrder: ["table1", "kpi1", "chart1"], // Clean list
    },
    componentOverrides: [],
  },
  netflix: {
    styles: {
      theme: "dark" as const,
      fontScale: 1,
      appClass: "bg-[#141414] text-white",
      cardClass: "bg-gray-900 rounded border-red-600",
      tableClass: "bg-[#141414] text-white border-red-600",
      chartClass: "bg-[#141414] text-[#E50914]", // Netflix red
    },
    layout: {
      columns: 1, // Single column with card grid inside
      suggestedOrder: ["card1", "chart1", "kpi1"], // Card grid first
    },
    componentOverrides: [
      // Optionally convert table to card grid for Netflix-style
      { id: "table1", type: "card" as const, props: { style: "image-heavy", columns: 3 } },
    ],
  },
  applemusic: {
    styles: {
      theme: "dark" as const,
      fontScale: 1.1,
      appClass: "bg-gray-950 text-white",
      cardClass: "bg-gray-900 rounded-xl border-pink-500",
      tableClass: "bg-gray-900 text-white border-pink-500",
      chartClass: "bg-gray-900 text-pink-500",
    },
    layout: {
      columns: 2, // Grid of album cards
      suggestedOrder: ["card1", "chart1", "table1"],
    },
    componentOverrides: [],
  },
  youtube: {
    styles: {
      theme: "light" as const,
      fontScale: 1,
      appClass: "bg-white text-gray-900",
      cardClass: "bg-white rounded-lg border-red-500 shadow-sm",
      tableClass: "bg-white text-gray-900 border-red-500",
      chartClass: "bg-white text-[#FF0000]", // YouTube red
    },
    layout: {
      columns: 3, // Thumbnail grid format
      suggestedOrder: ["card1", "chart1", "table1"], // Cards first
    },
    componentOverrides: [],
  },
} as const satisfies Record<string, z.infer<typeof PresetSchema>>;

export type PresetKey = keyof typeof PRESETS;
