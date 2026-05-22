"use client";

import { useState, useEffect, useCallback } from "react";
import RecipeCard, { Recipe } from "@/components/RecipeCard";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const PAGE_SIZE = 10;

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFavorites = useCallback(async (userId: string, currentPage: number) => {
    setLoading(true);
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("favorites")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .range(from, to);
    if (data) setFavorites(data as Recipe[]);
    if (count !== null) setTotalCount(count);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchFavorites(data.user.id, 0);
      } else {
        setLoading(false);
      }
    });
  }, [fetchFavorites]);

  useEffect(() => {
    if (user) fetchFavorites(user.id, page);
  }, [page, user, fetchFavorites]);

  const toggleFavorite = async (recipe: Recipe) => {
    if (!user) return;
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("link", recipe.link);
    setFavorites((prev) => prev.filter((r) => r.link !== recipe.link));
    setTotalCount((prev) => prev - 1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (!loading && !user) return (
    <div className="text-center mt-12">
      <p className="text-gray-500 mb-4">お気に入りを保存するにはログインが必要です。</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">お気に入り</h1>
      {loading ? (
        <p className="text-gray-400 text-sm text-center mt-12">読み込み中...</p>
      ) : favorites.length === 0 && totalCount === 0 ? (
        <p className="text-gray-400 text-sm text-center mt-12">
          お気に入りがまだありません。検索して追加してみましょう。
        </p>
      ) : (
        <>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                ← 前へ
              </button>
              <span className="text-sm text-gray-600">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                次へ →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
