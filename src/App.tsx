/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BookOpen, Award, Flame, Star, Video, Eye, ArrowLeft, ArrowRight, UserPlus, Mail, AlertCircle, Sparkles, Database, Check, BookmarkCheck, BadgeCheck } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BreakingBar from "./components/BreakingBar";
import AdSlot from "./components/AdSlot";
import ArticleView from "./components/ArticleView";
import WriterProfile from "./components/WriterProfile";
import AdminPanel from "./components/AdminPanel";
import ApplyWriter from "./components/ApplyWriter";
import { Article, Writer, Category } from "./types";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [selectedWriterSlug, setSelectedWriterSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Accessibility/Theming global states
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [dataSaver, setDataSaver] = useState(() => localStorage.getItem("dataSaver") === "true");
  const [savedCount, setSavedCount] = useState(0);

  // Core content states
  const [articles, setArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic static pages content state
  const [staticPageContent, setStaticPageContent] = useState<{ title: string; content: string } | null>(null);

  // Sync dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // Sync data saver setting
  useEffect(() => {
    localStorage.setItem("dataSaver", String(dataSaver));
  }, [dataSaver]);

  // URL Hash Routing and Sync Layer
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash === "#/" || hash === "#/home") {
        setCurrentTab("home");
        setSelectedArticleSlug(null);
        setSelectedWriterSlug(null);
        setSelectedCategorySlug(null);
        return;
      }

      const matchWriter = hash.match(/^#\/writer\/(.+)$/);
      const matchArticle = hash.match(/^#\/article\/(.+)$/);
      const matchCategory = hash.match(/^#\/category\/(.+)$/);
      const matchTab = hash.match(/^#\/([a-zA-Z0-9_-]+)$/);

      if (matchWriter) {
        setSelectedWriterSlug(matchWriter[1]);
        setCurrentTab("writer-profile");
      } else if (matchArticle) {
        setSelectedArticleSlug(matchArticle[1]);
        setCurrentTab("article");
      } else if (matchCategory) {
        setSelectedCategorySlug(matchCategory[1]);
        setCurrentTab("categories");
      } else if (matchTab) {
        const tab = matchTab[1];
        setCurrentTab(tab);
        setSelectedArticleSlug(null);
        setSelectedWriterSlug(null);
        setSelectedCategorySlug(null);
      }
    };

    // Parse on mount
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update URL Hash when state changes
  useEffect(() => {
    if (loading) return; // Wait until initial data is loaded to prevent premature hashes
    
    let targetHash = "";
    if (currentTab === "writer-profile" && selectedWriterSlug) {
      targetHash = `#/writer/${selectedWriterSlug}`;
    } else if (currentTab === "article" && selectedArticleSlug) {
      targetHash = `#/article/${selectedArticleSlug}`;
    } else if (currentTab === "categories" && selectedCategorySlug) {
      targetHash = `#/category/${selectedCategorySlug}`;
    } else if (currentTab && currentTab !== "home") {
      targetHash = `#/${currentTab}`;
    } else {
      targetHash = "#/";
    }

    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, "", targetHash);
    }
  }, [currentTab, selectedArticleSlug, selectedWriterSlug, selectedCategorySlug, loading]);

  // Read saved count from local offline bookmarks
  const updateSavedCount = () => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setSavedCount(bookmarks.length);
  };

  useEffect(() => {
    updateSavedCount();
  }, [currentTab, selectedArticleSlug]);

  // Fetch core home content
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/articles").then((r) => r.json()),
      fetch("/api/v1/writers").then((r) => r.json()),
      fetch("/api/v1/categories").then((r) => r.json()),
    ])
      .then(([arts, wrs, cats]) => {
        setArticles(arts);
        setWriters(wrs);
        setCategories(cats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load core data:", err);
        setLoading(false);
      });
  }, [currentTab]);

  // Fetch static policy pages when selected
  useEffect(() => {
    const staticPolicyTabs = ["about", "contact", "submit", "advertise", "privacy", "terms", "editorial-policy", "corrections-policy"];
    if (staticPolicyTabs.includes(currentTab)) {
      setLoading(true);
      fetch(`/api/v1/pages/${currentTab}`)
        .then((r) => r.json())
        .then((data) => {
          setStaticPageContent({ title: data.title, content: data.content });
          setLoading(false);
        })
        .catch(() => {
          setStaticPageContent({
            title: currentTab.toUpperCase(),
            content: `<p class="urdu-text">عارضی مسئلہ کی وجہ سے یہ پالیسی پیج لوڈ نہیں ہو سکا۔ برائے مہربانی بعد میں کوشش کریں۔</p>`
          });
          setLoading(false);
        });
    } else {
      setStaticPageContent(null);
    }
  }, [currentTab]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSelectedArticleSlug(null);
    setSelectedWriterSlug(null);
    setSelectedCategorySlug(null);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectArticle = (slug: string) => {
    setSelectedArticleSlug(slug);
    setCurrentTab("article");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectWriter = (slug: string) => {
    setSelectedWriterSlug(slug);
    setCurrentTab("writer-profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentTab("categories");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentTab("search");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Saved Offline reading library
  const getOfflineCachedArticles = (): Article[] => {
    const offlineCache: Record<string, Article> = JSON.parse(localStorage.getItem("offlineCache") || "{}");
    const bookmarks: string[] = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    return bookmarks.map((id) => offlineCache[id]).filter(Boolean);
  };

  // Editorial Filtered Lists
  const featuredArticle = articles.find((a) => a.isFeatured);
  const editorsPicks = articles.filter((a) => a.isEditorsPick).slice(0, 4);
  const trendingArticles = articles.filter((a) => a.isTrending).slice(0, 5);
  const latestArticles = articles.slice(0, 6);

  // Mehman Columns (Guest Columns) filtering logic
  const guestWriters = writers.filter((w) => w.isGuest);
  const guestWriterIds = guestWriters.map((w) => w.id);
  const guestArticles = articles.filter((a) => guestWriterIds.includes(a.writerId));

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? "dark bg-stone-950 text-white" : "bg-stone-50 text-stone-900"}`}>
      
      {/* Dynamic Breaking Marquee bar */}
      <BreakingBar onSelectArticle={handleSelectArticle} />

      {/* Main sticky RTL navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        dataSaver={dataSaver}
        setDataSaver={setDataSaver}
        onSearch={handleSearch}
        onSelectWriter={handleSelectWriter}
        onSelectCategory={handleSelectCategory}
        savedArticlesCount={savedCount}
      />

      {/* Top Main Advertising Space */}
      <div className="py-4 bg-stone-100 dark:bg-stone-900/40 border-b border-stone-200/60 dark:border-stone-800/40">
        <AdSlot size="leaderboard" dataSaver={dataSaver} />
      </div>

      {/* Primary Workspace container */}
      <main className="flex-grow pb-16">
        
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 py-20 text-center text-stone-500 animate-pulse font-sans">
            تازہ ترین مضامین اور آراء کا فکری گوشہ اپ ڈیٹ کیا جا رہا ہے...
          </div>
        ) : (
          <>
            {/* TAB: HOME PAGE */}
            {currentTab === "home" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                
                {/* 1. Bento Editorial Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left (Main Featured Column) */}
                  <div className="lg:col-span-8 space-y-6">
                    <h2 className="text-base font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 flex items-center gap-2 font-urdu">
                      <Sparkles className="w-5 h-5 text-brand-gold" /> کالمِ خاص (Featured Article)
                    </h2>

                    {featuredArticle ? (
                      <div className="bg-white dark:bg-stone-900 border-2 border-brand-gold/20 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-brand-gold-dark">خصوصی پیشکش</span>
                          <span className="text-xs text-stone-400">
                            {new Date(featuredArticle.publishedAt).toLocaleDateString("ur-PK", { month: "long", day: "numeric" })}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSelectArticle(featuredArticle.slug)}
                          className="text-right w-full block group cursor-pointer"
                        >
                          <h3 className="text-2xl md:text-3xl font-bold font-urdu text-stone-900 dark:text-white leading-tight mb-4 group-hover:text-brand-gold transition-colors">
                            {featuredArticle.title}
                          </h3>
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                          {(() => {
                            const wr = writers.find((w) => w.id === featuredArticle.writerId);
                            return wr ? (
                              <button
                                onClick={() => handleSelectWriter(wr.slug)}
                                className="flex items-center gap-2 text-right group cursor-pointer"
                              >
                                <img src={wr.image} alt={wr.name} className="w-10 h-10 rounded-full object-cover border-2 border-brand-gold/30" />
                                <div>
                                  <span className="block text-xs font-bold text-stone-800 dark:text-stone-100 group-hover:text-brand-gold transition-colors flex items-center gap-1 justify-start">
                                    <span>{wr.name}</span>
                                    {wr.isVerified && (
                                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 inline" title="تصدیق شدہ کالم نگار" />
                                    )}
                                  </span>
                                  <span className="text-[10px] text-stone-400">{wr.expertise}</span>
                                </div>
                              </button>
                            ) : null;
                          })()}
                        </div>

                        {/* Image check with Data Saver */}
                        {!dataSaver && featuredArticle.image && (
                          <div className="mb-6 overflow-hidden rounded-xl">
                            <img
                              src={featuredArticle.image}
                              alt={featuredArticle.title}
                              className="w-full h-64 md:h-80 object-cover hover:scale-[1.01] transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <p className="text-stone-600 dark:text-stone-300 text-sm md:text-base leading-relaxed font-light mb-6 text-right leading-urdu">
                          {featuredArticle.excerpt}
                        </p>

                        <button
                          onClick={() => handleSelectArticle(featuredArticle.slug)}
                          className="text-brand-green-dark hover:text-brand-green-light font-bold text-xs flex items-center gap-1 cursor-pointer font-sans"
                        >
                          مکمل کالم پڑھیں <ArrowLeft className="w-4 h-4 mr-1" />
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-xs">
                        کوئی کالمِ خاص فی الحال دستیاب نہیں ہے۔
                      </div>
                    )}
                  </div>

                  {/* Right (Editor's Picks & Trending) */}
                  <div className="lg:col-span-4 space-y-8">
                    
                    {/* Editor's Picks Sidebar */}
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
                      <h3 className="text-base font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 mb-6 font-urdu flex items-center gap-2">
                        <Star className="w-5 h-5 text-brand-gold fill-brand-gold" /> ایڈیٹرز چوائس
                      </h3>

                      <div className="space-y-4">
                        {editorsPicks.map((art) => {
                          const author = writers.find((w) => w.id === art.writerId);
                          return (
                            <div key={art.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 pb-3 last:pb-0">
                              <button
                                onClick={() => handleSelectArticle(art.slug)}
                                className="text-right w-full block group cursor-pointer"
                              >
                                <h4 className="text-xs md:text-sm font-bold font-urdu text-stone-900 dark:text-white leading-relaxed group-hover:text-brand-gold transition-colors">
                                  {art.title}
                                </h4>
                              </button>
                              <span className="text-[10px] text-stone-400 flex items-center gap-1 justify-start mt-1">
                                <span>کالم نگار: {author ? author.name : "نامعلوم"}</span>
                                {author?.isVerified && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 inline" title="تصدیق شدہ کالم نگار" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Trending Articles List */}
                    <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-lg border border-brand-gold/10">
                      <h3 className="text-sm font-bold text-brand-gold border-r-4 border-brand-gold pr-3 mb-6 font-urdu flex items-center gap-2">
                        <Flame className="w-4 h-4 text-brand-gold animate-pulse" /> سب سے زیادہ پڑھے گئے
                      </h3>

                      <div className="space-y-4 font-sans">
                        {trendingArticles.map((art, idx) => (
                          <div key={art.id} className="flex gap-3 items-start">
                            <span className="text-2xl font-bold font-mono text-brand-gold/30">0{idx + 1}</span>
                            <div>
                              <button
                                onClick={() => handleSelectArticle(art.slug)}
                                className="text-right hover:text-brand-gold transition-colors text-xs font-semibold leading-relaxed cursor-pointer"
                              >
                                {art.title}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Middle Square Commercial Ad Placement */}
                <div className="my-8">
                  <AdSlot size="square" dataSaver={dataSaver} />
                </div>

                {/* 3. Columnists Carousel/Grid */}
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 font-urdu">
                    ہمارے معزز کالم نگار (Our Columnists)
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {writers.map((w) => (
                      <div
                        key={w.id}
                        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 text-center hover:shadow-md transition-shadow"
                      >
                        <img
                          src={w.image}
                          alt={w.name}
                          className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-brand-gold/30 mb-3"
                        />
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white font-urdu mb-1 flex items-center justify-center gap-1">
                          <span>{w.name}</span>
                          {w.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10 inline" title="تصدیق شدہ کالم نگار" />
                          )}
                        </h4>
                        <p className="text-[10px] text-stone-500 mb-3">{w.expertise}</p>
                        <button
                          onClick={() => handleSelectWriter(w.slug)}
                          className="text-xs bg-brand-green-dark text-white px-3 py-1.5 rounded hover:bg-brand-green-light transition-colors font-semibold cursor-pointer w-full text-center block"
                        >
                          پروفائل دیکھیں
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Latest Columns Grid (Text-first design) */}
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 font-urdu">
                    تازہ ترین کالمز اور آراء (Latest Columns)
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {latestArticles.map((art) => {
                      const author = writers.find((w) => w.id === art.writerId);
                      return (
                        <div
                          key={art.id}
                          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              {author && (
                                <img
                                  src={author.image}
                                  alt={author.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                              <span className="text-[10px] text-stone-400 font-semibold flex items-center gap-1 justify-start">
                                <span>{author ? author.name : "نامعلوم"}</span>
                                {author?.isVerified && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 inline" title="تصدیق شدہ کالم نگار" />
                                )}
                                <span className="mx-1">•</span>
                                <span>{new Date(art.publishedAt).toLocaleDateString("ur-PK")}</span>
                              </span>
                            </div>

                            <button
                              onClick={() => handleSelectArticle(art.slug)}
                              className="text-right w-full block group cursor-pointer"
                            >
                              <h3 className="text-sm font-bold font-urdu text-stone-900 dark:text-white leading-relaxed group-hover:text-brand-gold transition-colors">
                                {art.title}
                              </h3>
                            </button>

                            <p className="text-[11px] text-stone-500 line-clamp-3 mt-2 font-light leading-relaxed">
                              {art.excerpt}
                            </p>
                          </div>

                          <div className="border-t border-stone-100 dark:border-stone-800 pt-3 mt-4 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                            <span>مطالعہ: {art.readingTime} منٹ</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {art.views}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mehman Columns (Guest Columns Area) */}
                <div className="bg-gradient-to-br from-brand-gold/5 to-amber-500/5 dark:from-brand-gold/10 dark:to-transparent border border-brand-gold/20 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-right">
                      <h2 className="text-lg font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 font-urdu flex items-center justify-start gap-2 flex-row-reverse">
                        <Award className="w-5 h-5 text-brand-gold shrink-0" />
                        <span>مہمان کالمز (Guest Columns)</span>
                      </h2>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 pr-3 leading-relaxed">
                        ہمارے مہمان کالم نگاروں اور ملک کے نامور دانشوروں کے خصوصی مراسلے و تجزیات
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabChange("apply-writer")}
                      className="bg-brand-green-dark hover:bg-brand-green-light text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 justify-center"
                    >
                      <UserPlus className="w-4 h-4 text-brand-gold" />
                      <span>کالم نگار بننے کے لیے اپلائی کریں</span>
                    </button>
                  </div>

                  {guestArticles.length === 0 ? (
                    <div className="bg-white/40 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800 rounded-xl p-8 text-center text-stone-400 text-xs font-urdu leading-relaxed">
                      مہمان کالم نگاروں کی تحریریں جلد ہی شائع کی جائیں گی۔ اگر آپ لکھنا چاہتے ہیں تو اوپر دیے گئے بٹن سے درخواست جمع کروائیں۔
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {guestArticles.map((art) => {
                        const author = writers.find((w) => w.id === art.writerId);
                        return (
                          <div
                            key={art.id}
                            className="bg-white dark:bg-stone-900/85 border border-stone-150 dark:border-stone-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all flex flex-col justify-between text-right"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-3 justify-end">
                                <span className="text-[10px] text-stone-400 font-semibold flex items-center gap-1 justify-end">
                                  <span>{author ? author.name : "مہمان کالم نگار"}</span>
                                  {author?.isVerified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 inline" />
                                  )}
                                </span>
                                {author && (
                                  <img
                                    src={author.image}
                                    alt={author.name}
                                    className="w-7 h-7 rounded-full object-cover border border-brand-gold/30"
                                  />
                                )}
                              </div>

                              <button
                                onClick={() => handleSelectArticle(art.slug)}
                                className="text-right w-full block group cursor-pointer"
                              >
                                <h3 className="text-xs md:text-sm font-bold font-urdu text-stone-900 dark:text-white leading-relaxed group-hover:text-brand-gold transition-colors line-clamp-2">
                                  {art.title}
                                </h3>
                              </button>

                              <p className="text-[10px] text-stone-500 line-clamp-2 mt-2 leading-relaxed">
                                {art.excerpt}
                              </p>
                            </div>

                            <div className="border-t border-stone-100 dark:border-stone-800 pt-2 mt-3 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                              <span>مطالعہ: {art.readingTime} منٹ</span>
                              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded text-[9px] font-urdu">
                                مہمان کالم
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Editorial Video showcase (Lightweight, no CLS) */}
                <div className="bg-stone-900 text-white rounded-2xl p-6 md:p-8 border border-brand-gold/10">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-brand-gold border-r-4 border-brand-gold pr-3 font-urdu flex items-center gap-2">
                      <Video className="w-5 h-5 text-brand-gold" /> تازہ ترین ویڈیو تجزیے
                    </h2>
                    <button onClick={() => setCurrentTab("videos")} className="text-xs text-stone-300 hover:text-brand-gold font-semibold">
                      مزید ویڈیوز دیکھیں
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-brand-gold/30 relative">
                      {/* Embedded YouTube Player safely configured with zero autoplay */}
                      <iframe
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        title="UrduColumns Analysis"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold font-urdu text-white">موجودہ ملکی سیاسی صورتحال پر خصوصی تبصرہ</h3>
                      <p className="text-xs text-stone-300 leading-relaxed font-light leading-urdu">
                        اینکر پرسنز اور سینئر صحافیوں کے پینل کی خصوصی گفگتو اور موجودہ پارلیمانی اجلاس کے موضوع پر تجزیہ۔ دیکھیے ہماری تفصیلی رپورٹ۔
                      </p>
                      <button
                        onClick={() => setCurrentTab("videos")}
                        className="bg-brand-gold text-brand-green-dark px-4 py-2 rounded font-bold text-xs hover:bg-brand-gold-dark transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        ویڈیو لائبریری کھولیں
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: WRITERS DIRECTORY */}
            {currentTab === "writers" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 mb-8 font-urdu">
                  ہمارے تمام موقر کالم نگار (Columnists Directory)
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {writers.map((w) => (
                    <div
                      key={w.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 text-center flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <img
                          src={w.image}
                          alt={w.name}
                          className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-brand-gold/30 mb-4"
                        />
                        <h3 className="text-base font-bold text-stone-900 dark:text-white font-urdu mb-1">{w.name}</h3>
                        <p className="text-xs text-stone-500 mb-3">{w.expertise}</p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-300 leading-normal line-clamp-3 mb-4 leading-urdu">
                          {w.bio}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSelectWriter(w.slug)}
                        className="w-full bg-brand-green-dark hover:bg-brand-green-light text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        پروفائل اور کالمز دیکھیں
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CATEGORIES DETAIL */}
            {currentTab === "categories" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 border-b border-stone-200 pb-6 mb-8">
                  <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 font-urdu">
                    مضامین بمطابق موضوعات (Categories)
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCategory(c.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          selectedCategorySlug === c.slug
                            ? "bg-brand-gold text-brand-green-dark"
                            : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Articles by Category */}
                {(() => {
                  const targetCat = selectedCategorySlug
                    ? categories.find((c) => c.slug === selectedCategorySlug)
                    : categories[0];
                  
                  if (!targetCat) return null;

                  const filtered = articles.filter((a) => a.categoryId === targetCat.id);

                  return (
                    <div className="space-y-6">
                      <div className="bg-stone-100 dark:bg-stone-900 p-5 rounded-xl border border-stone-200/60 dark:border-stone-800">
                        <h3 className="text-sm font-bold text-brand-green-dark dark:text-brand-gold font-urdu mb-1">
                          کیٹیگری: {targetCat.name}
                        </h3>
                        <p className="text-xs text-stone-500">{targetCat.description}</p>
                      </div>

                      {filtered.length === 0 ? (
                        <div className="text-center text-stone-400 py-12 text-xs font-sans">
                          اس کیٹیگری میں فی الحال کوئی کالم شائع نہیں کیا گیا ہے۔
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filtered.map((art) => {
                            const author = writers.find((w) => w.id === art.writerId);
                            return (
                              <div
                                key={art.id}
                                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
                              >
                                <div>
                                  <h3 className="text-sm font-bold font-urdu text-stone-900 dark:text-white mb-2">
                                    <button onClick={() => handleSelectArticle(art.slug)} className="text-right hover:underline">
                                      {art.title}
                                    </button>
                                  </h3>
                                  <p className="text-[11px] text-stone-500 line-clamp-3 mt-1 font-light leading-relaxed">
                                    {art.excerpt}
                                  </p>
                                </div>

                                <div className="border-t border-stone-100 dark:border-stone-800 pt-3 mt-4 flex items-center justify-between text-[10px] text-stone-400">
                                  <span>کالم نگار: {author ? author.name : "نامعلوم"}</span>
                                  <span className="font-mono">منظور شدہ وزٹرز: {art.views}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: VIDEO ANALYSIS HUB */}
            {currentTab === "videos" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 mb-8 font-urdu">
                  ویڈیو آراء اور فکری مباحثے (Video Gallery)
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { id: "v1", title: "کیا معاشی پیکیج ملکی برآمدات بڑھانے میں مددگار ثابت ہو سکتا ہے؟", embed: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
                    { id: "v2", title: "مشرقِ وسطیٰ میں بدلتے ہوئے اتحاد اور پاکستان کا اسٹریٹجک مقام", embed: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
                  ].map((video) => (
                    <div key={video.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="aspect-video bg-black">
                        <iframe
                          src={video.embed}
                          title={video.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold font-urdu text-stone-900 leading-relaxed">{video.title}</h3>
                        <p className="text-[10px] text-stone-500 mt-1">پیشکش: UrduColumns Special Report</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: OFFLINE SAVED ARTICLES LIBRARY */}
            {currentTab === "saved" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-4 mb-8">
                  <BookmarkCheck className="w-6 h-6 text-brand-gold" />
                  <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 font-urdu">
                    میرا آف لائن کتب خانہ (Offline Reading Library)
                  </h1>
                </div>

                {getOfflineCachedArticles().length === 0 ? (
                  <div className="text-center p-12 bg-white border border-stone-200 rounded-xl space-y-4 max-w-xl mx-auto">
                    <Database className="w-12 h-12 text-stone-300 mx-auto" />
                    <h3 className="text-sm font-bold font-urdu text-stone-700">آف لائن کتب خانہ خالی ہے</h3>
                    <p className="text-xs text-stone-500 leading-normal">
                      کسی بھی کالم پر بنے بک مارک (Bookmark) بٹن کو دبا کر اسے آف لائن مطالعہ کے لیے محفوظ کریں۔ انٹرنیٹ نہ ہونے کی صورت میں بھی آپ انہیں پڑھ سکیں گے۔
                    </p>
                    <button onClick={() => setCurrentTab("home")} className="bg-brand-green-dark text-white text-xs font-bold px-4 py-2 rounded">
                      صفحہ اول پر جائیں
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getOfflineCachedArticles().map((art) => (
                      <div
                        key={art.id}
                        className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-sans">
                            آف لائن محفوظ شدہ
                          </span>
                          <h3 className="text-sm font-bold font-urdu text-stone-900 mt-3">
                            <button onClick={() => handleSelectArticle(art.slug)} className="text-right hover:underline">
                              {art.title}
                            </button>
                          </h3>
                          <p className="text-[11px] text-stone-500 mt-1 font-light leading-relaxed line-clamp-3">
                            {art.excerpt}
                          </p>
                        </div>

                        <div className="border-t border-stone-100 pt-3 mt-4 flex justify-between items-center text-[10px] text-stone-400 font-sans">
                          <span>طوالت: {art.readingTime} منٹ مطالعہ</span>
                          <button
                            onClick={() => {
                              const bms: string[] = JSON.parse(localStorage.getItem("bookmarks") || "[]");
                              const updated = bms.filter((id) => id !== art.id);
                              localStorage.setItem("bookmarks", JSON.stringify(updated));
                              updateSavedCount();
                            }}
                            className="text-rose-600 hover:underline font-bold"
                          >
                            لائبریری سے حذف کریں
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SEARCH PAGE */}
            {currentTab === "search" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 mb-6 font-urdu">
                  تلاش کے نتائج: "{searchQuery}"
                </h1>

                {(() => {
                  const q = searchQuery.toLowerCase().trim();
                  const results = articles.filter(
                    (a) =>
                      a.title.toLowerCase().includes(q) ||
                      a.body.toLowerCase().includes(q) ||
                      a.excerpt.toLowerCase().includes(q) ||
                      a.tags.some((t) => t.toLowerCase().includes(q))
                  );

                  if (results.length === 0) {
                    return (
                      <div className="text-center text-stone-500 py-12 text-xs font-sans">
                        معذرت، تلاش کا کوئی نتیجہ حاصل نہیں ہو سکا۔ متبادل الفاظ استعمال کر کے تلاش کریں۔
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.map((art) => (
                        <div
                          key={art.id}
                          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                          <div>
                            <h3 className="text-sm font-bold font-urdu text-stone-900 dark:text-white mb-2">
                              <button onClick={() => handleSelectArticle(art.slug)} className="text-right hover:underline">
                                {art.title}
                              </button>
                            </h3>
                            <p className="text-[11px] text-stone-500 line-clamp-3 mt-1 font-light leading-relaxed">
                              {art.excerpt}
                            </p>
                          </div>
                          <div className="border-t border-stone-100 dark:border-stone-800 pt-3 mt-4 text-[10px] text-stone-400 font-mono">
                            شائع شدہ: {new Date(art.publishedAt).toLocaleDateString("ur-PK")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* POLICY AND TRUST PAGES (Dynamic) */}
            {staticPageContent && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 font-sans">
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-10 shadow-sm">
                  <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white border-r-4 border-brand-gold pr-3 mb-6 font-urdu">
                    {staticPageContent.title}
                  </h1>
                  <div
                    className="urdu-text text-stone-700 dark:text-stone-300 text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: staticPageContent.content }}
                  ></div>
                </div>
              </div>
            )}

            {/* TAB: SECURE EDITORIAL PANEL */}
            {currentTab === "admin" && (
              <AdminPanel dataSaver={dataSaver} />
            )}

            {/* TAB: DETAILED ARTICLE VIEW */}
            {currentTab === "article" && selectedArticleSlug && (
              <ArticleView
                articleSlug={selectedArticleSlug}
                onBack={() => handleTabChange("home")}
                dataSaver={dataSaver}
                onSelectWriter={handleSelectWriter}
              />
            )}

            {/* TAB: WRITER PROFILE INDIVIDUAL GRID */}
            {currentTab === "writer-profile" && selectedWriterSlug && (
              <WriterProfile
                writerSlug={selectedWriterSlug}
                onSelectArticle={handleSelectArticle}
                onBack={() => handleTabChange("home")}
              />
            )}

            {/* TAB: BECOME A COLUMNIST APPLICATION FORM */}
            {currentTab === "apply-writer" && (
              <ApplyWriter onBack={() => handleTabChange("home")} />
            )}
          </>
        )}
      </main>

      {/* Floating Sticky Bottom Mobile Banner (direct sponsor slots) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 z-50 p-1">
        <AdSlot size="mobile-sticky" dataSaver={dataSaver} />
      </div>

      {/* Unified Brand Footer directory */}
      <Footer onTabChange={handleTabChange} />
    </div>
  );
}
