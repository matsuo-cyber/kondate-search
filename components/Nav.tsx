"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "検索" },
  { href: "/favorites", label: "お気に入り" },
  { href: "/weekly-plan", label: "週間プラン" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-orange-500 text-white px-4 py-3 flex items-center gap-6">
      <span className="font-bold text-lg mr-4">🍱 献立検索</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm font-medium hover:underline ${pathname === l.href ? "underline" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
