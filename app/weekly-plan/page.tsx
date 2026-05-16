"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

type Plan = Record<string, { lunch: Recipe | null; dinner: Recipe | null }>;

const emptyPlan = (): Plan =>
  Object.fromEntries(DAYS.map((d) => [d, { lunch: null, dinner: null }]));

export default function WeeklyPlanPage() {
  const [plan, setPlan] = useState<Plan>(emptyPlan());
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [selecting, setSelecting] = useState<{ day: string; meal: "lunch" | "dinner" } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = getSessionId();
    Promise.all([
      supabase.from("weekly_plan").select("*").eq("session_id", sessionId),
      supabase.from("favorites").select("*").eq("session_id", sessionId),
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
  }, []);

  const assign = async (recipe: Recipe) => {
    if (!selecting) return;
    const sessionId = getSessionId();
    await supabase
      .from("weekly_plan")
      .delete()
      .eq("session_id", sessionId)
      .eq("day", selecting.day)
      .eq("meal_type", selecting.meal);
    await supabase.from("weekly_plan").insert({
      session_id: sessionId,
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
    const sessionId = getSessionId();
    await supabase
      .from("weekly_plan")
      .delete()
      .eq("session_id", sessionId)
      .eq("day", day)
      .eq("meal_type", meal);
    setPlan((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: null } }));
  };

  if (loading) return <p className="text-gray-400 text-sm text-center mt-12">読み込み中...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">週間献立プラン</h1>
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
                          <a
                            href={recipe.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline line-clamp-2 block"
                          >
                            {recipe.title}
                          </a>
                          <button
                            onClick={() => remove(day, meal)}
                            className="text-gray-400 hover:text-red-400 mt-1"
                          >
                            ✕ 削除
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelecting({ day, meal })}
                          className="w-full h-12 border border-dashed border-gray-300 rounded text-gray-400 hover:border-orange-400 hover:text-orange-400 text-xs transition-colors"
                        >
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
              <p className="text-gray-400 text-sm">
                お気に入りがありません。先に検索ページでお気に入りを追加してください。
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {favorites.map((r) => (
                  <li key={r.link}>
                    <button
                      onClick={() => assign(r)}
                      className="w-full text-left text-sm p-2 rounded hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-colors"
                    >
                      {r.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setSelecting(null)}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
