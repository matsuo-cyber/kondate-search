"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const links = [
  { href: "/", label: "検索" },
  { href: "/favorites", label: "お気に入り" },
  { href: "/weekly-plan", label: "週間プラン" },
  { href: "/shopping-list", label: "買い物リスト" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className="bg-orange-500 text-white px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-lg">🍱 献立検索</span>

        {/* デスクトップメニュー */}
        <div className="hidden sm:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium hover:underline ${pathname === l.href ? "underline" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-80">{user.email}</span>
              <button
                onClick={signOut}
                className="text-xs bg-white text-orange-500 px-3 py-1 rounded-full font-medium hover:bg-orange-50"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="text-xs bg-white text-orange-500 px-3 py-1 rounded-full font-medium hover:bg-orange-50"
            >
              Googleでログイン
            </button>
          )}
        </div>

        {/* モバイルハンバーガー */}
        <button
          className="sm:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* モバイルドロップダウン */}
      {menuOpen && (
        <div className="sm:hidden mt-3 flex flex-col gap-3 border-t border-orange-400 pt-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium hover:underline ${pathname === l.href ? "underline" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <span className="text-xs opacity-80">{user.email}</span>
              <button
                onClick={signOut}
                className="text-xs bg-white text-orange-500 px-3 py-1 rounded-full font-medium w-fit"
              >
                ログアウト
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="text-xs bg-white text-orange-500 px-3 py-1 rounded-full font-medium w-fit"
            >
              Googleでログイン
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
