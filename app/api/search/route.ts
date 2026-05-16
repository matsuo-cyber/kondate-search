import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "クエリが必要です" }, { status: 400 });
  }

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query + " レシピ 献立",
      gl: "jp",
      hl: "ja",
      num: 10,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: "検索エラー" }, { status: res.status });
  }

  const items = (data.organic ?? []).map((item: Record<string, unknown>) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    image: null,
  }));

  return NextResponse.json({ items });
}
