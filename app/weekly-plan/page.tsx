"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];
type Plan = Record<string, { lunch: Recipe | null; dinner: Recipe | null }>;
const emptyPlan = (): Plan =>
  Object.fromEntries(DAYS.map((d) => [d, { lunch: null, dinner: null }]));

type CategoryKey = "vegetable" | "protein_meat" | "protein_fish" | "carbs" | "soy";

const CATEGORIES: Record<CategoryKey, { label: string; keywords: string[]; color: string; advice: string }> = {
  vegetable: {
    label: "野菜・きのこ",
    keywords: ["野菜", "サラダ", "レタス", "キャベツ", "ほうれん草", "ブロッコリー", "きのこ", "しいたけ", "なす", "トマト", "にんじん", "玉ねぎ", "大根", "ごぼう", "小松菜", "菜", "炒め", "煮物", "漬け"],
    color: "bg-green-500",
    advice: "野菜をもっと取り入れましょう",
  },
  protein_meat: {
    label: "肉類",
    keywords: ["鶏", "豚", "牛", "肉", "ハンバーグ", "唐揚げ", "から揚げ", "チキン", "ポーク", "ビーフ", "ソーセージ", "ベーコン", "焼き肉"],
    color: "bg-red-400",
    advice: "肉類のメニューを追加しましょう",
  },
  protein_fish: {
    label: "魚・海鮮",
    keywords: ["魚", "鮭", "サーモン", "マグロ", "刺身", "寿司", "海鮮", "さば", "さんま", "鯖", "秋刀魚", "あじ", "えび", "たこ", "いか", "貝", "魚介", "焼き魚"],
    color: "bg-blue-400",
    advice: "魚料理を週2〜3回取り入れましょう",
  },
  carbs: {
    label: "炭水化物",
    keywords: ["パスタ", "うどん", "そば", "ラーメン", "パン", "麺", "丼", "チャーハン", "リゾット", "カレー", "シチュー", "ピザ", "グラタン"],
    color: "bg-yellow-400",
    advice: "炭水化物のバランスを整えましょう",
  },
  soy: {
    label: "豆・大豆製品",
    keywords: ["豆腐", "納豆", "味噌", "豆", "おから", "枝豆", "大豆", "厚揚げ", "油揚げ"],
    color: "bg-purple-400",
    advice: "豆腐・納豆など大豆製品も取り入れましょう",
  },
};

function analyzeNutrition(plan: Plan) {
  const counts: Record<CategoryKey, number> = {
    vegetable: 0, protein_meat: 0, protein_fish: 0, carbs: 0, soy: 0,
  };
  let total = 0;

  for (const day of DAYS) {
    for (const meal of ["lunch", "dinner"] as const) {
      const recipe = plan[day][meal];
      if (!recipe) continue;
      total++;
      const title = recipe.title;
      for (const [key, cat] of Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]) {
        if (cat.keywords.some((kw) => title.includes(kw))) {
          counts[key]++;
          break;
        }
      }
    }
  }

  const advices: string[] = [];
  if (total === 0) return { counts, total, advices: ["献立を入力するとバランスを分析します"] };

  if (counts.vegetable === 0) advices.push("🥦 " + CATEGORIES.vegetable.advice);
  if (counts.protein_fish === 0) advices.push("🐟 " + CATEGORIES.protein_fish.advice);
  if (counts.soy === 0) advices.push("🫘 " + CATEGORIES.soy.advice);

  const meatRatio = counts.protein_meat / total;
  if (meatRatio > 0.5) advices.push("🥩 肉類が多めです。魚や野菜も増やしましょう");

  if (advices.length === 0) advices.push("✅ バランスの取れた献立です！");

  return { counts, total, advices };
}

