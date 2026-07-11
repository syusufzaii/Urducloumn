import { useEffect, useState } from "react";
import { Writer, Article, Category } from "../types";
import { Twitter, Facebook, Globe, FileText, Eye, Calendar, Award, Share2, Copy, Check, X, BadgeCheck, Clock } from "lucide-react";

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.019-5.115-2.875-6.973C16.592 1.883 14.111.861 11.48.859c-5.44 0-9.865 4.42-9.868 9.864-.001 1.77.462 3.5 1.341 5.023l-.986 3.6 3.69-.968zm11.332-6.52c-.314-.157-1.854-.915-2.137-1.019-.282-.105-.488-.157-.692.157-.204.314-.79.1-.968.314-.178.204-.356.23-.67.073-.314-.157-1.326-.49-2.527-1.561-.933-.833-1.564-1.861-1.747-2.175-.18-.314-.018-.485.138-.64.14-.14.314-.366.47-.549.157-.183.21-.314.314-.523.104-.21.052-.392-.026-.549-.079-.157-.692-1.67-.948-2.287-.25-.6-.505-.519-.692-.529-.178-.008-.382-.01-.586-.01-.204 0-.535.077-.813.382-.28.304-1.068 1.041-1.068 2.54 0 1.498 1.088 2.946 1.238 3.146.15.199 2.141 3.27 5.188 4.582.724.311 1.29.499 1.732.639.728.23 1.39.198 1.912.12.583-.088 1.854-.758 2.115-1.453.26-.695.26-1.29.183-1.413-.077-.122-.28-.198-.59-.356z" />
  </svg>
);

const XBrandIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookBrandIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

interface WriterProfileProps {
  writerSlug: string;
  onSelectArticle: (slug: string) => void;
  onBack: () => void;
}

