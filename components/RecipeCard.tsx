"use client";

export type Recipe = {
  title: string;
  link: string;
  snippet: string;
  image: string | null;
};

type Props = {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
};

export default function RecipeCard({ recipe, isFavorite, onToggleFavorite }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-40 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div className="p-3">
        <a
          href={recipe.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-orange-600 hover:underline line-clamp-2"
        >
          {recipe.title}
        </a>
        <p className="text-sm text-gray-500 mt-1 line-clamp-3">{recipe.snippet}</p>
        <button
          onClick={() => onToggleFavorite(recipe)}
          className={`mt-2 text-sm px-3 py-1 rounded-full border transition-colors ${
            isFavorite
              ? "bg-orange-500 text-white border-orange-500"
              : "text-orange-500 border-orange-500 hover:bg-orange-50"
          }`}
        >
          {isFavorite ? "★ お気に入り済み" : "☆ お気に入り"}
        </button>
      </div>
    </div>
  );
}
