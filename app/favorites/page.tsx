"use client";

import { useState, useEffect } from "react";
import RecipeCard, { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = getSessionId();
    supabase
      .from("favorites")
      .select("*")
      .eq("session_id", sessionId)
      .then(({ data }) => {
        if (data) setFavorites(data as Recipe[]);
        setLoading(false);
      });
  }, []);

  const toggleFavorite = async (recipe: Recipe) => {
    const sessionId = getSessionId();
    await supabase.from("favorites").delete().eq("session_id", sessionId).eq("link", recipe.link);
    setFavorites((prev) => prev.filter((r) => r.link !== recipe.link));
  };

  if (loading) return <p className="text-gray-400 text-sm text-center mt-12">読み込み中...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">お気に入り</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-400 text-sm text-center mt-12">
          お気に入りがまだありません。検索して追加してみましょう。
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map((recipe) => (
            <RecipeCard
              key={recipe.link}
              recipe={recipe}
              isFavorite={true}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
