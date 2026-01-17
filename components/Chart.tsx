"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

// Default colors
const DEFAULT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

// Netflix colors - red accents with dark theme
const NETFLIX_COLORS = ['#E50914', '#F40612', '#B20710', '#8B0000', '#DC143C', '#C41E3A', '#A52A2A', '#800020'];

// Uber colors - black/gray minimal palette
const UBER_COLORS = ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3'];

export function Chart({ summary, props }: { summary: any; props: any }) {
  const chartType = props.kind || props.type || "bar"; // "bar" or "pie"
  const groupBy = props.groupBy ?? "genres";
  const data =
    groupBy === "genres"
      ? Object.entries(summary?.byGenre ?? {}).map(([name, value]) => ({
          name,
          value,
        }))
      : Object.entries(summary?.byMonth ?? {}).map(([name, value]) => ({
          name,
          value,
        }));

  const height = props.height ?? 240;
  const width = props.width ?? "100%";

  // Detect current design style from root element - check periodically for changes
  const [designStyle, setDesignStyle] = useState<string>("default");
  useEffect(() => {
    const checkDesignStyle = () => {
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        const isNetflix = root.classList.contains("design-netflix");
        const isUber = root.classList.contains("design-uber");
        
        if (isNetflix) {
          setDesignStyle("netflix");
        } else if (isUber) {
          setDesignStyle("uber");
        } else {
          setDesignStyle("default");
        }
      }
    };
    
    // Check immediately
    checkDesignStyle();
    
    // Set up observer for class changes
    const observer = new MutationObserver(checkDesignStyle);
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
    
    return () => observer.disconnect();
  }, []);

  // Select colors based on design style
  const colors = designStyle === "netflix" 
    ? NETFLIX_COLORS 
    : designStyle === "uber" 
    ? UBER_COLORS 
    : DEFAULT_COLORS;
  
  const barColor = designStyle === "netflix" 
    ? "#E50914" 
    : designStyle === "uber" 
    ? "#000000" 
    : "#6366f1";
  
  const textColor = designStyle === "netflix" 
    ? "#ffffff" 
    : designStyle === "uber" 
    ? "#000000" 
    : undefined;

  if (chartType === "pie") {
    return (
      <div className="rounded border p-4 chart-container">
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill={barColor}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: designStyle === "netflix" ? "#2f2f2f" : designStyle === "uber" ? "#ffffff" : undefined,
                border: designStyle === "netflix" ? "1px solid #404040" : designStyle === "uber" ? "1px solid #E5E7EB" : undefined,
                color: textColor,
                borderRadius: "8px",
              }}
              labelStyle={{ color: textColor }}
              itemStyle={{ color: textColor }}
            />
            <Legend 
              wrapperStyle={{ color: textColor }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="rounded border p-4 chart-container">
      <ResponsiveContainer width={width} height={height}>
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: textColor }}
            stroke={designStyle === "netflix" ? "#666666" : designStyle === "uber" ? "#6B7280" : undefined}
          />
          <YAxis 
            tick={{ fill: textColor }}
            stroke={designStyle === "netflix" ? "#666666" : designStyle === "uber" ? "#6B7280" : undefined}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: designStyle === "netflix" ? "#2f2f2f" : designStyle === "uber" ? "#ffffff" : undefined,
              border: designStyle === "netflix" ? "1px solid #404040" : designStyle === "uber" ? "1px solid #E5E7EB" : undefined,
              color: textColor,
              borderRadius: "8px",
            }}
            labelStyle={{ color: textColor }}
            itemStyle={{ color: textColor }}
          />
          <Bar dataKey="value" fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
