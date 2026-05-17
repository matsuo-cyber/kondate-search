"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
  { keywords: ["唐揚げ", "から揚げ", "からあげ", "竜田揚げ"], items: [{ name: "鶏もも肉", category: "肉・魚介" }, { name: "醤油", category: "調味料・その他" }, { name: "にんにく", category: "野菜" }, { name: "しょうが", category: "野菜" }] },
  { keywords: ["鶏むね", "鶏胸", "チキン"], items: [{ name: "鶏むね肉", category: "肉・魚介" }] },
  { keywords: ["鶏もも", "鶏肉"], items: [{ name: "鶏もも肉", category: "肉・魚介" }] },
  { keywords: ["ハンバーグ"], items: [{ name: "合い挽き肉", category: "肉・魚介" }, { name: "玉ねぎ", category: "野菜" }, { name: "卵", category: "豆腐・卵" }, { name: "パン粉", category: "調味料・その他" }] },
  { keywords: ["豚肉", "ポーク", "豚バラ", "豚ロース", "生姜焼き", "しょうが焼き", "豚"], items: [{ name: "豚肉", category: "肉・魚介" }] },
  { keywords: ["牛肉", "ビーフ", "すき焼き", "しゃぶしゃぶ"], items: [{ name: "牛肉", category: "肉・魚介" }] },
  { keywords: ["鮭", "サーモン"], items: [{ name: "鮭", category: "肉・魚介" }] },
  { keywords: ["さば", "鯖", "サバ"], items: [{ name: "さば", category: "肉・魚介" }] },
  { keywords: ["さんま", "秋刀魚"], items: [{ name: "さんま", category: "肉・魚介" }] },
  { keywords: ["えび", "海老", "エビ"], items: [{ name: "えび", category: "肉・魚介" }] },
  { keywords: ["刺身", "刺し身", "お刺身"], items: [{ name: "刺身（お好みで）", category: "肉・魚介" }] },
  { keywords: ["ぶり", "鰤"], items: [{ name: "ぶり", category: "肉・魚介" }] },
  { keywords: ["たら", "鱈"], items: [{ name: "たら", category: "肉・魚介" }] },
  { keywords: ["あじ", "鯵"], items: [{ name: "あじ", category: "肉・魚介" }] },
  { keywords: ["豆腐", "麻婆", "マーボー"], items: [{ name: "豆腐", category: "豆腐・卵" }] },
  { keywords: ["納豆"], items: [{ name: "納豆", category: "豆腐・卵" }] },
  { keywords: ["卵", "玉子", "オムレツ", "目玉焼き", "卵焼き", "親子丼", "茶碗蒸し"], items: [{ name: "卵", category: "豆腐・卵" }] },
  { keywords: ["パスタ", "スパゲッティ", "ミートソース", "ペペロンチーノ", "カルボナーラ"], items: [{ name: "パスタ", category: "調味料・その他" }] },
  { keywords: ["ラーメン"], items: [{ name: "ラーメン（麺）", category: "調味料・その他" }] },
  { keywords: ["うどん"], items: [{ name: "うどん", category: "調味料・その他" }] },
  { keywords: ["そば"], items: [{ name: "そば", category: "調味料・その他" }] },
  { keywords: ["チャーハン", "炒飯"], items: [{ name: "ご飯（冷や飯）", category: "調味料・その他" }, { name: "卵", category: "豆腐・卵" }] },
  { keywords: ["サラダ"], items: [{ name: "レタス", category: "野菜" }, { name: "きゅうり", category: "野菜" }, { name: "トマト", category: "野菜" }] },
  { keywords: ["野菜炒め", "炒め物", "炒め"], items: [{ name: "キャベツ", category: "野菜" }, { name: "にんじん", category: "野菜" }, { name: "もやし", category: "野菜" }] },
  { keywords: ["味噌汁", "みそ汁", "お味噌汁"], items: [{ name: "味噌", category: "調味料・その他" }, { name: "豆腐", category: "豆腐・卵" }, { name: "わかめ", category: "野菜" }] },
  { keywords: ["餃子", "ギョーザ", "ぎょうざ"], items: [{ name: "餃子の皮", category: "調味料・その他" }, { name: "豚ひき肉", category: "肉・魚介" }, { name: "キャベツ", category: "野菜" }, { name: "ニラ", category: "野菜" }] },
  { keywords: ["グラタン"], items: [{ name: "ホワイトソース", category: "調味料・その他" }, { name: "マカロニ", category: "調味料・その他" }, { name: "チーズ", category: "豆腐・卵" }] },
  { keywords: ["ピザ"], items: [{ name: "ピザ生地", category: "調味料・その他" }, { name: "チーズ", category: "豆腐・卵" }, { name: "トマトソース", category: "調味料・その他" }] },
  { keywords: ["天ぷら", "天丼", "てんぷら"], items: [{ name: "天ぷら粉", category: "調味料・その他" }, { name: "えび", category: "肉・魚介" }, { name: "さつまいも", category: "野菜" }] },
  { keywords: ["煮物", "煮込み", "煮付け"], items: [{ name: "だし", category: "調味料・その他" }, { name: "醤油", category: "調味料・その他" }, { name: "みりん", category: "調味料・その他" }] },
  { keywords: ["焼き魚", "塩焼き"], items: [{ name: "魚（お好みで）", category: "肉・魚介" }, { name: "塩", category: "調味料・その他" }] },
  { keywords: ["丼", "どんぶり"], items: [{ name: "ご飯", category: "調味料・その他" }] },
  { keywords: ["揚げ物", "フライ", "カツ", "とんかつ"], items: [{ name: "パン粉", category: "調味料・その他" }, { name: "卵", category: "豆腐・卵" }, { name: "薄力粉", category: "調味料・その他" }] },
  { keywords: ["鍋", "なべ", "すき焼き", "しゃぶしゃぶ"], items: [{ name: "だし", category: "調味料・その他" }, { name: "白菜", category: "野菜" }, { name: "ねぎ", category: "野菜" }, { name: "豆腐", category: "豆腐・卵" }] },
  { keywords: ["ポトフ"], items: [{ name: "ウインナー", category: "肉・魚介" }, { name: "じゃがいも", category: "野菜" }, { name: "にんじん", category: "野菜" }, { name: "玉ねぎ", category: "野菜" }] },
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
  const [recipes, setRecipes] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("調味料・その他");
  const [showRecipes, setShowRecipes] = useState(false);

  const loadFromPlan = (planData: Record<string, string>[]) => {
    const seen = new Set<string>();
    const autoItems: Item[] = [];
    const titles: string[] = [];

    planData.forEach((row) => {
      titles.push(row.title);
      const inferred = inferIngredients(row.title);
      inferred.forEach((ing) => {
        if (!seen.has(ing.name)) {
          seen.add(ing.name);
          autoItems.push({ id: crypto.randomUUID(), name: ing.name, category: ing.category, checked: false, auto: true });
        }
      });
    });

    setRecipes(titles);
    setItems((prev) => {
      const manual = prev.filter((i) => !i.auto);
      return [...autoItems, ...manual];
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("weekly_plan").select("*").eq("user_id", data.user.id).then(({ data: planData }) => {
          if (planData) loadFromPlan(planData as Record<string, string>[]);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const reload = async () => {
    if (!user) return;
    const { data: planData } = await supabase.from("weekly_plan").select("*").eq("user_id", user.id);
    if (planData) loadFromPlan(planData as Record<string, string>[]);
  };

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
  const autoCount = items.filter((i) => i.auto).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">買い物リスト</h1>
        <div className="flex gap-2">
          <button
            onClick={reload}
            className="text-sm text-orange-500 border border-orange-300 px-3 py-1 rounded-lg hover:bg-orange-50 transition-colors"
          >
            再読み込み
          </button>
          {checkedCount > 0 && (
            <button onClick={clearChecked} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
              チェック済みを削除
            </button>
          )}
        </div>
      </div>

      {/* 週間プランの読み込み状況 */}
      <button
        onClick={() => setShowRecipes(!showRecipes)}
        className="w-full text-left text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4 hover:bg-gray-100 transition-colors"
      >
        週間プランから {recipes.length} 件のレシピを読み込み・{autoCount} 種類の食材を自動検出
        <span className="ml-1">{showRecipes ? "▲" : "▼"}</span>
      </button>

      {showRecipes && (
        <ul className="mb-4 space-y-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          {recipes.length === 0 ? (
            <li>週間プランにレシピが登録されていません</li>
          ) : (
            recipes.map((title, i) => (
              <li key={i} className="truncate">・{title}</li>
            ))
          )}
        </ul>
      )}

      {items.length === 0 && (
        <p className="text-gray-400 text-sm text-center mt-4 mb-6">
          {recipes.length === 0
            ? "週間プランにレシピを追加すると食材が自動で表示されます"
            : "レシピ名から食材を自動検出できませんでした。下の手動追加を使ってください"}
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
                      {!item.auto && <span className="text-xs text-gray-400 ml-1">（手動）</span>}
                    </span>
                    {!item.auto && (
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
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
