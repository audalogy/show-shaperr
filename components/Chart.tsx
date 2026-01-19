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
import { cn } from "@/lib/utils";

// Default colors
const DEFAULT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

// Spotify colors - green accents
const SPOTIFY_COLORS = ['#1DB954', '#1ed760', '#1aa34a', '#169b43', '#148d3d', '#127e36', '#0f6f30', '#0c6029'];

// Netflix colors - red accents with dark theme
const NETFLIX_COLORS = ['#E50914', '#F40612', '#B20710', '#8B0000', '#DC143C', '#C41E3A', '#A52A2A', '#800020'];

// YouTube colors - red accents
const YOUTUBE_COLORS = ['#FF0000', '#FF1a1a', '#FF3333', '#FF4d4d', '#FF6666', '#FF8080', '#FF9999', '#FFb3b3'];

// DoorDash colors - red/pink accents
const DOORDASH_COLORS = ['#FF3008', '#FF4d2e', '#FF6647', '#FF7f61', '#FF987a', '#FFb194', '#FFcaad', '#FFe3c7'];

// Uber colors - black/gray minimal palette
const UBER_COLORS = ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3'];

// Apple Music colors - pink/purple accents
const APPLEMUSIC_COLORS = ['#FA2D48', '#FF3D5F', '#E91E63', '#C2185B', '#AD1457', '#880E4F', '#4A148C', '#6A1B9A'];

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

  // Extract brand color from className prop (e.g., text-[#1DB954] or text-green-500)
  const extractBrandColor = (className: string): string | null => {
    // Match text-[#HEX] pattern
    const hexMatch = className.match(/text-\[#([0-9A-Fa-f]{6})\]/);
    if (hexMatch) {
      return `#${hexMatch[1]}`;
    }
    return null;
  };

  // Detect brand from className or design style
  const [brandStyle, setBrandStyle] = useState<string>("default");
  const className = props.className || "";
  
  useEffect(() => {
    const detectBrand = () => {
      const brandColor = extractBrandColor(className);
      
      if (brandColor) {
        // Detect brand from color
        if (brandColor === "#1DB954") {
          setBrandStyle("spotify");
        } else if (brandColor === "#E50914") {
          setBrandStyle("netflix");
        } else if (brandColor === "#FF0000") {
          setBrandStyle("youtube");
        } else if (brandColor === "#FF3008") {
          setBrandStyle("doordash");
        } else if (brandColor === "#FA2D48" || brandColor === "#E91E63") {
          setBrandStyle("applemusic");
        } else {
          setBrandStyle("default");
        }
      } else if (typeof document !== "undefined") {
        // Fallback to design style detection
        const root = document.documentElement;
        const isNetflix = root.classList.contains("design-netflix");
        const isUber = root.classList.contains("design-uber");
        
        if (isNetflix) {
          setBrandStyle("netflix");
        } else if (isUber) {
          setBrandStyle("uber");
        } else {
          setBrandStyle("default");
        }
      }
    };
    
    detectBrand();
    
    // Set up observer for class changes on root
    const observer = new MutationObserver(detectBrand);
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
    
    return () => observer.disconnect();
  }, [className]);

  // Select colors based on brand style
  const colors = brandStyle === "spotify"
    ? SPOTIFY_COLORS
    : brandStyle === "netflix" 
    ? NETFLIX_COLORS 
    : brandStyle === "youtube"
    ? YOUTUBE_COLORS
    : brandStyle === "doordash"
    ? DOORDASH_COLORS
    : brandStyle === "uber" 
    ? UBER_COLORS
    : brandStyle === "applemusic"
    ? APPLEMUSIC_COLORS
    : DEFAULT_COLORS;
  
  const barColor = brandStyle === "spotify"
    ? "#1DB954"
    : brandStyle === "netflix" 
    ? "#E50914" 
    : brandStyle === "youtube"
    ? "#FF0000"
    : brandStyle === "doordash"
    ? "#FF3008"
    : brandStyle === "uber" 
    ? "#000000" 
    : brandStyle === "applemusic"
    ? "#FA2D48"
    : "#6366f1";
  
  const textColor = brandStyle === "spotify" || brandStyle === "netflix" || brandStyle === "applemusic"
    ? "#ffffff" 
    : brandStyle === "uber" || brandStyle === "youtube" || brandStyle === "doordash"
    ? "#000000" 
    : undefined;
  
  if (chartType === "pie") {
    return (
      <div className={cn("rounded border p-4 chart-container", className)}>
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={120}
              fill={barColor}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const item = payload[0];
                const nameValue = item.name ?? "";
                const numValue = typeof item.value === 'number' ? item.value : 0;
                // Calculate total from all data points
                const total = data.reduce((sum: number, item: any) => {
                  const itemValue = typeof item.value === 'number' ? item.value : 0;
                  return sum + itemValue;
                }, 0);
                // Calculate percentage
                const percent = total > 0 ? ((numValue / total) * 100).toFixed(1) : "0.0";
                // Show both numerical value and percentage: "Name: value (XX.X%)"
                return (
                  <div
                    style={{
                      backgroundColor: brandStyle === "netflix" || brandStyle === "spotify" || brandStyle === "applemusic" ? "#2f2f2f" : brandStyle === "uber" || brandStyle === "youtube" || brandStyle === "doordash" ? "#ffffff" : undefined,
                      border: brandStyle === "netflix" || brandStyle === "spotify" || brandStyle === "applemusic" ? "1px solid #404040" : brandStyle === "uber" || brandStyle === "youtube" || brandStyle === "doordash" ? "1px solid #E5E7EB" : undefined,
                      color: textColor,
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  >
                    {`${nameValue}: ${numValue} (${percent}%)`}
                  </div>
                );
              }}
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
    <div className={cn("rounded border p-4 chart-container", className)}>
      <ResponsiveContainer width={width} height={height}>
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: textColor }}
            stroke={brandStyle === "netflix" || brandStyle === "spotify" || brandStyle === "applemusic" ? "#666666" : brandStyle === "uber" || brandStyle === "youtube" || brandStyle === "doordash" ? "#6B7280" : undefined}
          />
          <YAxis 
            tick={{ fill: textColor }}
            stroke={brandStyle === "netflix" || brandStyle === "spotify" || brandStyle === "applemusic" ? "#666666" : brandStyle === "uber" || brandStyle === "youtube" || brandStyle === "doordash" ? "#6B7280" : undefined}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: brandStyle === "netflix" || brandStyle === "spotify" || brandStyle === "applemusic" ? "#2f2f2f" : brandStyle === "uber" || brandStyle === "youtube" || brandStyle === "doordash" ? "#ffffff" : undefined,
              border: brandStyle === "netflix" || brandStyle === "spotify" || brandStyle === "applemusic" ? "1px solid #404040" : brandStyle === "uber" || brandStyle === "youtube" || brandStyle === "doordash" ? "1px solid #E5E7EB" : undefined,
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
