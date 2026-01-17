import { NextRequest, NextResponse } from "next/server";
import { CommandListSchema } from "@/lib/commandsSchema";
import { RateLimiterMemory } from "rate-limiter-flexible";

const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

const SYSTEM_PROMPT = `
You translate natural language design requests into a strict JSON command list that mutates a UI schema.
Rules:
Output ONLY valid JSON matching { "commands": Command[] }.
Use only whitelisted ops: set_style, update, add_component, remove_component, move_component, replace_component.
Paths support JSONPath ($.styles, $.layout, $.components[?(@.id=="chart1")]) and shorthand /components[id=chart1].
Prefer concise changes; do not exceed 30 components total.

Command structure requirements:
- set_style: { "op": "set_style", "path": string, "value": { theme?: "light"|"dark", fontScale?: number, spacing?: "compact"|"normal"|"spacious", designStyle?: "minimal"|"netflix"|"uber"|"default", cardStyle?: "minimal"|"image-heavy"|"compact" } }
- update: { "op": "update", "path": string, "value": { ...object properties... } }
- add_component: { "op": "add_component", "value": { id: string, type: "table"|"chart"|"kpi"|"card"|"grid", props: {...} } }
- remove_component: { "op": "remove_component", "path": string }
- move_component: { "op": "move_component", "from": string, "to": string, "position": "before"|"after"|"inside" }
- replace_component: { "op": "replace_component", "path": string, "value": { id: string, type: string, props: {...} } }

Component prop examples:
- Table: { sortBy: "title"|"rating"|"genres"|"premiered", sortDirection?: "asc"|"desc" (default: "desc" for rating/premiered, "asc" for title/genres), limit?: number, filterBy?: string, filterValue?: any }
- Chart: { kind?: "bar"|"pie", type?: "bar"|"pie", groupBy: "genres"|"months", height?: number, width?: string }
- Card: { limit?: number, sortBy?: string, style?: "minimal"|"image-heavy"|"compact", imageSize?: "small"|"medium"|"large", columns?: number, showText?: boolean }
- Grid: { columns?: number, gap?: "compact"|"normal"|"spacious", style?: "netflix"|"uber"|"minimal"|"default" }

Design pattern examples:
- "Netflix style": dark theme (#141414 bg), large card images, grid layout, minimal text, red accents
- "Uber style": light theme, white bg, clean minimal design, compact cards, gray borders, subtle shadows
- "Make this look like [App Name]": set designStyle to app name (netflix, uber) or use appStyle prop
- "Minimal design": reduce clutter, increase spacing, clean typography
- "Show top 10 rated movies" or "Show only top 10 rated movies": { "op": "update", "path": "/components[id=table1]/props", "value": { "sortBy": "rating", "sortDirection": "desc", "limit": 10 } }
- "Show only top 10 rated": update table props { sortBy: "rating", sortDirection: "desc", limit: 10 }
- "Sort table by rating (high to low)" or "rating descending": { "op": "update", "path": "/components[id=table1]/props", "value": { "sortBy": "rating", "sortDirection": "desc" } }
- "Sort table by rating (low to high)" or "lowest to highest" or "rating ascending": { "op": "update", "path": "/components[id=table1]/props", "value": { "sortBy": "rating", "sortDirection": "asc" } }
- "Sort table by title (a-z)" or "title ascending": update table props { sortBy: "title", sortDirection: "asc" }
- "Sort table by title (z-a)" or "title descending": update table props { sortBy: "title", sortDirection: "desc" }
- "Sort table by genre (a-z)": update table props { sortBy: "genres", sortDirection: "asc" }
- "Sort table by genre (z-a)": update table props { sortBy: "genres", sortDirection: "desc" }
- "Sort table by premiere date (newest first)" or "most recent first": update table props { sortBy: "premiered", sortDirection: "desc" }
- "Sort table by premiere date (oldest first)": update table props { sortBy: "premiered", sortDirection: "asc" }
- "Show 10 most recently premiered movies" or "Show only 10 most recently premiered movies": { "op": "update", "path": "/components[id=table1]/props", "value": { "sortBy": "premiered", "sortDirection": "desc", "limit": 10 } }
- "Create pie chart by genre" or "add pie chart by genre": add_component { type: "chart", props: { kind: "pie", groupBy: "genres" } }
- "Chart bigger": update chart props { height: 400 } or { height: 500 }
- "Use cards": add_component with type "card" or "grid", remove table component
- "Focus on discovery": remove table, add grid/card components, use image-heavy cards

CRITICAL: The "value" field must ALWAYS be an object/JSON object, never a string or primitive. For commands requiring "value", ensure it's a valid JSON object.
`;

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    await limiter.consume(ip);

    const { prompt, schema } = await req.json();

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            {
              role: "user",
              parts: [{ text: JSON.stringify({ schema, prompt }) }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    const json = await res.json();
    console.log("Full Gemini response:", JSON.stringify(json, null, 2));
    
    let text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    console.log("Extracted text (raw):", text);
    
    // Strip markdown code fences if present
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    text = text.trim();
    console.log("Extracted text (cleaned):", text);
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(text);
      console.log("Parsed JSON before validation:", JSON.stringify(parsedJson, null, 2));
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed to parse text:", text);
      return NextResponse.json({ commands: [] }, { status: 500 });
    }
    
    try {
      const parsed = CommandListSchema.parse(parsedJson);
      return NextResponse.json(parsed);
    } catch (zodError: any) {
      console.error("Zod validation error:", zodError);
      console.error("Failed validation for:", JSON.stringify(parsedJson, null, 2));
      console.error("Zod errors:", JSON.stringify(zodError.errors || zodError.issues, null, 2));
      return NextResponse.json({ commands: [] }, { status: 500 });
    }
  } catch (e: any) {
    if (e.remainingPoints !== undefined) {
      return NextResponse.json(
        { error: "Rate limit exceeded", commands: [] },
        { status: 429 }
      );
    }
    console.error("AI endpoint error:", e);
    return NextResponse.json({ commands: [] }, { status: 500 });
  }
}
