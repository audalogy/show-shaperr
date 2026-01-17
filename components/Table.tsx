"use client";

import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Table({ items, props }: { items: any[]; props: any }) {
  const helper = createColumnHelper<any>();

  const columns = useMemo(
    () => [
      helper.accessor("title", { header: "Title" }),
      helper.accessor("rating", {
        header: "Rating",
        cell: (info) => info.getValue() ?? "N/A",
      }),
      helper.accessor("genres", {
        header: "Genres",
        cell: (info) => (info.getValue() as string[]).join(", ") || "N/A",
      }),
      helper.accessor("premiered", {
        header: "Premiered",
        cell: (info) => info.getValue() ?? "N/A",
      }),
    ],
    [helper]
  );

  const data = useMemo(() => {
    let arr = items ?? [];
    
    // Apply filtering first
    if (props.filterBy) {
      if (props.filterBy && props.filterValue !== undefined) {
        arr = arr.filter((item) => {
          const val = item[props.filterBy];
          if (typeof val === "number") {
            return val >= props.filterValue;
          }
          return val === props.filterValue;
        });
      }
    }
    
    // Apply sorting
    if (props.sortBy) {
      // Determine default sort direction based on field type
      let defaultDirection: "asc" | "desc" = "desc";
      if (props.sortBy === "title") {
        defaultDirection = "asc"; // A-Z default
      } else if (props.sortBy === "genres") {
        defaultDirection = "asc"; // A-Z default
      }
      
      const sortDirection = props.sortDirection || props.order || defaultDirection;
      
      arr = [...arr].sort((a, b) => {
        const aVal = a[props.sortBy];
        const bVal = b[props.sortBy];
        
        let comparison = 0;
        
        // Handle date sorting (premiered)
        if (props.sortBy === "premiered") {
          const aDate = aVal ? new Date(aVal).getTime() : 0;
          const bDate = bVal ? new Date(bVal).getTime() : 0;
          // For dates: desc = newest first, asc = oldest first
          comparison = bDate - aDate;
        }
        // Handle numeric sorting (rating)
        else if (props.sortBy === "rating") {
          const aNum = typeof aVal === "number" ? aVal : 0;
          const bNum = typeof bVal === "number" ? bVal : 0;
          // For ratings: desc = high to low, asc = low to high
          comparison = bNum - aNum;
        }
        // Handle genres (array of strings)
        else if (props.sortBy === "genres") {
          const aGenres = Array.isArray(aVal) ? aVal.sort().join(",") : (aVal || "");
          const bGenres = Array.isArray(bVal) ? bVal.sort().join(",") : (bVal || "");
          comparison = aGenres.localeCompare(bGenres);
        }
        // Handle string sorting (title)
        else if (props.sortBy === "title") {
          const aStr = aVal || "";
          const bStr = bVal || "";
          comparison = aStr.localeCompare(bStr);
        }
        // Handle generic string sorting
        else if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        }
        // Handle generic numeric sorting
        else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = bVal - aVal; // Default descending
        }
        // Fallback
        else {
          const aNum = typeof aVal === "number" ? aVal : 0;
          const bNum = typeof bVal === "number" ? bVal : 0;
          comparison = bNum - aNum;
        }
        
        // Apply sort direction: asc reverses the comparison
        return sortDirection === "asc" ? -comparison : comparison;
      });
    }
    
    // Apply limit AFTER sorting
    if (props.limit && typeof props.limit === "number") {
      arr = arr.slice(0, props.limit);
    }
    
    return arr;
  }, [items, props]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Log when table data changes for debugging
  useEffect(() => {
    console.log("Table component re-rendered with props:", {
      sortBy: props.sortBy,
      sortDirection: props.sortDirection,
      limit: props.limit,
      allProps: props,
      filteredDataLength: data.length,
      originalDataLength: items?.length ?? 0,
    });
    console.log("First 3 items in filtered data:", data.slice(0, 3));
  }, [props.sortBy, props.sortDirection, props.limit, props, data.length, items?.length, data]);

  const className = props.className || "";
  
  return (
    <div className={cn("rounded border p-4", className)}>
      <ShadcnTable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </ShadcnTable>
      <div className="mt-2 text-sm opacity-70">Rows: {data.length}</div>
    </div>
  );
}
