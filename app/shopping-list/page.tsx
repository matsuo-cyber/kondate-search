"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

type Category = "肉・魚介" | "野菜" | "豆腐・卵" | "調味料・その他";

interface Item {
  id: string;
  name: string;
  category: Category;
  checked: boolean;
  auto: boolean;
}

const INGREDIENT_MAP: { keywords: string[]; items: { name: string; category: Category }[] }[] = [
  { keywords: ["カレー"], items: [{ name: "カレールー", category: "調味料・その他" }, { name: "じゃがいも", category: "野菜" }, { name: "玉ねぎ", category: "野菜" }, { name: "にんじん", category: "野菜" }] },
  { keywords: ["シチュー"], items: [{ name: "シチュールー", category: "調味料・その他" }, { name: "じゃがいも", category: "野菜" }, { name: "玉ねぎ", category: "野菜" }, { name: "にんじん", category: "野菜" }] },
  { keywords: ["肉じゃが"], items: [{ name: "じゃがいも", category: "野菜" }, { name: "玉ねぎ", category: "野菜" }, { name: "にんじん", category: "野菜" }, { name: "牛肉", category: "肉・魚介" }] },
  { keywords: ["唐揚げ", "から揚げ", "からあげ"], items: [{ name: "鶏もも肉", category: "肉・魚介" }, { name: "醤油", category: "調味料・その他" }, { name: "にんにく", category: "野菜" }, { name: "しょうが", category: "野菜" }] },
  { keywords: ["鶏むね", "鶏胸"], items: [{ name: "鶏むね肉", category: "肉・魚介" }] },
  { keywords: ["鶏もも"], items: [{ name: "鶏もも肉", category: "肉・魚介" }] },
  { keywords: ["ハンバーグ"], items: [{ name: "合い挽き肉", category: "肉・魚介" }, { name: "玉ねぎ", category: "野菜" }, { name: "卵", category: "豆腐・卵" }, { name: "パン粉", category: "調味料・その他" }] },
  { keywords: ["豚肉", "ポーク", "豚バラ", "豚ロース"], items: [{ name: "豚肉", category: "肉・魚介" }] },
  { keywords: ["牛肉", "ビーフ"], items: [{ name: "牛肉", category: "肉・魚介" }] },
  { keywords: ["鮭", "サーモン"], items: [{ name: "鮭", category: "肉・魚介" }] },
  { keywords: ["さば", "鯖"], items: [{ name: "さば", category: "肉・魚介" }] },
  { keywords: ["さんま", "秋刀魚"], items: [{ name: "さんま", category: "肉・魚介" }] },
  { keywords: ["えび", "海老"], items: [{ name: "えび", category: "肉・魚介" }] },
  { keywords: ["刺身", "刺し身"], items: [{ name: "刺身（お好みで）", category: "肉・魚介" }] },
  { keywords: ["豆腐"], items: [{ name: "豆腐", category: "豆腐・卵" }] },
  { keywords: ["納豆"], items: [{ name: "納豆", category: "豆腐・卵" }] },
  { keywords: ["卵", "玉子", "オムレツ", "目玉焼き", "卵焼き"], items: [{ name: "卵", category: "豆腐・卵" }] },
  { keywords: ["パスタ", "スパゲッティ", "ミートソース"], items: [{ name: "パスタ", category: "調味料・その他" }] },
  { keywords: ["ラーメン"], items: [{ name: "ラーメン（麺）", category: "調味料・その他" }] },
  { keywords: ["うどん"], items: [{ name: "うどん", category: "調味料・その他" }] },
  { keywords: ["そば"], items: [{ name: "そば", category: "調味料・その他" }] },
  { keywords: ["チャーハン", "炒飯"], items: [{ name: "ご飯（冷や飯）", category: "調味料・その他" }, { name: "卵", category: "豆腐・卵" }] },
  { keywords: ["サラダ"], items: [{ name: "レタス", category: "野菜" }, { name: "きゅうり", category: "野菜" }, { name: "トマト", category: "野菜" }] },
  { keywords: ["野菜炒め", "炒め物"], items: [{ name: "キャベツ", category: "野菜" }, { name: "にんじん", category: "野菜" }, { name: "もやし", category: "野菜" }] },
  { keywords: ["味噌汁", "みそ汁"], items: [{ name: "味噌", category: "調味料・その他" }, { name: "豆腐", category: "豆腐・卵" }, { name: "わかめ", category: "野菜" }] },
  { keywords: ["餃子", "ギョーザ"], items: [{ name: "餃子の皮", category: "調味料・その他" }, { name: "豚ひき肉", category: "肉・魚介" }, { name: "キャベツ", category: "野菜" }, { name: "ニラ", category: "野菜" }] },
  { keywords: ["グラタン"], items: [{ name: "ホワイトソース", category: "調味料・その他" }, { name: "マカロニ", category: "調味料・その他" }, { name: "チーズ", category: "豆腐・卵" }] },
  { keywords: ["ピザ"], items: [{ name: "ピザ生地", category: "調味料・その他" }, { name: "チーズ", category: "豆腐・卵" }, { name: "トマトソース", category: "調味料・その他" }] },
  { keywords: ["天ぷら", "天丼"], items: [{ name: "天ぷら粉", category: "調味料・その他" }, { name: "えび", category: "肉・魚介" }, { name: "さつまいも", category: "野菜" }] },
  { keywords: ["煮物"], items: [{ name: "だし", category: "調味料・その他" }, { name: "醤油", category: "調味料・その他" }, { name: "みりん", category: "調味料・その他" }] },
];

