import { z } from "zod";
import { StyleSchema, ComponentBase } from "./designSchema";

export const CommandSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("set_style"),
    path: z.string(),
    value: StyleSchema.partial(),
  }),
  z.object({
    op: z.literal("update"),
    path: z.string(),
    value: z.record(z.string(), z.any()),
  }),
  z.object({
    op: z.literal("add_component"),
    value: ComponentBase,
  }),
  z.object({
    op: z.literal("remove_component"),
    path: z.string(),
  }),
  z.object({
    op: z.literal("move_component"),
    from: z.string(),
    to: z.string(),
    position: z.enum(["before", "after", "inside"]).default("after"),
  }),
  z.object({
    op: z.literal("replace_component"),
    path: z.string(),
    value: ComponentBase,
  }),
]);

export const CommandListSchema = z.object({
  commands: z.array(CommandSchema),
});

export type CommandList = z.infer<typeof CommandListSchema>;
export type Command = z.infer<typeof CommandSchema>;
