"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import RecipeCard, { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Mode = "keyword" | "ingredient";

export default function Home() {
  const [mode, setMode] = useState<Mode>("keyword");
  const [query, setQuery] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("favorites").select("*").eq("user_id", data.user.id).then(({ data: favs }) => {
          if (favs) setFavorites(favs as Recipe[]);
        });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("favorites").select("*").eq("user_id", session.user.id).then(({ data: favs }) => {
          if (favs) setFavorites(favs as Recipe[]);
        });
      } else {
        setFavorites([]);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const addIngredient = () => {
    const val = ingredientInput.trim();
    if (val && !ingredients.includes(val)) {
      setIngredients((prev) => [...prev, val]);
    }
    setIngredientInput("");
  };

  const handleIngredientKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient();
    }
  };

  const removeIngredient = (item: string) => {
    setIngredients((prev) => prev.filter((i) => i !== item));
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery =
      mode === "keyword" ? query : ingredients.join(" ");
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "検索に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipe: Recipe) => {
    if (!user) {
      setError("お気に入りを保存するにはログインしてください");
      return;
    }
    const exists = favorites.some((r) => r.link === recipe.link);
    if (exists) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("link", recipe.link);
      if (error) { setError("削除に失敗しました: " + error.message); return; }
      setFavorites((prev) => prev.filter((r) => r.link !== recipe.link));
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        title: recipe.title,
        link: recipe.link,
        snippet: recipe.snippet,
        image: recipe.image,
      });
      if (error) { setError("お気に入りの保存に失敗しました: " + error.message); return; }
      setFavorites((prev) => [...prev, recipe]);
    }
  };

  const isFavorite = (recipe: Recipe) => favorites.some((r) => r.link === recipe.link);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">献立を検索する</h1>

      {!user && (
        <p className="text-sm text-orange-500 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4">
          ログインするとお気に入りや週間プランがどのデバイスからでも使えます。
        </p>
      )}

      {/* タブ */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode("keyword"); setResults([]); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === "keyword" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          キーワードで探す
        </button>
        <button
          onClick={() => { setMode("ingredient"); setResults([]); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === "ingredient" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          食材から探す
        </button>
      </div>

      <form onSubmit={search} className="mb-8">
        {mode === "keyword" ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: 鶏むね肉 簡単、野菜炒め..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "検索中..." : "検索"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-2">冷蔵庫にある食材を入力してEnterで追加してください</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={handleIngredientKey}
                placeholder="例: 鶏肉、玉ねぎ、じゃがいも..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                追加
              </button>
            </div>
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {ingredients.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeIngredient(item)}
                      className="hover:text-orange-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || ingredients.length === 0}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "検索中..." : "この食材で献立を探す"}
            </button>
          </div>
        )}
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map((recipe) => (
            <RecipeCard
              key={recipe.link}
              recipe={recipe}
              isFavorite={isFavorite(recipe)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (mode === "keyword" ? query : ingredients.length > 0) && (
        <p className="text-gray-400 text-sm text-center mt-12">検索結果がありませんでした</p>
      )}

      {(mode === "keyword" ? !query : ingredients.length === 0) && !loading && results.length === 0 && (
        <p className="text-gray-400 text-sm text-center mt-12">
          {mode === "keyword" ? "食材や料理名を入力して献立を探しましょう" : "食材を追加して献立を探しましょう"}
        </p>
      )}
    </div>
  );
}
