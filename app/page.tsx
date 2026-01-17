"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { applyCommands } from "@/lib/applyCommands";
import { DesignSchema, type Design } from "@/lib/designSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/Table";
import { Chart } from "@/components/Chart";
import { KPI } from "@/components/KPI";
import { Card } from "@/components/Card";
import { Grid } from "@/components/Grid";
import { useToast } from "@/components/ui/toast";
import { getUserId, getDisplayName, clearUserData } from "@/lib/userId";

export default function Dashboard() {
  const router = useRouter();
  const [schema, setSchema] = useState<Design | null>(null);
  const [prompt, setPrompt] = useState("");
  const promptInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const uid = getUserId();
      if (!uid) {
        router.push("/login");
      }
    }
  }, [router]);

  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: () => fetch("/api/data").then((r) => r.json()),
  });

  const { data: summary } = useQuery({
    queryKey: ["summary"],
    queryFn: () => fetch("/api/data/summary").then((r) => r.json()),
  });

  // Get userId from localStorage (can be null on first render)
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize userId from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const uid = getUserId();
      setUserId(uid);
      setIsInitialized(true);
    }
  }, []);

  const { data: schemaData, isLoading: schemaLoading, refetch: refetchSchema } = useQuery({
    queryKey: ["schema", userId], // Include userId in query key for per-user caching
    queryFn: async () => {
      const uid = getUserId();
      if (!uid) {
        throw new Error("No user ID");
      }
      
      console.log("Fetching schema for user:", uid);
      const res = await fetch("/api/schema", {
        headers: {
          "x-user-id": uid,
        },
        cache: "no-store", // Always fetch fresh data on page load
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Schema fetch failed:", res.status, errorText);
        throw new Error(`Failed to load schema: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Schema fetched from API:", data);
      return data;
    },
    enabled: isInitialized && !!userId && typeof window !== "undefined",
    staleTime: 0, // Always consider data stale to refetch on mount
    refetchOnMount: "always", // Always refetch when component mounts (on refresh)
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 2, // Retry failed requests
  });

  // Handle schema data when it loads - this is critical for persistence
  useEffect(() => {
    if (schemaData?.schema) {
      try {
        const parsed = DesignSchema.parse(schemaData.schema);
        console.log("Loaded schema from database - applying to state:", parsed);
        console.log("Schema styles:", parsed.styles);
        console.log("Schema layout:", parsed.layout);
        console.log("Schema components:", parsed.components);
        
        // Deep clone to ensure React detects the change
        const clonedSchema = JSON.parse(JSON.stringify(parsed));
        setSchema(clonedSchema);
      } catch (error) {
        console.error("Failed to parse schema:", error);
        console.error("Schema data that failed:", schemaData);
        toast({
          title: "Schema error",
          description: "Failed to load saved schema",
          variant: "destructive",
        });
      }
    } else if (schemaData && !schemaData.schema) {
      console.warn("Schema data exists but no schema property:", schemaData);
    }
  }, [schemaData, toast]);

  // Debounced save function
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSave = useCallback(
    (schemaToSave: Design) => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
      debouncedSaveRef.current = setTimeout(async () => {
        try {
          const uid = getUserId();
          if (!uid) {
            console.warn("No user ID available for save");
            return;
          }
          const res = await fetch("/api/schema", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": uid,
            },
            body: JSON.stringify({ schema: schemaToSave }),
          });
          if (!res.ok) {
            toast({
              title: "Save failed",
              description: "Could not save schema",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Save failed",
            description: "Could not save schema",
            variant: "destructive",
          });
        }
      }, 300);
    },
    [toast]
  );

  async function submitPrompt() {
    // Verify we can read from the input element (defensive check)
    const inputValue = promptInputRef.current?.value || prompt;
    
    if (!schema || !inputValue.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    // Use the input value (they should be in sync via setPrompt)
    const promptToUse = inputValue.trim();
    console.log("Apply button triggered. Prompt:", promptToUse);
    console.log("Current schema before update:", JSON.stringify(schema, null, 2));

    try {
      const uid = getUserId();
      if (!uid) {
        toast({
          title: "Not authenticated",
          description: "Please log in",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid,
        },
        body: JSON.stringify({ prompt: promptToUse, schema }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please wait before trying again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "AI request failed",
            description: "Could not process prompt",
            variant: "destructive",
          });
        }
        return;
      }

      const data = await res.json();
      console.log("Commands received from AI:", JSON.stringify(data, null, 2));
      console.log("Schema before applying commands - table1 props:", 
        schema.components.find((c: any) => c.id === "table1")?.props);
      
      const next = applyCommands(schema, data);
      const table1Props = next.components.find((c: any) => c.id === "table1")?.props;
      console.log("Schema after applying commands - table1 props:", table1Props);
      console.log("Table1 component full:", next.components.find((c: any) => c.id === "table1"));
      console.log("Full schema after commands:", JSON.stringify(next, null, 2));

      // Force deep clone to ensure React detects changes - this triggers re-render
      const clonedSchema = JSON.parse(JSON.stringify(next));
      setSchema(clonedSchema);
      
      // Clear the input
      setPrompt("");
      if (promptInputRef.current) {
        promptInputRef.current.value = "";
      }

      // Save immediately (don't wait for debounce) to ensure persistence
      try {
        const uid = getUserId();
        if (!uid) {
          console.warn("No user ID available for immediate save");
          return;
        }
        const saveRes = await fetch("/api/schema", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": uid,
          },
          body: JSON.stringify({ schema: next }),
        });
        
        if (saveRes.ok) {
          console.log("Schema saved successfully immediately");
        } else {
          console.error("Failed to save schema immediately:", saveRes.status);
          toast({
            title: "Save warning",
            description: "Schema may not have saved properly",
            variant: "destructive",
          });
        }
      } catch (saveError) {
        console.error("Error saving schema immediately:", saveError);
        toast({
          title: "Save error",
          description: "Failed to save schema",
          variant: "destructive",
        });
      }
      
      // Also set up debounced save for any subsequent rapid changes
      debouncedSave(next);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  }

  // Apply font scale and spacing to root
  useEffect(() => {
    if (schema && typeof document !== "undefined") {
      document.documentElement.style.fontSize = `${schema.styles.fontScale * 16}px`;
      
      // Apply design style classes
      const root = document.documentElement;
      root.classList.remove("design-minimal", "design-netflix", "design-uber");
      
      // Apply designStyle or appStyle (appStyle takes precedence)
      if (schema.styles.appStyle) {
        // Normalize app name (lowercase, handle special cases like "X" -> "twitter")
        const appName = schema.styles.appStyle.toLowerCase().trim();
        if (appName === "x" || appName === "twitter") {
          // X/Twitter uses dark theme with minimal design
          root.classList.add("design-netflix");
          root.classList.add("dark");
        } else if (appName === "netflix") {
          root.classList.add("design-netflix");
        } else if (appName === "uber") {
          root.classList.add("design-uber");
        } else if (schema.styles.designStyle) {
          root.classList.add(`design-${schema.styles.designStyle}`);
        }
      } else if (schema.styles.designStyle) {
        // Apply design style class (e.g., design-netflix, design-uber)
        root.classList.add(`design-${schema.styles.designStyle}`);
        // Also set theme for compatibility
        if (schema.styles.designStyle === "netflix") {
          root.classList.add("dark");
        }
      }
      
      // Apply spacing
      root.classList.remove("spacing-compact", "spacing-normal", "spacing-spacious");
      root.classList.add(`spacing-${schema.styles.spacing || "normal"}`);
    }
  }, [schema]);

  if (!schema || schemaLoading) {
    return <div className="p-8">Loading...</div>;
  }

  // Determine base theme class, but design-style classes will override
  const baseThemeClass =
    schema.styles.theme === "dark"
      ? "dark bg-neutral-900 text-white"
      : "bg-white text-neutral-900";
  
  // Apply design style class if set (takes precedence over theme)
  const designStyleClass = schema.styles.designStyle 
    ? `design-${schema.styles.designStyle}` 
    : "";
  
  const themeClass = designStyleClass || baseThemeClass;

  const displayName = getDisplayName();

  return (
    <div className={themeClass}>
      {/* Header with app name and user ID */}
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">Show Shaper</h1>
        <div className="flex items-center gap-4">
          {displayName && (
            <span className="text-sm opacity-70">User: {displayName}</span>
          )}
        </div>
      </div>

      {/* Prompt input bar */}
      <div className="p-4 flex gap-2 border-b">
        <Input
          id="preferences"
          ref={promptInputRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            // Keep ref in sync
            if (promptInputRef.current) {
              promptInputRef.current.value = e.target.value;
            }
          }}
          placeholder="e.g., Dark mode, bigger text, top 10 by rating, put chart above table"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submitPrompt();
            }
          }}
          className="flex-1"
        />
        <Button onClick={submitPrompt}>Apply</Button>
        <Button
          variant="outline"
          onClick={() => {
            clearUserData(false); // Keep mapping so same display name gets same UUID
            router.push("/login");
          }}
        >
          Logout
        </Button>
      </div>

      <div
        className={`grid gap-4 p-4 ${
          schema.layout.columns === 2
            ? "grid-cols-1 md:grid-cols-2"
            : schema.layout.columns === 3
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {schema.layout.order.map((id) => {
          const comp = schema.components.find((c) => c.id === id);
          if (!comp) return null;
          switch (comp.type) {
            case "table":
              // Ensure props object exists and is spread correctly
              const tableProps = comp.props || {};
              console.log(`Rendering table ${id} with props:`, tableProps);
              return <Table key={id} items={items ?? []} props={tableProps} />;
            case "chart":
              return <Chart key={id} summary={summary} props={comp.props} />;
            case "kpi":
              // KPI uses summary.total by default, but can receive items for future filtered count support
              return <KPI key={id} summary={summary} items={items} props={comp.props} />;
            case "card":
              return <Card key={id} items={items} props={comp.props} />;
            case "grid":
              return <Grid key={id} items={items} props={comp.props} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
