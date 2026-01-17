import { JSONPath } from "jsonpath-plus";
import { DesignSchema } from "./designSchema";
import { CommandListSchema } from "./commandsSchema";
import { produce } from "immer";

export function applyCommands(schema: unknown, cmdList: unknown) {
  const base = DesignSchema.parse(schema);
  const cmds = CommandListSchema.parse(cmdList).commands;

  return produce(base, (draft) => {
    for (const c of cmds) {
      try {
        switch (c.op) {
          case "set_style": {
            const nodes = JSONPath({ path: c.path, json: draft }) as any[];
            if (nodes.length) Object.assign(nodes[0], c.value);
            break;
          }
          case "add_component": {
            const exists = draft.components.some((x) => x.id === c.value.id);
            if (!exists) {
              draft.components.push(c.value);
              draft.layout.order.push(c.value.id);
            }
            break;
          }
          case "remove_component": {
            const id = resolveIdFromPath(c.path, draft);
            if (!id) break;
            draft.components = draft.components.filter((x) => x.id !== id);
            draft.layout.order = draft.layout.order.filter((x) => x !== id);
            break;
          }
          case "move_component": {
            const fromId = resolveIdFromPath(c.from, draft);
            const toId = resolveIdFromPath(c.to, draft);
            if (!fromId || !toId) break;
            draft.layout.order = moveId(
              draft.layout.order,
              fromId,
              toId,
              c.position
            );
            break;
          }
          case "replace_component": {
            const id = resolveIdFromPath(c.path, draft);
            if (!id) break;
            draft.components = draft.components.map((x) =>
              x.id === id ? c.value : x
            );
            break;
          }
          case "update": {
            // Handle multiple path formats
            let updated = false;
            
            // Format 1: /components[id=table1]/props
            if (c.path.includes("/components[id=") && c.path.includes("]/props")) {
              const idMatch = c.path.match(/\/components\[id=([^\]]+)\]/);
              if (idMatch) {
                const componentId = idMatch[1];
                const component = draft.components.find((comp: any) => comp.id === componentId);
                if (component) {
                  // Merge props - create new object to trigger React re-render
                  component.props = { ...component.props, ...c.value };
                  updated = true;
                  console.log(`Updated component ${componentId} props:`, component.props);
                }
              }
            }
            // Format 2: /components[id=table1] (update whole component, but merge props)
            else if (c.path.startsWith("/components[id=") && c.path.endsWith("]")) {
              const idMatch = c.path.match(/\/components\[id=([^\]]+)\]/);
              if (idMatch) {
                const componentId = idMatch[1];
                const component = draft.components.find((comp: any) => comp.id === componentId);
                if (component && c.value.props) {
                  // Update props specifically
                  component.props = { ...component.props, ...c.value.props };
                  updated = true;
                  console.log(`Updated component ${componentId} via whole component:`, component.props);
                }
              }
            }
            
            // Format 3: JSONPath like $.components[?(@.id=="table1")].props
            if (!updated) {
              try {
                const nodes = JSONPath({ path: c.path, json: draft }) as any[];
                if (nodes.length) {
                  // If we found props object, merge
                  if (c.path.includes("props") || nodes[0].props !== undefined) {
                    if (nodes[0].props) {
                      Object.assign(nodes[0].props, c.value);
                      console.log(`Updated via JSONPath ${c.path}:`, nodes[0].props);
                    } else {
                      Object.assign(nodes[0], c.value);
                    }
                    updated = true;
                  } else {
                    Object.assign(nodes[0], c.value);
                    updated = true;
                  }
                }
              } catch (e) {
                console.error("JSONPath update failed:", e, "path:", c.path);
              }
            }
            
            if (!updated) {
              console.warn("Update command did not match any path:", c.path, "value:", c.value);
            }
            break;
          }
        }
      } catch {
        // Ignore errors for individual commands
      }
    }
  });
}

function resolveIdFromPath(path: string, draft: any): string | null {
  if (path.startsWith("/components[id=") && path.endsWith("]")) {
    const id = path.slice("/components[id=".length, -1);
    return draft.components.some((c: any) => c.id === id) ? id : null;
  }
  const nodes = JSONPath({ path, json: draft }) as any[];
  if (nodes.length && nodes[0]?.id) return nodes[0].id;
  return null;
}

function moveId(
  order: string[],
  fromId: string,
  toId: string,
  position: "before" | "after" | "inside"
): string[] {
  const without = order.filter((x) => x !== fromId);
  const idx = without.indexOf(toId);
  if (idx === -1) return order;
  const insertAt = position === "before" ? idx : idx + 1;
  without.splice(insertAt, 0, fromId);
  return without;
}
