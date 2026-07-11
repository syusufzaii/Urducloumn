import React, { useState, useEffect, useRef } from "react";
import { Search, Moon, Sun, ShieldCheck, Menu, X, BookOpen, Database, Radio, UserPlus } from "lucide-react";
import { Category, Writer } from "../types";

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  dataSaver: boolean;
  setDataSaver: (val: boolean) => void;
  onSearch: (query: string) => void;
  onSelectWriter: (slug: string) => void;
  onSelectCategory: (slug: string) => void;
  savedArticlesCount: number;
}

export default function Header({
  currentTab,
  onTabChange,
  darkMode,
  setDarkMode,
  dataSaver,
  setDataSaver,
  onSearch,
  onSelectWriter,
  onSelectCategory,
  savedArticlesCount,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ type: "writer" | "category" | "tag"; label: string; slug: string }[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch categories and writers for live suggestions
    Promise.all([
      fetch("/api/v1/categories").then((r) => r.json()),
      fetch("/api/v1/writers").then((r) => r.json()),
    ])
      .then(([cats, wrs]) => {
        setCategories(cats);
        setWriters(wrs);
      })
      .catch(console.error);
  }, []);

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const q = query.toLowerCase();
    const matches: typeof suggestions = [];

    // Match writers
    writers.forEach((w) => {
      if (w.name.toLowerCase().includes(q) || w.expertise.toLowerCase().includes(q)) {
        matches.push({ type: "writer", label: w.name, slug: w.slug });
      }
    });

    // Match categories
    categories.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        matches.push({ type: "category", label: c.name, slug: c.slug });
      }
    });

    // Simple common Urdu tags match
    const commonTags = ["معیشت", "پاکستان", "سیاست", "تعلیم", "تاریخ"];
    commonTags.forEach((t) => {
      if (t.includes(q)) {
        matches.push({ type: "tag", label: `#${t}`, slug: t });
      }
    });

    setSuggestions(matches.slice(0, 5));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      onTabChange("search");
      setSearchOpen(false);
      setMobileMenuOpen(false);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: typeof suggestions[0]) => {
    setSearchQuery("");
    setSuggestions([]);
    setSearchOpen(false);
    setMobileMenuOpen(false);

    if (item.type === "writer") {
      onSelectWriter(item.slug);
    } else if (item.type === "category") {
      onSelectCategory(item.slug);
    } else if (item.type === "tag") {
      onSearch(item.slug);
      onTabChange("search");
    }
  };

  const navItems = [
    { id: "home", label: "صفحہ اول" },
    { id: "writers", label: "کالم نگار" },
    { id: "categories", label: "موضوعات" },
    { id: "videos", label: "ویڈیوز" },
    { id: "apply-writer", label: "کالم نگار بنیں", icon: <UserPlus className="w-4 h-4 text-brand-gold ml-1 inline animate-bounce" /> },
    { id: "saved", label: `محفوظ شدہ (${savedArticlesCount})` },
    { id: "admin", label: "ایڈیٹوریل پینل", icon: <ShieldCheck className="w-4 h-4 text-brand-gold ml-1 inline" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-green-dark text-white border-b border-brand-gold/30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-200 hover:text-white hover:bg-white/10 rounded-md"
              aria-label="مینو کھولیں"
              id="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-stone-200 hover:text-white hover:bg-white/10 rounded-md"
              aria-label="تلاش کریں"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Logo Brand Brand Identity */}
          <div className="flex-shrink-0 flex items-center">
            <button
              onClick={() => onTabChange("home")}
              className="flex items-center gap-2 text-right group cursor-pointer"
              id="logo-home-btn"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark flex items-center justify-center font-bold text-brand-green-dark shadow-md text-lg">
                ق
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold font-urdu tracking-tight text-white group-hover:text-brand-gold transition-colors">
                  اردو کالمز
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-gold/80 -mt-1 font-semibold">
                  UrduColumns.pk
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex space-x-1 space-x-reverse items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  currentTab === item.id
                    ? "bg-brand-gold text-brand-green-dark shadow-inner"
                    : "text-stone-100 hover:bg-white/10 hover:text-brand-gold"
                }`}
                id={`nav-${item.id}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Live Search (Desktop) */}
            <div className="hidden md:block relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  placeholder="کالم نگار یا موضوع تلاش کریں..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="bg-white/10 text-white placeholder-stone-300 text-xs rounded-full py-2 pr-4 pl-10 focus:outline-none focus:bg-white focus:text-stone-900 focus:placeholder-stone-500 w-56 lg:w-72 border border-white/10 focus:border-brand-gold transition-all"
                />
                <button
                  type="submit"
                  className="absolute left-3 p-1 text-stone-300 hover:text-white focus:text-stone-900"
                  aria-label="تلاش کریں"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-11 right-0 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden z-50 text-stone-800 dark:text-stone-200">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(item)}
                      className="w-full text-right px-4 py-2.5 text-xs hover:bg-stone-50 dark:hover:bg-stone-800 border-b border-stone-100 dark:border-stone-800 last:border-0 flex items-center justify-between"
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-500">
                        {item.type === "writer" ? "کالم نگار" : item.type === "category" ? "موضوع" : "ٹیگ"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Data Saver Mode Toggle Button */}
            <button
              onClick={() => setDataSaver(!dataSaver)}
              className={`p-2 rounded-full cursor-pointer transition-all flex items-center gap-1 border ${
                dataSaver
                  ? "bg-amber-500/20 text-brand-gold border-amber-500/40"
                  : "bg-white/5 text-stone-300 border-transparent hover:bg-white/10"
              }`}
              title={dataSaver ? "ڈیٹا سیور آن ہے (امیجز پوشیدہ ہیں)" : "ڈیٹا سیور آف کریں"}
              id="data-saver-btn"
            >
              <Database className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-bold">ڈیٹا سیور</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-white/5 text-stone-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-brand-gold/20 cursor-pointer"
              aria-label="ڈارک موڈ تبدیل کریں"
              id="dark-mode-btn"
            >
              {darkMode ? <Sun className="w-4 h-4 text-brand-gold" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden bg-brand-green-light border-t border-brand-gold/30 p-4 relative z-40">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="کالم نگار یا موضوع تلاش کریں..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white text-stone-900 rounded-lg py-2 pr-4 pl-10 focus:outline-none text-sm"
              autoFocus
            />
            <button type="submit" className="absolute left-3 top-2.5 text-stone-500">
              <Search className="w-4 h-4" />
            </button>
          </form>
          {suggestions.length > 0 && (
            <div className="bg-white rounded-lg mt-2 shadow-lg overflow-hidden border border-stone-200">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(item)}
                  className="w-full text-right px-4 py-2.5 text-xs hover:bg-stone-50 text-stone-800 border-b border-stone-100 last:border-0 flex items-center justify-between"
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-500">
                    {item.type === "writer" ? "کالم نگار" : item.type === "category" ? "موضوع" : "ٹیگ"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-64 max-w-sm h-full bg-brand-green-dark text-white p-6 shadow-2xl relative flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold font-urdu text-brand-gold">نیویگیشن مینو</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-stone-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-right w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center ${
                      currentTab === item.id
                        ? "bg-brand-gold text-brand-green-dark font-bold"
                        : "text-stone-100 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 text-center">
              <span className="text-xs text-stone-400">© 2026 UrduColumns.pk</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
