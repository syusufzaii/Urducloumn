import { useEffect, useState } from "react";
import { Article } from "../types";

interface BreakingBarProps {
  onSelectArticle: (slug: string) => void;
}

export default function BreakingBar({ onSelectArticle }: BreakingBarProps) {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetch("/api/v1/articles")
      .then((res) => res.json())
      .then((data: Article[]) => {
        setArticles(data.slice(0, 5));
      })
      .catch(console.error);
  }, []);

  if (articles.length === 0) return null;

  return (
    <div className="bg-brand-green-dark text-white border-b border-brand-gold/20 h-10 flex items-center overflow-hidden relative z-40 select-none">
      {/* Label */}
      <div className="bg-brand-gold text-brand-green-dark text-xs font-bold px-4 h-full flex items-center justify-center shadow-lg font-sans z-10 whitespace-nowrap">
        تازہ ترین کالمز
      </div>

      {/* Decorative arrow */}
      <div className="w-0 h-0 border-t-[20px] border-t-transparent border-r-[12px] border-r-brand-gold border-b-[20px] border-b-transparent z-10 rtl:rotate-180"></div>

      {/* Ticker marquee */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="absolute flex whitespace-nowrap animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] gap-12 pl-12">
          {articles.map((art) => (
            <button
              key={art.id}
              onClick={() => onSelectArticle(art.slug)}
              className="text-xs hover:text-brand-gold font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span className="inline-block w-1.5 h-1.5 bg-brand-gold rounded-full"></span>
              {art.title}
            </button>
          ))}
          {/* Double content to ensure infinite smooth scroll */}
          {articles.map((art) => (
            <button
              key={`${art.id}-dup`}
              onClick={() => onSelectArticle(art.slug)}
              className="text-xs hover:text-brand-gold font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span className="inline-block w-1.5 h-1.5 bg-brand-gold rounded-full"></span>
              {art.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
