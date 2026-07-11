import { useEffect, useState } from "react";
import { Ad } from "../types";

interface AdSlotProps {
  size: "leaderboard" | "square" | "skyscraper" | "mobile-sticky";
  dataSaver: boolean;
  className?: string;
}

export default function AdSlot({ size, dataSaver, className = "" }: AdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch active ads
    fetch("/api/v1/ads")
      .then((res) => res.json())
      .then((data: Ad[]) => {
        // Filter active ads of matching size and device targeting
        const isMobile = window.innerWidth < 768;
        const matching = data.filter(
          (item) =>
            item.active &&
            item.size === size &&
            (item.deviceTarget === "all" ||
              (item.deviceTarget === "mobile" && isMobile) ||
              (item.deviceTarget === "desktop" && !isMobile))
        );

        if (matching.length > 0) {
          // Select random ad from candidates
          const selected = matching[Math.floor(Math.random() * matching.length)];
          setAd(selected);

          // Register impression on server
          fetch(`/api/v1/ads/${selected.id}/impression`, { method: "POST" }).catch(console.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load ads:", err);
        setLoading(false);
      });
  }, [size]);

  const handleAdClick = () => {
    if (ad) {
      fetch(`/api/v1/ads/${ad.id}/click`, { method: "POST" }).catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-stone-400 text-xs rounded border border-stone-200 animate-pulse ${
        size === "leaderboard" ? "h-24 w-full" : size === "square" ? "h-64 w-full" : "h-12 w-full"
      }`}>
        کمرشل اشتہار لوڈ ہو رہا ہے...
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div className={`relative mx-auto overflow-hidden text-center transition-all ${className} ${
      size === "leaderboard" ? "max-w-4xl" : size === "square" ? "max-w-sm" : ""
    }`}>
      {/* Label */}
      <div className="absolute top-0 right-2 z-10 bg-black/60 px-2 py-0.5 text-[10px] text-stone-300 rounded-b uppercase font-sans tracking-wide">
        اشتہار (AD)
      </div>

      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className="block group"
        id={`ad-link-${ad.id}`}
      >
        {dataSaver ? (
          // Extreme Text-Only Data Saver Mode for 2G/3G connections
          <div className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-stone-900 border-2 border-dashed border-brand-gold/40 rounded text-center">
            <span className="text-xs font-semibold text-brand-gold-dark mb-1">اسپانسرڈ لنک</span>
            <span className="text-sm font-medium text-stone-800 dark:text-stone-200 hover:underline">
              {ad.title} 🌐
            </span>
          </div>
        ) : (
          // Elegant Rich-Image Ad Layout
          <div className="relative overflow-hidden rounded shadow-sm hover:shadow-md transition-shadow">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover max-h-64 md:max-h-96 group-hover:scale-[1.01] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
              <span className="text-xs text-white font-medium">{ad.title}</span>
            </div>
          </div>
        )}
      </a>
    </div>
  );
}
