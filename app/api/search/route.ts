import { NextRequest, NextResponse } from "next/server";

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 10;
const WINDOW_MS = 60 * 1000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRate(ip)) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。1分後に再試行してください。" },
      { status: 429 }
    );
  }

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

  // images セクションをドメインでインデックス化して organic にマッチング
  const imageByDomain: Record<string, string> = {};
  for (const img of (data.images ?? []) as Record<string, unknown>[]) {
    try {
      const domain = new URL(img.link as string).hostname;
      if (!imageByDomain[domain]) imageByDomain[domain] = img.imageUrl as string;
    } catch { /* ignore invalid URLs */ }
  }

  const items = (data.organic ?? []).map((item: Record<string, unknown>) => {
    let image = (item.imageUrl as string) ?? null;
    if (!image) {
      try {
        const domain = new URL(item.link as string).hostname;
        image = imageByDomain[domain] ?? null;
      } catch { /* ignore */ }
    }
    return { title: item.title, link: item.link, snippet: item.snippet, image };
  });

  return NextResponse.json({ items });
}
