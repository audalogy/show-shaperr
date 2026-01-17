import { NextResponse } from "next/server";

export async function GET() {
  try {
    const shows = await fetch("https://api.tvmaze.com/shows?page=1", {
      cache: "no-store",
    }).then((r) => r.json());

    const byGenre: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const s of shows as any[]) {
      for (const g of s.genres ?? []) {
        byGenre[g] = (byGenre[g] ?? 0) + 1;
      }
      const d = s.premiered ? new Date(s.premiered) : null;
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        byMonth[key] = (byMonth[key] ?? 0) + 1;
      }
    }

    return NextResponse.json({
      byGenre,
      byMonth,
      total: (shows as any[]).length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