export default function WriterProfile({ writerSlug, onSelectArticle, onBack }: WriterProfileProps) {
  const [writer, setWriter] = useState<Writer | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [openShareArticleId, setOpenShareArticleId] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}#/writer/${writerSlug}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyArticleLink = (slug: string, id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/article/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedArticleId(id);
    setTimeout(() => setCopiedArticleId(null), 2500);
  };

  useEffect(() => {
    setLoading(true);
    // Fetch writer profile
    fetch(`/api/v1/writers/${writerSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Writer not found");
        return res.json();
      })
      .then((data: Writer) => {
        setWriter(data);

        // Fetch articles and categories in parallel
        Promise.all([
          fetch(`/api/v1/articles?writer=${writerSlug}`).then((r) => r.json()),
          fetch(`/api/v1/categories`).then((r) => r.json())
        ])
          .then(([arts, cats]) => {
            setArticles(arts);
            setCategories(cats);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Failed to load data", err);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [writerSlug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-500 animate-pulse font-sans">
        مؤلف کا پروفائل لوڈ کیا جا رہا ہے...
      </div>
    );
  }

  if (!writer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans">
        <h2 className="text-xl font-bold text-rose-600 mb-4 font-urdu">پروفائل تلاش کرنے میں ناکامی!</h2>
        <button onClick={onBack} className="bg-brand-green-dark text-white px-5 py-2 rounded">
          واپس جائیں
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 font-sans">
      
      {/* Banner / Card Profile */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-right">
        <img
          src={writer.image}
          alt={writer.name}
          className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-brand-gold/30 shadow-lg"
        />

        <div className="flex-1 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white font-urdu flex items-center justify-center md:justify-start gap-1">
              <span>{writer.name}</span>
              {writer.isVerified && (
                <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500/10 inline" title="تصدیق شدہ کالم نگار" />
              )}
            </h1>
            
            {/* Social icons links */}
            <div className="flex justify-center gap-2">
              {writer.socialLinks.twitter && (
                <a
                  href={writer.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-stone-100 hover:bg-brand-gold/20 hover:text-brand-gold rounded-full text-stone-600 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {writer.socialLinks.facebook && (
                <a
                  href={writer.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-stone-100 hover:bg-brand-gold/20 hover:text-brand-gold rounded-full text-stone-600 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {writer.socialLinks.website && (
                <a
                  href={writer.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-stone-100 hover:bg-brand-gold/20 hover:text-brand-gold rounded-full text-stone-600 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-brand-gold" />
              <span>مہارت: {writer.expertise}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>شمولیت: {new Date(writer.joinedAt).toLocaleDateString("ur-PK", { year: "numeric", month: "long" })}</span>
            </span>
          </div>

          <p className="text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-light text-right leading-urdu">
            {writer.bio}
          </p>

          {/* Quick writer statistics */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="grid grid-cols-2 gap-4 max-w-sm w-full sm:w-auto">
              <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/50 p-2.5 rounded-xl text-center min-w-[110px]">
                <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-bold font-urdu mb-0.5">کل مضامین</span>
                <span className="text-base font-bold font-mono text-brand-green-dark dark:text-brand-gold flex items-center justify-center gap-1">
                  <FileText className="w-4 h-4 text-brand-gold" /> {articles.length}
                </span>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/50 p-2.5 rounded-xl text-center min-w-[110px]">
                <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-bold font-urdu mb-0.5">مجموعی وزٹرز</span>
                <span className="text-base font-bold font-mono text-brand-green-dark dark:text-brand-gold flex items-center justify-center gap-1">
                  <Eye className="w-4 h-4 text-brand-gold" /> {writer.views}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-brand-green-dark font-urdu font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm hover:shadow-md transition-all cursor-pointer w-full sm:w-auto"
            >
              <Share2 className="w-4 h-4" />
              <span>پروفائل شیئر کریں</span>
            </button>
          </div>

          {/* Social Share profile container */}
          {showShareMenu && (
            <div className="mt-4 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 rounded-xl p-4 text-right space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu">پروفائل لنک شیئر کریں (Share Profile)</h4>
                <button 
                  onClick={() => setShowShareMenu(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Social Share Buttons */}
              <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`معروف کالم نگار ${writer.name} کا خصوصی پروفائل اور تمام کالمز پڑھنے کے لیے اس لنک پر کلک کریں: ${getShareUrl()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-urdu transition-colors w-full sm:w-auto"
                >
                  <span>واٹس ایپ پر شیئر کریں</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg text-xs font-bold font-urdu transition-colors w-full sm:w-auto"
                >
                  <span>فیس بک پر شیئر</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`معروف کالم نگار ${writer.name} کے کالمز اور مضامین: `)}&url=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-black hover:bg-stone-900 text-white border border-stone-800 rounded-lg text-xs font-bold font-urdu transition-colors w-full sm:w-auto"
                >
                  <span>ایکس (Twitter)</span>
                </a>
              </div>

              {/* Link Input + Copy Button */}
              <div className="flex items-center gap-2 flex-col sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-xs font-mono text-left focus:outline-none focus:border-brand-gold select-all text-stone-600 dark:text-stone-300"
                />
                <button
                  onClick={handleCopyLink}
                  className={`w-full sm:w-auto whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold font-urdu transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-brand-green-dark hover:bg-brand-green-light text-white"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "کاپی ہو گیا!" : "لنک کاپی کریں"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contributions Summary Dashboard */}
      {(() => {
        const totalArticles = articles.length;
        const totalViews = articles.reduce((sum, art) => sum + (art.views || 0), 0);
        const avgReadingTime = totalArticles
          ? (articles.reduce((sum, art) => sum + (art.readingTime || 0), 0) / totalArticles).toFixed(1)
          : "0";

        const categoryDistribution = articles.reduce((acc, art) => {
          acc[art.categoryId] = (acc[art.categoryId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 shadow-sm mb-8 text-right" dir="rtl">
            <div className="flex items-center gap-2 border-r-4 border-brand-gold pr-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white font-urdu">علمی شراکت و اثرات (Contribution Dashboard)</h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-urdu">کالم نگار کی تحریری سرگرمیوں اور قارئین کی دلچسپی کی تفصیلی رپورٹ</p>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Card 1: Total Articles */}
              <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-850 dark:to-stone-800/30 border border-stone-200/60 dark:border-stone-750/50 rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-sm">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-stone-500 dark:text-stone-400 font-urdu">کل شائع شدہ کالمز</span>
                  <span className="text-2xl font-black font-mono text-brand-green-dark dark:text-brand-gold">{totalArticles}</span>
                  <span className="block text-[10px] text-stone-400 font-urdu mt-1">مسلسل علمی شراکت</span>
                </div>
                <div className="p-3 bg-brand-green-dark/10 dark:bg-brand-gold/10 rounded-xl text-brand-green-dark dark:text-brand-gold">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Total Views */}
              <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-850 dark:to-stone-800/30 border border-stone-200/60 dark:border-stone-750/50 rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-sm">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-stone-500 dark:text-stone-400 font-urdu">مجموعی وزٹرز / ویوز</span>
                  <span className="text-2xl font-black font-mono text-brand-green-dark dark:text-brand-gold">{(totalViews || writer.views).toLocaleString("ur-PK")}</span>
                  <span className="block text-[10px] text-stone-400 font-urdu mt-1">مضامین کی کل رسائی</span>
                </div>
                <div className="p-3 bg-brand-green-dark/10 dark:bg-brand-gold/10 rounded-xl text-brand-green-dark dark:text-brand-gold">
                  <Eye className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Avg Reading Time */}
              <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-850 dark:to-stone-800/30 border border-stone-200/60 dark:border-stone-750/50 rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-sm">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-stone-500 dark:text-stone-400 font-urdu">اوسط وقتِ مطالعہ</span>
                  <span className="text-2xl font-black font-mono text-brand-green-dark dark:text-brand-gold">{avgReadingTime} <span className="text-xs font-urdu font-normal text-stone-500">منٹ</span></span>
                  <span className="block text-[10px] text-stone-400 font-urdu mt-1">فی کالم اوسط مطالعہ</span>
                </div>
                <div className="p-3 bg-brand-green-dark/10 dark:bg-brand-gold/10 rounded-xl text-brand-green-dark dark:text-brand-gold">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Categories breakdown focus */}
            {totalArticles > 0 && (
              <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800">
                <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu mb-4">پسندیدہ موضوعات کا تناسب (Topic Focus Breakdown)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {categories
                    .filter((cat) => (categoryDistribution[cat.id] || 0) > 0)
                    .map((cat) => {
                      const count = categoryDistribution[cat.id] || 0;
                      const percentage = Math.round((count / totalArticles) * 100);
                      return (
                        <div key={cat.id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-stone-850 dark:text-stone-200 font-urdu">{cat.name}</span>
                            <span className="font-mono text-stone-500">{count} کالم ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-stone-100 dark:bg-stone-800/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-brand-gold h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Writer columns list section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 font-urdu">
            {writer.name} کے کالمز اور مضامین ({articles.length})
          </h2>
        </div>

        {/* Dynamic Category Filtering Bar */}
        {(() => {
          const categoryCounts = articles.reduce((acc, art) => {
            acc[art.categoryId] = (acc[art.categoryId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const activeCategories = categories.filter((cat) => (categoryCounts[cat.id] || 0) > 0);
          const filteredArticles = selectedCategory === "all"
            ? articles
            : articles.filter((art) => art.categoryId === selectedCategory);

          return (
            <>
              {activeCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6 bg-stone-50 dark:bg-stone-800/20 p-3 rounded-2xl border border-stone-200/40 dark:border-stone-800/50">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400 font-urdu ml-2">موضوع فلٹر کریں (Categories):</span>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all font-urdu ${
                      selectedCategory === "all"
                        ? "bg-brand-gold text-brand-green-dark shadow-sm"
                        : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    تمام موضوعات ({articles.length})
                  </button>
                  {activeCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all font-urdu ${
                        selectedCategory === cat.id
                          ? "bg-brand-gold text-brand-green-dark shadow-sm"
                          : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      {cat.name} ({categoryCounts[cat.id]})
                    </button>
                  ))}
                </div>
              )}

              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-stone-500 dark:text-stone-400 font-urdu text-sm">
                  اس موضوع پر فی الحال کوئی کالم موجود نہیں ہے۔
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredArticles.map((art) => (
                    <div
                      key={art.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2.5 py-0.5 rounded font-bold font-mono">
                            {new Date(art.publishedAt).toLocaleDateString("ur-PK")}
                          </span>
                          {categories.find(c => c.id === art.categoryId) && (
                            <span className="text-[10px] text-brand-gold font-bold font-urdu">
                              #{categories.find(c => c.id === art.categoryId)?.name}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-sm font-bold font-urdu text-stone-900 dark:text-white mt-1 hover:text-brand-gold cursor-pointer leading-relaxed text-right">
                          <button onClick={() => onSelectArticle(art.slug)} className="text-right hover:underline">
                            {art.title}
                          </button>
                        </h3>
                        
                        <p className="text-[11px] text-stone-500 line-clamp-3 mt-2 font-light leading-relaxed text-right leading-urdu">
                          {art.excerpt}
                        </p>
                      </div>

                      <div className="border-t border-stone-100 dark:border-stone-800 pt-3 mt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span className="font-mono">مطالعہ کا وقت: {art.readingTime} منٹ</span>
                          <span className="font-mono">وزٹرز: {art.views}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-stone-50 dark:border-stone-800/40 pt-2.5 mt-1">
                          <button
                            onClick={() => setOpenShareArticleId(openShareArticleId === art.id ? null : art.id)}
                            className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-brand-gold dark:hover:text-brand-gold font-urdu font-bold transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>کالم شیئر کریں</span>
                          </button>

                          <button
                            onClick={() => onSelectArticle(art.slug)}
                            className="text-xs text-brand-green-dark dark:text-brand-gold hover:underline font-bold font-urdu"
                          >
                            کالم پڑھیں &larr;
                          </button>
                        </div>

                        {/* Expandable Sharing Menu for Specific Article */}
                        {openShareArticleId === art.id && (
                          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 border border-stone-200/60 dark:border-stone-700/60 space-y-3 animate-fadeIn text-right">
                            <span className="block text-[10px] font-bold text-stone-600 dark:text-stone-300 font-urdu">سوشل میڈیا پر شیئر کریں (Share Article):</span>
                            
                            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`معروف کالم نگار ${writer.name} کا خصوصی کالم "${art.title}" پڑھنے کے لیے اس لنک پر کلک کریں: ${window.location.origin}${window.location.pathname}#/article/${art.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold font-urdu transition-colors"
                              >
                                <WhatsAppIcon className="w-3 h-3" />
                                <span>واٹس ایپ</span>
                              </a>

                              <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#/article/${art.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg text-[10px] font-bold font-urdu transition-colors"
                              >
                                <FacebookBrandIcon className="w-3.5 h-3.5" />
                                <span>فیس بک</span>
                              </a>

                              <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`معروف کالم نگار ${writer.name} کا کالم: "${art.title}"`)}&url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#/article/${art.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-black hover:bg-stone-950 text-white border border-stone-800 rounded-lg text-[10px] font-bold font-urdu transition-colors"
                              >
                                <XBrandIcon className="w-3 h-3" />
                                <span>ایکس (Twitter)</span>
                              </a>

                              <button
                                onClick={() => handleCopyArticleLink(art.slug, art.id)}
                                className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-urdu transition-colors cursor-pointer ${
                                  copiedArticleId === art.id
                                    ? "bg-emerald-600 text-white"
                                    : "bg-brand-green-dark hover:bg-brand-green-light text-white"
                                }`}
                              >
                                {copiedArticleId === art.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedArticleId === art.id ? "کاپی ہو گیا!" : "لنک کاپی کریں"}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
