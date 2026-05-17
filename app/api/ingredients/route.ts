import { NextRequest, NextResponse } from "next/server";

function cleanName(raw: string): string {
  return raw
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[\d.\/]+\s*(g|ml|cc|kg|L|個|本|枚|袋|缶|パック|束|株|房|片|かけ|合|カップ|大さじ|小さじ|少々|適量|適宜|少量|ひとつまみ).*/g, "")
    .replace(/\s+\d+.*$/, "")
    .trim();
}

function extractFromJsonLd(html: string): string[] {
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const content = block.replace(/<\/?script[^>]*>/gi, "");
    try {
      const data = JSON.parse(content);
      const candidates = Array.isArray(data) ? data : [data];
      for (const item of candidates) {
        const recipe = item["@type"] === "Recipe" ? item : (item["@graph"] ?? []).find((n: Record<string, unknown>) => n["@type"] === "Recipe");
        if (recipe?.recipeIngredient?.length) {
          return (recipe.recipeIngredient as string[]).map(cleanName).filter(Boolean);
        }
      }
    } catch { /* ignore parse errors */ }
  }
  return [];
}

function extractFromHtml(html: string): string[] {
  // 「材料」見出しの後のリスト項目を取得
  const section = html.match(/材料[\s\S]{0,200}?<ul[\s\S]*?<\/ul>/i)?.[0] ?? "";
  const items = [...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  return items
    .map((m) => cleanName(m[1].replace(/<[^>]+>/g, "").trim()))
    .filter((s) => s.length > 0 && s.length < 20);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ ingredients: [] });

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    if (!res.ok) return NextResponse.json({ ingredients: [] });

    const html = await res.text();
    const ingredients = extractFromJsonLd(html);
    if (ingredients.length > 0) return NextResponse.json({ ingredients });

    // JSON-LD で取れなければ HTML パース
    return NextResponse.json({ ingredients: extractFromHtml(html) });
  } catch {
    return NextResponse.json({ ingredients: [] });
  }
}
