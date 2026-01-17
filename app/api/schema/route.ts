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
    const { data } = await server
      .from("user_schemas")
      .select("schema_json")
      .eq("user_id", auth)
      .maybeSingle();

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
      return NextResponse.json({ schema: defaultSchema });
    }

    // Return the saved schema - this is what should persist across refreshes
    console.log("Loaded saved schema for user:", auth);
    return NextResponse.json({ schema: data.schema_json });
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
    const { schema } = await req.json();
    const validated = DesignSchema.parse(schema);

    const server = createServerClient();
    const { error } = await server
      .from("user_schemas")
      .upsert({
        user_id: auth,
        schema_json: validated,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

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
