"use client";

import { useState, useEffect } from "react";
import RecipeCard, { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  useEffect(() => {
    const sessionId = getSessionId();
    supabase
      .from("favorites")
      .select("*")
      .eq("session_id", sessionId)
      .then(({ data }) => {
        if (data) setFavorites(data as Recipe[]);
      });
  }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
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
    const sessionId = getSessionId();
    const exists = favorites.some((r) => r.link === recipe.link);
    if (exists) {
      await supabase.from("favorites").delete().eq("session_id", sessionId).eq("link", recipe.link);
      setFavorites((prev) => prev.filter((r) => r.link !== recipe.link));
    } else {
      await supabase.from("favorites").insert({
        session_id: sessionId,
        title: recipe.title,
        link: recipe.link,
        snippet: recipe.snippet,
        image: recipe.image,
      });
      setFavorites((prev) => [...prev, recipe]);
    }
  };

  const isFavorite = (recipe: Recipe) => favorites.some((r) => r.link === recipe.link);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">献立を検索する</h1>
      <form onSubmit={search} className="flex gap-2 mb-8">
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

      {!loading && results.length === 0 && query && (
        <p className="text-gray-400 text-sm text-center mt-12">検索結果がありませんでした</p>
      )}

      {!query && (
        <p className="text-gray-400 text-sm text-center mt-12">
          食材や料理名を入力して献立を探しましょう
        </p>
      )}
    </div>
  );
}