export default function WeeklyPlanPage() {
  const [plan, setPlan] = useState<Plan>(emptyPlan());
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [selecting, setSelecting] = useState<{ day: string; meal: "lunch" | "dinner" } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNutrition, setShowNutrition] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        Promise.all([
          supabase.from("weekly_plan").select("*").eq("user_id", data.user.id),
          supabase.from("favorites").select("*").eq("user_id", data.user.id),
        ]).then(([{ data: planData }, { data: favData }]) => {
          if (planData) {
            const newPlan = emptyPlan();
            planData.forEach((row: Record<string, string>) => {
              const meal = row.meal_type as "lunch" | "dinner";
              newPlan[row.day][meal] = {
                title: row.title,
                link: row.link,
                snippet: row.snippet,
                image: row.image,
              };
            });
            setPlan(newPlan);
          }
          if (favData) setFavorites(favData as Recipe[]);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const assign = async (recipe: Recipe) => {
    if (!selecting || !user) return;
    await supabase
      .from("weekly_plan")
      .delete()
      .eq("user_id", user.id)
      .eq("day", selecting.day)
      .eq("meal_type", selecting.meal);
    await supabase.from("weekly_plan").insert({
      user_id: user.id,
      day: selecting.day,
      meal_type: selecting.meal,
      title: recipe.title,
      link: recipe.link,
      snippet: recipe.snippet,
      image: recipe.image,
    });
    setPlan((prev) => ({
      ...prev,
      [selecting.day]: { ...prev[selecting.day], [selecting.meal]: recipe },
    }));
    setSelecting(null);
  };

  const remove = async (day: string, meal: "lunch" | "dinner") => {
    if (!user) return;
    await supabase.from("weekly_plan").delete().eq("user_id", user.id).eq("day", day).eq("meal_type", meal);
    setPlan((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: null } }));
  };

  if (loading) return <p className="text-gray-400 text-sm text-center mt-12">読み込み中...</p>;

  if (!user) return (
    <div className="text-center mt-12">
      <p className="text-gray-500 mb-4">週間プランを使うにはログインが必要です。</p>
    </div>
  );

  const nutrition = analyzeNutrition(plan);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">週間献立プラン</h1>
        <button
          onClick={() => setShowNutrition(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          栄養バランスチェック
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-gray-500 w-12"></th>
              {DAYS.map((d) => (
                <th key={d} className="p-2 text-center font-semibold text-gray-700 border-b">
                  {d}曜
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["lunch", "dinner"] as const).map((meal) => (
              <tr key={meal}>
                <td className="p-2 text-gray-500 font-medium text-xs">
                  {meal === "lunch" ? "昼" : "夜"}
                </td>
                {DAYS.map((day) => {
                  const recipe = plan[day][meal];
                  return (
                    <td key={day} className="p-1 border align-top">
                      {recipe ? (
                        <div className="bg-orange-50 rounded p-1 text-xs">
                          <a href={recipe.link} target="_blank" rel="noopener noreferrer"
                            className="text-orange-600 hover:underline line-clamp-2 block">
                            {recipe.title}
                          </a>
                          <button onClick={() => remove(day, meal)} className="text-gray-400 hover:text-red-400 mt-1">
                            ✕ 削除
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setSelecting({ day, meal })}
                          className="w-full h-12 border border-dashed border-gray-300 rounded text-gray-400 hover:border-orange-400 hover:text-orange-400 text-xs transition-colors">
                          ＋
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selecting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-lg mb-4">
              {selecting.day}曜・{selecting.meal === "lunch" ? "昼" : "夜"}のレシピを選ぶ
            </h2>
            {favorites.length === 0 ? (
              <p className="text-gray-400 text-sm">お気に入りがありません。先に検索ページでお気に入りを追加してください。</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {favorites.map((r) => (
                  <li key={r.link}>
                    <button onClick={() => assign(r)}
                      className="w-full text-left text-sm p-2 rounded hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-colors">
                      {r.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setSelecting(null)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {showNutrition && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-lg mb-4">栄養バランスチェック</h2>
            <p className="text-xs text-gray-400 mb-4">
              登録済み {nutrition.total} 食分を分析しました
            </p>

            <div className="space-y-3 mb-5">
              {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([key, cat]) => {
                const count = nutrition.counts[key];
                const pct = nutrition.total > 0 ? Math.round((count / nutrition.total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{cat.label}</span>
                      <span className="text-gray-500">{count}食 ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${cat.color} h-2 rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {nutrition.advices.map((msg, i) => (
                <p key={i} className="text-sm text-gray-700">{msg}</p>
              ))}
            </div>

            <button onClick={() => setShowNutrition(false)} className="mt-5 text-sm text-gray-400 hover:text-gray-600">
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
