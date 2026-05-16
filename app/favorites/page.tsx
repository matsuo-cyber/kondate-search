"use client";

import { useState, useEffect } from "react";
import RecipeCard, { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from("favorites")
          .select("*")
          .eq("user_id", data.user.id)
          .then(({ data: favs }) => {
            if (favs) setFavorites(favs as Recipe[]);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const toggleFavorite = async (recipe: Recipe) => {
    if (!user) return;
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("link", recipe.link);
    setFavorites((prev) => prev.filter((r) => r.link !== recipe.link));
  };

  if (loading) return <p className="text-gray-400 text-sm text-center mt-12">読み込み中...</p>;

  if (!user) return (
    <div className="text-center mt-12">
      <p className="text-gray-500 mb-4">お気に入りを保存するにはログインが必要です。</p>
    </div>
  );

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
