import { NextRequest, NextResponse } from "next/server";
import { DesignSchema } from "@/lib/designSchema";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-user-id");
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const server = createServerClient();
    // Try to select with history columns, but handle if they don't exist
    const { data, error: selectError } = await server
      .from("user_schemas")
      .select("schema_json, history_json, history_index")
      .eq("user_id", auth)
      .maybeSingle();

    // If columns don't exist, fall back to basic select
    if (selectError || !data) {
      const { data: basicData } = await server
        .from("user_schemas")
        .select("schema_json")
        .eq("user_id", auth)
        .maybeSingle();
      
      if (!basicData) {
        // Only create default schema if user doesn't have one
        const defaultSchema = DesignSchema.parse({
          styles: { theme: "light", fontScale: 1 },
          layout: { columns: 1, order: ["table1", "chart1", "kpi1"] },
          components: [
            { id: "table1", type: "table", props: { sortBy: "rating", limit: 50 } },
            {
              id: "chart1",
              type: "chart",
              props: { kind: "bar", groupBy: "genres" },
            },
            { id: "kpi1", type: "kpi", props: { label: "Total Shows" } },
          ],
        });

        await server.from("user_schemas").insert({
          user_id: auth,
          schema_json: defaultSchema,
        });

        console.log("Created default schema for user:", auth);
        return NextResponse.json({ 
          schema: defaultSchema,
          history: [],
          historyIndex: -1,
        });
      }

      // Return with empty history if columns don't exist
      console.log("Loaded saved schema for user (no history columns):", auth);
      return NextResponse.json({ 
        schema: basicData.schema_json,
        history: [],
        historyIndex: -1,
      });
    }

    if (!data) {
      // Only create default schema if user doesn't have one
      const defaultSchema = DesignSchema.parse({
        styles: { theme: "light", fontScale: 1 },
        layout: { columns: 1, order: ["table1", "chart1", "kpi1"] },
        components: [
          { id: "table1", type: "table", props: { sortBy: "rating", limit: 50 } },
          {
            id: "chart1",
            type: "chart",
            props: { kind: "bar", groupBy: "genres" },
          },
          { id: "kpi1", type: "kpi", props: { label: "Total Shows" } },
        ],
      });

      await server.from("user_schemas").insert({
        user_id: auth,
        schema_json: defaultSchema,
      });

      console.log("Created default schema for user:", auth);
      return NextResponse.json({ 
        schema: defaultSchema,
        history: [],
        historyIndex: -1,
      });
    }

    // Return the saved schema - this is what should persist across refreshes
    console.log("Loaded saved schema for user:", auth);
    return NextResponse.json({ 
      schema: data.schema_json,
      history: data.history_json || [],
      historyIndex: data.history_index ?? -1,
    });
  } catch (error) {
    console.error("Schema GET error:", error);
    return NextResponse.json({ error: "Failed to load schema" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-user-id");
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { schema, history, historyIndex } = await req.json();
    const validated = DesignSchema.parse(schema);

    const server = createServerClient();
    
    // Build upsert object - only include history fields if they might exist
    // First try with history fields, fall back if columns don't exist
    const upsertData: any = {
      user_id: auth,
      schema_json: validated,
      updated_at: new Date().toISOString(),
    };
    
    // Only include history fields if provided (and columns might exist)
    if (history !== undefined || historyIndex !== undefined) {
      upsertData.history_json = history || [];
      upsertData.history_index = historyIndex ?? -1;
    }
    
    const { error } = await server
      .from("user_schemas")
      .upsert(upsertData, {
        onConflict: "user_id",
      });

    // If error is about missing columns, try without history fields
    if (error && (error.message?.includes("history_json") || error.message?.includes("history_index"))) {
      console.warn("History columns don't exist, saving without history:", error.message);
      const { error: fallbackError } = await server
        .from("user_schemas")
        .upsert({
          user_id: auth,
          schema_json: validated,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });
      
      if (fallbackError) {
        console.error("Supabase upsert error (fallback):", fallbackError);
        return NextResponse.json({ error: "Failed to save schema", details: fallbackError.message }, { status: 500 });
      }
      
      console.log("Schema saved successfully (without history) for user:", auth);
      return NextResponse.json({ ok: true });
    }

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: "Failed to save schema", details: error.message }, { status: 500 });
    }

    console.log("Schema saved successfully for user:", auth);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Schema POST error:", error);
    return NextResponse.json({ error: "Failed to save schema" }, { status: 500 });
  }
}
