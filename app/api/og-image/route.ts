import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ image: null });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return NextResponse.json({ image: null });

    // 先頭50KBだけ読んでOG imageを探す（全体を読むと重い）
    const reader = res.body?.getReader();
    if (!reader) return NextResponse.json({ image: null });

    let html = "";
    let done = false;
    while (!done && html.length < 50000) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) html += new TextDecoder().decode(value);
    }
    reader.cancel();

    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']thumbnail["'][^>]+content=["']([^"']+)["']/i);

    return NextResponse.json({ image: match ? match[1] : null });
  } catch {
    return NextResponse.json({ image: null });
  }
}