const CATEGORY_ORDER: Category[] = ["肉・魚介", "野菜", "豆腐・卵", "調味料・その他"];
const CATEGORY_COLORS: Record<Category, string> = {
  "肉・魚介": "text-red-600 bg-red-50",
  "野菜": "text-green-600 bg-green-50",
  "豆腐・卵": "text-purple-600 bg-purple-50",
  "調味料・その他": "text-gray-600 bg-gray-50",
};

function inferIngredients(title: string): { name: string; category: Category }[] {
  const results: { name: string; category: Category }[] = [];
  for (const entry of INGREDIENT_MAP) {
    if (entry.keywords.some((kw) => title.includes(kw))) {
      for (const item of entry.items) {
        if (!results.find((r) => r.name === item.name)) {
          results.push(item);
        }
      }
    }
  }
  return results;
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("調味料・その他");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("weekly_plan").select("*").eq("user_id", data.user.id).then(({ data: planData }) => {
          if (planData) {
            const seen = new Set<string>();
            const autoItems: Item[] = [];
            planData.forEach((row: Record<string, string>) => {
              const inferred = inferIngredients(row.title);
              inferred.forEach((ing) => {
                if (!seen.has(ing.name)) {
                  seen.add(ing.name);
                  autoItems.push({ id: crypto.randomUUID(), name: ing.name, category: ing.category, checked: false, auto: true });
                }
              });
            });
            setItems(autoItems);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const addItem = () => {
    const name = newItem.trim();
    if (!name) return;
    if (items.find((i) => i.name === name)) { setNewItem(""); return; }
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name, category: newCategory, checked: false, auto: false }]);
    setNewItem("");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearChecked = () => {
    setItems((prev) => prev.filter((i) => !i.checked));
  };

  if (loading) return <p className="text-gray-400 text-sm text-center mt-12">読み込み中...</p>;

  if (!user) return (
    <div className="text-center mt-12">
      <p className="text-gray-500 mb-4">買い物リストを使うにはログインが必要です。</p>
    </div>
  );

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = items.filter((i) => i.category === cat);
    return acc;
  }, {} as Record<Category, Item[]>);

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">買い物リスト</h1>
        {checkedCount > 0 && (
          <button
            onClick={clearChecked}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            チェック済みを削除 ({checkedCount})
          </button>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm text-center mt-8 mb-6">
          週間プランにレシピを追加すると食材が自動で表示されます
        </p>
      )}

      {/* カテゴリ別リスト */}
      <div className="space-y-4 mb-6">
        {CATEGORY_ORDER.map((cat) => {
          const catItems = grouped[cat];
          if (catItems.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2 ${CATEGORY_COLORS[cat]}`}>
                {cat}
              </h2>
              <ul className="space-y-1">
                {catItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <button
                      onClick={() => toggle(item.id)}
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        item.checked ? "bg-orange-500 border-orange-500" : "border-gray-300 hover:border-orange-400"
                      }`}
                    >
                      {item.checked && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                    <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {item.name}
                    </span>
                    {!item.auto && (
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-xs">
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 手動追加 */}
      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 mb-2">手動で追加</p>
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as Category)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="食材を入力..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={addItem}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
