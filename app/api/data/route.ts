import { NextResponse } from "next/server";

export async function GET() {
  try {
    const shows = await fetch("https://api.tvmaze.com/shows?page=1", {
      cache: "no-store",
    }).then((r) => r.json());

    const items = (shows as any[]).map((s) => ({
      id: s.id,
      title: s.name,
      genres: s.genres ?? [],
      rating: s.rating?.average ?? null,
      premiered: s.premiered ?? null,
      image: s.image?.medium ?? null,
    }));

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
