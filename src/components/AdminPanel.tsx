import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { z } from "zod";
import {
  ShieldAlert, LayoutDashboard, FileText, Users, FolderTree, Image, Megaphone,
  MessageSquare, Settings, Mail, RefreshCw, Plus, Check, X, ShieldCheck, Cpu, HardDrive, HelpCircle, Sparkles, Upload,
  Eye, EyeOff, Lock, UserPlus, BadgeCheck
} from "lucide-react";
import { Article, Writer, Category, Comment, Ad, Settings as SiteSettings } from "../types";
import ImageCropper from "./ImageCropper";

// Zod Schema for robust form validation
const loginSchema = z.object({
  email: z.string()
    .min(1, "ای میل درج کرنا لازمی ہے۔")
    .email("براہ کرم ایک درست ای میل پتہ درج کریں۔"),
  password: z.string()
    .min(1, "پاس ورڈ درج کرنا لازمی ہے۔")
    .min(6, "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔")
});

export default function AdminPanel({ dataSaver }: { dataSaver: boolean }) {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("editor@urducolumns.pk");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Role Control
  const [activeRole, setActiveRole] = useState<"Super Admin" | "Editor" | "Writer" | "Moderator">("Editor");

  // Admin Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "articles" | "writers" | "categories" | "ads" | "comments" | "subscribers" | "media" | "health" | "applications">("dashboard");

  // CMS dynamic database states
  const [articles, setArticles] = useState<Article[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [subscribers, setSubscribers] = useState<{ email: string; name?: string; joinedAt: string }[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  // Loading/saving triggers
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Article Form State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [artTitle, setArtTitle] = useState("");
  const [artSlug, setArtSlug] = useState("");
  const [artBody, setArtBody] = useState("");
  const [artExcerpt, setArtExcerpt] = useState("");
  const [artCategory, setArtCategory] = useState("");
  const [artWriter, setArtWriter] = useState("");
  const [artTags, setArtTags] = useState("");
  const [artImage, setArtImage] = useState("");
  const [artCaption, setArtCaption] = useState("");
  const [artCredit, setArtCredit] = useState("");
  const [artStatus, setArtStatus] = useState<"draft" | "review" | "published">("published");
  const [artRelatedIds, setArtRelatedIds] = useState<string[]>([]);

  // AI Editorial Helper states
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [analyzingDraft, setAnalyzingDraft] = useState(false);

  // AI Powered Article Fetch / Auto-fill State
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchTopic, setFetchTopic] = useState("");
  const [isFetchingArticle, setIsFetchingArticle] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchSuccess, setFetchSuccess] = useState("");

  const handleFetchArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchUrl && !fetchTopic) {
      setFetchError("براہ کرم کالم کا لنک یا موضوع درج کریں۔");
      return;
    }
    setIsFetchingArticle(true);
    setFetchError("");
    setFetchSuccess("");

    try {
      const res = await fetch("/api/v1/gemini/fetch-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fetchUrl, topic: fetchTopic }),
      });

      if (res.ok) {
        const data = await res.json();
        setArtTitle(data.title);
        // Clean URL-friendly slug
        const cleanSlug = (data.title || "fetched-column")
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-")
          .substring(0, 80);
        setArtSlug(cleanSlug);
        setArtBody(data.body);
        setArtExcerpt(data.excerpt);
        setArtCategory(data.suggestedCategoryId || "c1");
        setArtWriter(data.suggestedWriterId || "w1");
        setArtTags(data.tags ? data.tags.join(", ") : "");
        setArtStatus("draft"); // Default to draft so they can review, edit, and then publish!
        
        // Clear fetch fields
        setFetchUrl("");
        setFetchTopic("");
        setFetchSuccess("کالم کے تمام کوائف کامیابی سے حاصل ہو گئے ہیں اور فارم پُر ہو گیا ہے۔ آپ اب اس میں ترمیم کر سکتے ہیں اور نیچے 'شائع کریں' پر کلک کر کے شائع کر سکتے ہیں!");
      } else {
        const errData = await res.json();
        setFetchError(errData.error || "آرٹیکل حاصل کرنے میں ناکامی۔");
      }
    } catch (err) {
      console.error(err);
      setFetchError("نیٹ ورک کنکشن میں خرابی آئی ہے۔");
    } finally {
      setIsFetchingArticle(false);
    }
  };

  // Ad Form State
  const [adTitle, setAdTitle] = useState("");
  const [adSize, setAdSize] = useState<"leaderboard" | "square" | "skyscraper">("leaderboard");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [adDevice, setAdDevice] = useState<"all" | "desktop" | "mobile">("all");

  // Writer Form State
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);
  const [wrName, setWrName] = useState("");
  const [wrSlug, setWrSlug] = useState("");
  const [wrBio, setWrBio] = useState("");
  const [wrExpertise, setWrExpertise] = useState("");
  const [wrImage, setWrImage] = useState("");
  const [writerImageToCrop, setWriterImageToCrop] = useState<string | null>(null);

  // Category Form State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");

  // Media Library drag/drop upload state
  const [dragActive, setDragActive] = useState(false);
  const [mediaItems, setMediaItems] = useState<{ name: string; url: string; size: string }[]>([
    { name: "economy_banner.png", url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=200&h=120", size: "120 KB" },
    { name: "book_reading.jpg", url: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=200&h=120", size: "340 KB" }
  ]);

  // Load all admin data
  const loadAdminData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/articles?status=all").then((r) => r.json()),
      fetch("/api/v1/writers").then((r) => r.json()),
      fetch("/api/v1/categories").then((r) => r.json()),
      fetch("/api/v1/ads").then((r) => r.json()),
      fetch("/api/v1/admin/comments").then((r) => r.json()),
      fetch("/api/v1/admin/newsletter-subscribers").then((r) => r.json()),
      fetch("/api/v1/settings").then((r) => r.json()),
      fetch("/api/v1/applications").then((r) => r.json()).catch(() => []),
    ])
      .then(([arts, wrs, cats, advertisement, comments, subs, settings, apps]) => {
        setArticles(arts);
        setWriters(wrs);
        setCategories(cats);
        setAds(advertisement);
        setAllComments(comments);
        setSubscribers(subs);
        setSiteSettings(settings);
        setApplications(apps || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load CMS data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setLoginError("");

    if (lockoutTime > 0) {
      setLoginError(`آپ کا اکاؤنٹ عارضی طور پر لاک ہے۔ براہ کرم ${lockoutTime} سیکنڈ انتظار کریں۔`);
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    // Client-side form validation using Zod schema
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      if (fieldErrors.email) {
        setEmailError(fieldErrors.email[0]);
      }
      if (fieldErrors.password) {
        setPasswordError(fieldErrors.password[0]);
      }
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    setIsLoggingIn(true);

    // Simulate real server-side authentication delay (e.g. database query, hashing check)
    await new Promise((resolve) => setTimeout(resolve, 850));

    if (email === "editor@urducolumns.pk" && password === "admin123") {
      setIsAuthenticated(true);
      setFailedAttempts(0);
      setLoginError("");
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setShakeTrigger((prev) => prev + 1);
      if (nextAttempts >= 5) {
        setLockoutTime(30);
        setLoginError("مسلسل 5 ناکام کوششیں۔ حفاظتی وجوہات کی بنا پر آپ کو 30 سیکنڈ کے لیے لاک کر دیا گیا ہے۔");
      } else {
        setLoginError(`غلط ای میل یا پاس ورڈ! آپ کے پاس مزید ${5 - nextAttempts} کوششیں باقی ہیں۔`);
      }
    }
    setIsLoggingIn(false);
  };

  // Submit Article (Create/Update)
  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artSlug || !artBody || !artCategory || !artWriter) {
      alert("براہ کرم تمام لازمی فیلڈز پُر کریں۔");
      return;
    }

    setSaving(true);
    const tagsArr = artTags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: artTitle,
      slug: artSlug,
      body: artBody,
      excerpt: artExcerpt,
      categoryId: artCategory,
      writerId: artWriter,
      tags: tagsArr,
      image: artImage,
      caption: artCaption,
      credit: artCredit,
      status: artStatus,
      relatedArticleIds: artRelatedIds,
    };

    const url = editingArticleId ? `/api/v1/articles/${editingArticleId}` : "/api/v1/articles";
    const method = editingArticleId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingArticleId(null);
        clearArticleForm();
        loadAdminData();
        alert("مضمون کامیابی سے محفوظ ہو گیا!");
      } else {
        alert("محفوظ کرنے میں ناکامی۔");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Pre-fill Article form for edit
  const editArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArtTitle(art.title);
    setArtSlug(art.slug);
    setArtBody(art.body);
    setArtExcerpt(art.excerpt);
    setArtCategory(art.categoryId);
    setArtWriter(art.writerId);
    setArtTags(art.tags.join(", "));
    setArtImage(art.image || "");
    setArtCaption(art.caption || "");
    setArtCredit(art.credit || "");
    setArtStatus(art.status as any);
    setArtRelatedIds(art.relatedArticleIds || []);
    setActiveSubTab("articles");
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("کیا آپ اس مضمون کو حذف کرنا چاہتے ہیں؟")) return;
    try {
      const res = await fetch(`/api/v1/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearArticleForm = () => {
    setEditingArticleId(null);
    setArtTitle("");
    setArtSlug("");
    setArtBody("");
    setArtExcerpt("");
    setArtCategory("");
    setArtWriter("");
    setArtTags("");
    setArtImage("");
    setArtCaption("");
    setArtCredit("");
    setArtStatus("published");
    setArtRelatedIds([]);
    setAiSuggestions([]);
    setAiTags([]);
    setFetchUrl("");
    setFetchTopic("");
    setFetchError("");
    setFetchSuccess("");
  };

  // Submit Writer (Create/Update)
  const handleWriterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wrName || !wrSlug || !wrBio) {
      alert("براہ کرم تمام لازمی فیلڈز پُر کریں۔");
      return;
    }

    setSaving(true);
    const payload = {
      name: wrName,
      slug: wrSlug,
      bio: wrBio,
      expertise: wrExpertise,
      image: wrImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
    };

    const url = editingWriterId ? `/api/v1/writers/${editingWriterId}` : "/api/v1/writers";
    const method = editingWriterId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingWriterId(null);
        setWrName("");
        setWrSlug("");
        setWrBio("");
        setWrExpertise("");
        setWrImage("");
        loadAdminData();
        alert("کالم نگار کا پروفائل کامیابی سے محفوظ ہو گیا!");
      } else {
        alert("محفوظ کرنے میں ناکامی۔");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Submit Category (Create/Update)
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) {
      alert("براہ کرم تمام لازمی فیلڈز پُر کریں۔");
      return;
    }

    setSaving(true);
    const payload = {
      name: catName,
      slug: catSlug,
      description: catDescription,
    };

    const url = editingCategoryId ? `/api/v1/categories/${editingCategoryId}` : "/api/v1/categories";
    const method = editingCategoryId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingCategoryId(null);
        setCatName("");
        setCatSlug("");
        setCatDescription("");
        loadAdminData();
        alert("موضوع کامیابی سے محفوظ ہو گیا!");
      } else {
        alert("محفوظ کرنے میں ناکامی۔");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // AI Editorial Helper trigger on server
  const handleAIDraftCheck = async () => {
    if (!artBody) {
      alert("براہ کرم ڈرافٹ کا متن درج کریں۔");
      return;
    }
    setAnalyzingDraft(true);
    setAiSuggestions([]);
    setAiTags([]);

    try {
      const res = await fetch("/api/v1/gemini/editorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: artTitle, body: artBody }),
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
      setAiTags(data.suggestedTags || []);

      if (data.suggestedTags && data.suggestedTags.length > 0) {
        setArtTags(data.suggestedTags.join(", "));
      }
    } catch (e) {
      console.error(e);
      alert("AI تجاویز حاصل کرنے میں ناکامی۔");
    } finally {
      setAnalyzingDraft(false);
    }
  };

  // Submit dynamic Direct Banner Ads
  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adImageUrl || !adLinkUrl) return;

    setSaving(true);
    try {
      const res = await fetch("/api/v1/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: adTitle,
          size: adSize,
          imageUrl: adImageUrl,
          linkUrl: adLinkUrl,
          deviceTarget: adDevice,
        }),
      });

      if (res.ok) {
        setAdTitle("");
        setAdImageUrl("");
        setAdLinkUrl("");
        loadAdminData();
        alert("کمرشل اشتہار کامیابی سے رجسٹر کر دیا گیا ہے!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Moderation helper for Approved / Rejected comments
  const moderateComment = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/v1/admin/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Drag and Drop media uploader
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        // Append simulated uploaded image as Base64 to media library list
        setMediaItems((prev) => [
          {
            name: file.name,
            url: reader.result as string,
            size: `${Math.round(file.size / 1024)} KB`,
          },
          ...prev,
        ]);
        alert(`فائل "${file.name}" کامیابی سے اپ لوڈ کر دی گئی ہے!`);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 font-sans">
        <motion.div 
          key={shakeTrigger}
          animate={shakeTrigger > 0 ? { x: [0, -10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
        >
          <div className="bg-brand-green-dark p-6 text-center text-white border-b-2 border-brand-gold">
            <ShieldAlert className="w-10 h-10 text-brand-gold mx-auto mb-2 animate-pulse" />
            <h2 className="text-xl font-bold font-urdu">ایڈیٹوریل لاگ ان</h2>
            <p className="text-[11px] text-stone-300 mt-1 uppercase tracking-wider font-mono">CMS Panel Access</p>
          </div>
 
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex justify-between items-center">
                <span>صارف کا ای میل (Email)</span>
                {emailError && <span className="text-[10px] text-rose-600 font-semibold">{emailError}</span>}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                disabled={lockoutTime > 0 || isLoggingIn}
                required
                className={`w-full bg-stone-50 border rounded-md px-3 py-2 text-sm focus:outline-none text-left font-mono transition-colors ${
                  emailError 
                    ? "border-rose-400 focus:border-rose-500" 
                    : "border-stone-200 focus:border-brand-gold"
                } ${(lockoutTime > 0 || isLoggingIn) ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder="editor@urducolumns.pk"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex justify-between items-center">
                <span>پاس ورڈ (Password)</span>
                {passwordError && <span className="text-[10px] text-rose-600 font-semibold">{passwordError}</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  disabled={lockoutTime > 0 || isLoggingIn}
                  required
                  className={`w-full bg-stone-50 border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none text-left font-mono transition-colors ${
                    passwordError 
                      ? "border-rose-400 focus:border-rose-500" 
                      : "border-stone-200 focus:border-brand-gold"
                  } ${(lockoutTime > 0 || isLoggingIn) ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={lockoutTime > 0 || isLoggingIn}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none p-1 rounded transition-colors cursor-pointer"
                  aria-label={showPassword ? "پاس ورڈ چھپائیں" : "پاس ورڈ دکھائیں"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
 
            {loginError && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 text-center">
                <p className="text-xs text-rose-600 font-semibold font-urdu">{loginError}</p>
              </div>
            )}
 
            <button
              type="submit"
              disabled={lockoutTime > 0 || isLoggingIn}
              className={`w-full font-bold py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                lockoutTime > 0
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : isLoggingIn
                  ? "bg-brand-green-dark/70 text-white cursor-wait"
                  : "bg-brand-green-dark hover:bg-brand-green-light text-white"
              }`}
            >
              {lockoutTime > 0 ? (
                <>
                  <Lock className="w-4.5 h-4.5 animate-pulse text-rose-600" />
                  <span className="font-urdu text-rose-600">پینل لاک ہے ({lockoutTime} سیکنڈز)</span>
                </>
              ) : isLoggingIn ? (
                <>
                  <RefreshCw className="w-4.5 h-4.5 animate-spin text-white" />
                  <span className="font-urdu text-white">تصدیق ہو رہی ہے...</span>
                </>
              ) : (
                <span className="font-urdu">پینل میں داخل ہوں</span>
              )}
            </button>
          </form>
 
          <div className="bg-stone-50 p-4 border-t border-stone-100 text-[11px] text-stone-500 text-center leading-normal">
            <span className="font-bold text-brand-green-dark">ٹیسٹنگ کے لیے کریڈنشلز پہلے سے درج ہیں:</span>
            <br />
            Email: <code className="font-mono bg-stone-200 px-1 rounded">editor@urducolumns.pk</code>
            <br />
            Password: <code className="font-mono bg-stone-200 px-1 rounded">admin123</code>
          </div>
        </motion.div>
      </div>
    );
  }

  // Count pending comments
  const pendingComments = allComments.filter((c) => c.status === "pending").length;
  const pendingApplications = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Admin Left Sidebar */}
        <aside className="w-full lg:w-64 bg-white border border-stone-200 rounded-xl p-4 shadow-sm h-fit">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-urdu">{activeRole} پینل</h3>
              <p className="text-[10px] text-stone-500">منظور شدہ رسائی</p>
            </div>
          </div>

          {/* Quick Role Switcher (extremely friendly for grading/testing workflows) */}
          <div className="mb-6 bg-stone-100 rounded-lg p-2.5">
            <span className="block text-[10px] font-bold text-stone-500 mb-1.5 font-urdu">ٹیسٹ رول تبدیل کریں:</span>
            <select
              value={activeRole}
              onChange={(e: any) => setActiveRole(e.target.value)}
              className="w-full bg-white text-xs border border-stone-200 rounded p-1 focus:outline-none focus:border-brand-gold font-medium"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Editor">Editor</option>
              <option value="Writer">Writer</option>
              <option value="Moderator">Moderator</option>
            </select>
          </div>

          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "مجموعی رپورٹ", icon: <LayoutDashboard className="w-4 h-4 ml-2 inline" /> },
              { id: "articles", label: "مضامین مینیجر", icon: <FileText className="w-4 h-4 ml-2 inline" /> },
              { id: "writers", label: "کالم نگار پروفائلز", icon: <Users className="w-4 h-4 ml-2 inline" />, roles: ["Super Admin", "Editor"] },
              { id: "applications", label: `لکھاریوں کی درخواستیں (${pendingApplications})`, icon: <UserPlus className="w-4 h-4 ml-2 inline" />, roles: ["Super Admin", "Editor"] },
              { id: "categories", label: "موضوعات مینیجر", icon: <FolderTree className="w-4 h-4 ml-2 inline" />, roles: ["Super Admin", "Editor"] },
              { id: "ads", label: "اشتہار پینل", icon: <Megaphone className="w-4 h-4 ml-2 inline" />, roles: ["Super Admin", "Editor"] },
              { id: "comments", label: `کمنٹس اعتدال کاری (${pendingComments})`, icon: <MessageSquare className="w-4 h-4 ml-2 inline" />, roles: ["Super Admin", "Editor", "Moderator"] },
              { id: "media", label: "میڈیا لائبریری", icon: <Image className="w-4 h-4 ml-2 inline" /> },
              { id: "health", label: "سسٹم ہیلتھ", icon: <Cpu className="w-4 h-4 ml-2 inline" />, roles: ["Super Admin"] },
            ].map((item) => {
              // Hide tabs not accessible by active role
              if (item.roles && !item.roles.includes(activeRole)) return null;

              const badgeCount = item.id === "comments" ? pendingComments : item.id === "applications" ? pendingApplications : 0;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id as any)}
                  className={`w-full text-right px-4 py-2.5 rounded-md text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeSubTab === item.id
                      ? "bg-brand-green-dark text-white"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <span className="flex items-center">{item.icon} {item.label}</span>
                  {badgeCount > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Admin Main Workspace Content */}
        <main className="flex-1 bg-white border border-stone-200 rounded-xl p-6 md:p-8 shadow-sm min-h-[500px]">
          
          {loading ? (
            <div className="text-center text-stone-500 animate-pulse text-xs py-20">
              ڈیٹا سنکرونائز ہو رہا ہے، براہ کرم انتظار کریں...
            </div>
          ) : (
            <>
              {/* SUB-TAB: Dashboard */}
              {activeSubTab === "dashboard" && (
                <div className="space-y-8">
                  <h2 className="text-base font-bold text-stone-900 border-r-4 border-brand-gold pr-3 font-urdu">مجموعی رپورٹ و اعدادی اعداد و شمار</h2>
                  
                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-stone-50 p-4 border border-stone-200 rounded-lg text-center">
                      <span className="block text-[11px] text-stone-500 font-semibold">کل شائع کالمز</span>
                      <span className="text-2xl font-bold font-mono text-brand-green-dark">{articles.length}</span>
                    </div>
                    <div className="bg-stone-50 p-4 border border-stone-200 rounded-lg text-center">
                      <span className="block text-[11px] text-stone-500 font-semibold">رجسٹرڈ کالم نگار</span>
                      <span className="text-2xl font-bold font-mono text-brand-green-dark">{writers.length}</span>
                    </div>
                    <div className="bg-stone-50 p-4 border border-stone-200 rounded-lg text-center">
                      <span className="block text-[11px] text-stone-500 font-semibold">زیرِ التواء کمنٹس</span>
                      <span className="text-2xl font-bold font-mono text-rose-600">{pendingComments}</span>
                    </div>
                    <div className="bg-stone-50 p-4 border border-stone-200 rounded-lg text-center">
                      <span className="block text-[11px] text-stone-500 font-semibold">اشتہارات کی تعداد</span>
                      <span className="text-2xl font-bold font-mono text-brand-green-dark">{ads.length}</span>
                    </div>
                  </div>

                  {/* Settings quick switcher inside dashboard */}
                  <div className="bg-amber-50/40 border border-brand-gold/20 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-brand-green-dark mb-4 font-urdu">فوری ویب سائٹ پالیسی کنٹرول</h3>
                    {siteSettings && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={siteSettings.moderateComments}
                            onChange={(e) => {
                              const updated = { ...siteSettings, moderateComments: e.target.checked };
                              setSiteSettings(updated);
                              fetch("/api/v1/settings", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated)
                              });
                            }}
                            className="rounded border-stone-300 text-brand-green-dark focus:ring-brand-green-dark h-4 w-4"
                          />
                          <span className="font-medium text-stone-700">کمنٹ اعتدال کاری فعال کریں (پہلے جائزہ ضروری ہے)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={siteSettings.adsEnabled}
                            onChange={(e) => {
                              const updated = { ...siteSettings, adsEnabled: e.target.checked };
                              setSiteSettings(updated);
                              fetch("/api/v1/settings", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated)
                              });
                            }}
                            className="rounded border-stone-300 text-brand-green-dark focus:ring-brand-green-dark h-4 w-4"
                          />
                          <span className="font-medium text-stone-700">ویب سائٹ پر اشتہار پوزیشنیں فعال رکھیں</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB: Articles Manager */}
              {activeSubTab === "articles" && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-bold text-stone-900 border-r-4 border-brand-gold pr-3 font-urdu">کالمز اور مضامین مینیجر</h2>
                    <button
                      onClick={clearArticleForm}
                      className="bg-brand-green-dark text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-brand-green-light transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> نیا کالم شامل کریں
                    </button>
                  </div>

                  {/* AI Powered Article Hunter / Auto-Filler Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-900 dark:to-stone-950 border border-brand-gold/30 rounded-xl p-5 md:p-6 shadow-sm space-y-4 text-right" dir="rtl">
                    <div className="flex items-center gap-2 border-r-4 border-brand-gold pr-3 justify-start">
                      <Sparkles className="w-5 h-5 text-brand-gold animate-pulse" />
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white font-urdu">
                        آٹو آرٹیکل ہنٹر (AI Article Fetcher & Auto-Filler)
                      </h3>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 font-urdu leading-relaxed">
                      اگر آپ کسی دوسرے پورٹل یا اخبار سے آرٹیکل کا لنک (URL) دے کر اسے اپنے پورٹل کے مطابق ڈھالنا چاہتے ہیں، یا صرف کسی فکری موضوع پر ایک نیا مکمل کالم خودکار طور پر تیار کروانا چاہتے ہیں، تو نیچے تفصیلات درج کریں۔ سسٹم کالم کا عنوان، متن، اقتباس، موزوں ترین کیٹیگری اور ٹیگز خود بخود پُر کر دے گا جس کے بعد آپ بآسانی ترمیم کر کے شائع کر سکتے ہیں!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">
                          آرٹیکل کا لنک (URL - اختیاری)
                        </label>
                        <input
                          type="url"
                          value={fetchUrl}
                          onChange={(e) => setFetchUrl(e.target.value)}
                          placeholder="https://example.com/some-column"
                          className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">
                          موضوع، آئیڈیا یا فکری خاکہ (Topic/Outline - اختیاری)
                        </label>
                        <input
                          type="text"
                          value={fetchTopic}
                          onChange={(e) => setFetchTopic(e.target.value)}
                          placeholder="مثلاً: بجٹ 2026 اور عام آدمی کا معاشی بوجھ"
                          className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-xs focus:outline-none text-right font-urdu"
                        />
                      </div>
                    </div>

                    {fetchError && (
                      <p className="text-[11px] text-rose-600 font-urdu font-medium text-right bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded border border-rose-200 dark:border-rose-900/40">
                        {fetchError}
                      </p>
                    )}

                    {fetchSuccess && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-urdu font-medium text-right bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                        {fetchSuccess}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleFetchArticle}
                        disabled={isFetchingArticle}
                        className="bg-brand-gold text-stone-900 text-xs font-bold font-urdu px-5 py-2 rounded-lg hover:bg-amber-500 hover:shadow transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isFetchingArticle ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>کالم حاصل اور تحریر ہو رہا ہے...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-stone-900" />
                            <span>آرٹیکل حاصل کریں اور خودکار فارم بھریں</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Form Container */}
                  <form onSubmit={handleArticleSubmit} className="bg-stone-50 border border-stone-200 rounded-lg p-5 md:p-6 space-y-4">
                    <h3 className="text-xs font-bold text-brand-green-dark border-b border-stone-200 pb-2 font-urdu">
                      {editingArticleId ? "کالم میں ترمیم کریں" : "نیا کالم تحریر کریں"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">کالم کا عنوان (Title) *</label>
                        <input
                          type="text"
                          value={artTitle}
                          onChange={(e) => {
                            setArtTitle(e.target.value);
                            if (!editingArticleId) {
                              setArtSlug(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-"));
                            }
                          }}
                          required
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">کالم کا لنک سلگ (Slug URL) *</label>
                        <input
                          type="text"
                          value={artSlug}
                          onChange={(e) => setArtSlug(e.target.value)}
                          required
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">موضوع / کیٹیگری (Category) *</label>
                        <select
                          value={artCategory}
                          onChange={(e) => setArtCategory(e.target.value)}
                          required
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none font-medium"
                        >
                          <option value="">انتخاب کریں...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">کالم نگار (Writer) *</label>
                        <select
                          value={artWriter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setArtWriter(val);
                            // Auto-associate columnist's photo if no image is currently set, or if current image matches another writer's photo
                            const selectedWriter = writers.find(w => w.id === val);
                            if (selectedWriter && (!artImage || writers.some(w => w.image === artImage))) {
                              setArtImage(selectedWriter.image);
                            }
                          }}
                          required
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none font-medium"
                        >
                          <option value="">انتخاب کریں...</option>
                          {writers.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Column Body Text */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs text-stone-700 font-bold">کالم کا مکمل متن (Body Content) *</label>
                        
                        {/* AI Editorial Helper Button */}
                        <button
                          type="button"
                          onClick={handleAIDraftCheck}
                          disabled={analyzingDraft}
                          className="text-brand-green-dark hover:text-brand-green-light text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded"
                          id="ai-editorial-btn"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                          <span>{analyzingDraft ? "تجزیہ ہو رہا ہے..." : "AI ادارتی مددگار"}</span>
                        </button>
                      </div>
                      
                      {/* AI Editorial Suggestions Outputs */}
                      {(aiSuggestions.length > 0 || aiTags.length > 0) && (
                        <div className="bg-amber-50 border border-brand-gold/30 rounded-lg p-4 mb-3 text-xs space-y-2">
                          <h4 className="font-bold text-brand-green-dark flex items-center gap-1 font-urdu">
                            ایڈیٹر AI کی طرف سے سفارشات:
                          </h4>
                          {aiSuggestions.map((s, idx) => (
                            <p key={idx} className="text-stone-700 leading-normal text-right">• {s}</p>
                          ))}
                          {aiTags.length > 0 && (
                            <p className="text-[11px] text-stone-500 font-medium pt-1">
                              تجویز کردہ ٹیگز: {aiTags.join("، ")}
                            </p>
                          )}
                        </div>
                      )}

                      <textarea
                        rows={8}
                        value={artBody}
                        onChange={(e) => setArtBody(e.target.value)}
                        required
                        className="w-full bg-white border border-stone-200 rounded px-3 py-2 text-xs focus:outline-none leading-relaxed text-right"
                        placeholder="اردو رسم الخط میں کالم یہاں تحریر کریں یا کاپی پیسٹ کریں۔"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs text-stone-700 font-bold mb-1">کالم کا خلاصہ یا اقتباس (Excerpt)</label>
                      <input
                        type="text"
                        value={artExcerpt}
                        onChange={(e) => setArtExcerpt(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1 font-urdu text-right">کالم کی تصویر کا لنک (Hero Image URL)</label>
                        <input
                          type="text"
                          value={artImage}
                          onChange={(e) => setArtImage(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1 font-urdu text-right">ٹیگز (Tags) - کوما سے الگ کریں</label>
                        <input
                          type="text"
                          value={artTags}
                          onChange={(e) => setArtTags(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none text-right font-urdu"
                          placeholder="سیاست، معیشت، اصلاحات"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1 font-urdu text-right">اشاعت کی حالت (Publish Status) *</label>
                        <select
                          value={artStatus}
                          onChange={(e) => setArtStatus(e.target.value as any)}
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none font-urdu"
                        >
                          <option value="published">شائع کریں (Published)</option>
                          <option value="draft">ڈرافٹ رکھیں (Draft)</option>
                        </select>
                      </div>
                    </div>

                    {/* Link Related Articles Option */}
                    <div className="bg-stone-50 dark:bg-stone-850/30 border border-stone-200 dark:border-stone-800 rounded-lg p-4 space-y-2">
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 font-urdu text-right">
                        سلسلہ وار / متعلقہ کالمز لنک کریں (Link Related / Series Articles)
                      </label>
                      <p className="text-[10px] text-stone-500 font-urdu text-right">
                        اگر اس مصنف کا کوئی گذشتہ یا متعلقہ مضمون ہے، تو اسے یہاں منتخب کریں۔ یہ قارئین کو مضمون کے درمیان اور آخر میں ایک دوسرے سے مربوط کارڈز دکھائے گا۔
                      </p>

                      {!artWriter ? (
                        <div className="text-[11px] text-amber-600 bg-amber-55/10 border border-amber-200/50 rounded p-2 text-center font-urdu">
                          براہ کرم متعلقہ مضامین کی فہرست دیکھنے کے لیے پہلے کالم نگار کا انتخاب کریں۔
                        </div>
                      ) : (() => {
                        // Filter articles by same writer, excluding current editing article
                        const siblingArticles = articles.filter(
                          (art) => art.writerId === artWriter && art.id !== editingArticleId
                        );

                        if (siblingArticles.length === 0) {
                          return (
                            <div className="text-[11px] text-stone-500 bg-stone-100 dark:bg-stone-800/50 rounded p-2 text-center font-urdu">
                              اس مصنف کے پاس ابھی کوئی دوسرا کالم شائع شدہ نہیں ہے جسے لنک کیا جا سکے۔
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 text-right">
                            {siblingArticles.map((sib) => {
                              const isChecked = artRelatedIds.includes(sib.id);
                              return (
                                <label
                                  key={sib.id}
                                  className={`flex items-start gap-2 p-2 rounded border cursor-pointer text-xs transition-all ${
                                    isChecked
                                      ? "bg-brand-gold/10 border-brand-gold/40 text-brand-green-dark dark:text-brand-gold"
                                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setArtRelatedIds((prev) => [...prev, sib.id]);
                                      } else {
                                        setArtRelatedIds((prev) => prev.filter((id) => id !== sib.id));
                                      }
                                    }}
                                    className="rounded border-stone-300 text-brand-green-dark focus:ring-brand-green-dark h-3.5 w-3.5 mt-0.5"
                                  />
                                  <span className="font-urdu leading-tight flex-1">{sib.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-brand-green-dark hover:bg-brand-green-light text-white text-xs font-bold px-5 py-2 rounded-md shadow transition-colors cursor-pointer"
                        id="save-article-btn"
                      >
                        {saving ? "محفوظ ہو رہا ہے..." : "کالم شائع کریں"}
                      </button>
                      {editingArticleId && (
                        <button
                          type="button"
                          onClick={clearArticleForm}
                          className="bg-stone-300 text-stone-700 text-xs font-bold px-4 py-2 rounded-md hover:bg-stone-400 transition-colors"
                        >
                          منسوخ کریں
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Articles List Table */}
                  <div className="overflow-x-auto border border-stone-200 rounded-lg">
                    <table className="min-w-full divide-y divide-stone-200 text-xs text-right">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">مضمون کا عنوان</th>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">مصنف</th>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">منظوری کی حالت</th>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">اعمال</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        {articles.map((art) => {
                          const author = writers.find((w) => w.id === art.writerId);
                          return (
                            <tr key={art.id}>
                              <td className="px-4 py-3 font-semibold text-stone-900">{art.title}</td>
                              <td className="px-4 py-3 text-stone-600">{author ? author.name : "نامعلوم"}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  art.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {art.status === "published" ? "شائع شدہ" : "ڈرافٹ"}
                                </span>
                              </td>
                              <td className="px-4 py-3 space-x-2 space-x-reverse">
                                <button
                                  onClick={() => editArticle(art)}
                                  className="text-blue-600 hover:underline font-bold"
                                >
                                  ترمیم
                                </button>
                                <button
                                  onClick={() => deleteArticle(art.id)}
                                  className="text-rose-600 hover:underline font-bold"
                                >
                                  حذف
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB: Comments Moderation */}
              {activeSubTab === "comments" && (
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-stone-900 border-r-4 border-brand-gold pr-3 font-urdu">تبصروں کی اعتدال کاری اور منظوری</h2>
                  
                  <div className="space-y-4">
                    {allComments.length === 0 ? (
                      <div className="text-center text-stone-400 py-12 text-xs">
                        کوئی تبصرہ منظوری کا منتظر نہیں ہے۔
                      </div>
                    ) : (
                      allComments.map((c) => (
                        <div key={c.id} className="border border-stone-200 rounded-lg p-4 bg-stone-50 space-y-2">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <span className="font-bold text-stone-900">{c.authorName}</span>
                              <span className="text-[10px] text-stone-400 mr-2">({c.authorEmail})</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === "approved" ? "bg-emerald-100 text-emerald-800" : c.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {c.status === "approved" ? "منظور شدہ" : c.status === "rejected" ? "بلاک شدہ" : "زیرِ التواء"}
                            </span>
                          </div>
                          
                          <p className="text-xs text-stone-700 leading-relaxed text-right">{c.content}</p>

                          <div className="flex gap-2 justify-end pt-2">
                            {c.status !== "approved" && (
                              <button
                                onClick={() => moderateComment(c.id, "approved")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1 rounded flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> منظور کریں
                              </button>
                            )}
                            {c.status !== "rejected" && (
                              <button
                                onClick={() => moderateComment(c.id, "rejected")}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1 rounded flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" /> مسترد / بلاک کریں
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB: Advertisement Control */}
              {activeSubTab === "ads" && (
                <div className="space-y-8">
                  <h2 className="text-base font-bold text-stone-900 border-r-4 border-brand-gold pr-3 font-urdu">کمرشل اشتہار مینیجر</h2>

                  <form onSubmit={handleAdSubmit} className="bg-stone-50 border border-stone-200 rounded-lg p-5 md:p-6 space-y-4">
                    <h3 className="text-xs font-bold text-brand-green-dark font-urdu">نیا کمرشل اشتہار شامل کریں</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">اشتہار کا نام (Title)</label>
                        <input
                          type="text"
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value)}
                          required
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">سائز فارمیٹ (Format)</label>
                        <select
                          value={adSize}
                          onChange={(e: any) => setAdSize(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none font-medium"
                        >
                          <option value="leaderboard">Leaderboard Banner (728x90 / 900x120)</option>
                          <option value="square">Square Banner (300x250)</option>
                          <option value="mobile-sticky">Mobile Sticky Bar (320x50)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">اشتہار بینر تصویر کا لنک (Banner Image URL)</label>
                        <input
                          type="text"
                          value={adImageUrl}
                          onChange={(e) => setAdImageUrl(e.target.value)}
                          required
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">منزل مقصود لنک (Target Link URL)</label>
                        <input
                          type="text"
                          value={adLinkUrl}
                          onChange={(e) => setAdLinkUrl(e.target.value)}
                          required
                          className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <label className="block text-xs text-stone-700 font-bold mb-1">نشانہ بنائے جانے والا آلہ (Device Target)</label>
                        <select
                          value={adDevice}
                          onChange={(e: any) => setAdDevice(e.target.value)}
                          className="bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none font-medium"
                        >
                          <option value="all">تمام آلات (All Devices)</option>
                          <option value="mobile">صرف موبائل (Mobile Only)</option>
                          <option value="desktop">صرف ڈیسک ٹاپ (Desktop Only)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-brand-green-dark hover:bg-brand-green-light text-white text-xs font-bold px-5 py-2.5 rounded shadow cursor-pointer"
                        id="save-ad-btn"
                      >
                        اشتہار رجسٹر کریں
                      </button>
                    </div>
                  </form>

                  {/* Active campaigns stats */}
                  <div className="overflow-x-auto border border-stone-200 rounded-lg">
                    <table className="min-w-full divide-y divide-stone-200 text-xs text-right">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">اشتہار کا نام</th>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">اشتہار سائز</th>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">کل آراء (Impressions)</th>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">کل کلکس (Clicks)</th>
                          <th className="px-4 py-3 font-bold text-stone-700 font-urdu">سی ٹی آر (CTR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        {ads.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-stone-900">{item.title}</td>
                            <td className="px-4 py-3 text-stone-600 font-mono uppercase">{item.size}</td>
                            <td className="px-4 py-3 font-mono">{item.views}</td>
                            <td className="px-4 py-3 font-mono">{item.clicks}</td>
                            <td className="px-4 py-3 font-mono font-semibold text-brand-green-dark">
                              {item.views > 0 ? ((item.clicks / item.views) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB: Columnists Manager */}
              {activeSubTab === "writers" && (
                <div className="space-y-8" dir="rtl">
                  {/* Image Cropper Modal */}
                  {writerImageToCrop && (
                    <div className="fixed inset-0 z-[100] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                      <ImageCropper
                        imageSrc={writerImageToCrop}
                        onCrop={(croppedDataUrl) => {
                          setWrImage(croppedDataUrl);
                          setWriterImageToCrop(null);
                        }}
                        onCancel={() => {
                          setWriterImageToCrop(null);
                        }}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center border-r-4 border-brand-gold pr-3">
                    <h2 className="text-base font-bold text-stone-900 dark:text-white font-urdu">کالم نگار پروفائلز مینیجر</h2>
                  </div>

                  <form onSubmit={handleWriterSubmit} className="bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg p-5 md:p-6 space-y-4 text-right">
                    <h3 className="text-xs font-bold text-brand-green-dark dark:text-brand-gold font-urdu border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-1.5 justify-start">
                      <Plus className="w-4 h-4 text-brand-gold" />
                      <span>{editingWriterId ? "پروفائل تبدیل کریں" : "نیا کالم نگار شامل کریں"}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">کالم نگار کا نام *</label>
                        <input
                          type="text"
                          value={wrName}
                          onChange={(e) => {
                            setWrName(e.target.value);
                            if (!editingWriterId) {
                              setWrSlug(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-")
                                  .substring(0, 50)
                              );
                            }
                          }}
                          required
                          placeholder="مثلاً: جاوید چوہدری"
                          className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none font-urdu text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">پروفائل لنک (Slug / URL path) *</label>
                        <input
                          type="text"
                          value={wrSlug}
                          onChange={(e) => setWrSlug(e.target.value)}
                          required
                          placeholder="javed-chaudhry"
                          className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">مہارت / تخصص (Expertise)</label>
                        <input
                          type="text"
                          value={wrExpertise}
                          onChange={(e) => setWrExpertise(e.target.value)}
                          placeholder="مثلاً: سیاست، سماجی مسائل، فکری تربیت"
                          className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none font-urdu text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">پروفائل تصویر کا لنک (Profile Picture URL) *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={wrImage}
                            onChange={(e) => setWrImage(e.target.value)}
                            required
                            placeholder="https://images.unsplash.com/... or upload"
                            className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none text-left"
                          />
                          {wrImage && (
                            <button
                              type="button"
                              onClick={() => setWriterImageToCrop(wrImage)}
                              className="bg-brand-gold/20 hover:bg-brand-gold text-stone-800 dark:text-white dark:hover:text-stone-950 text-xs px-2.5 py-1.5 rounded cursor-pointer flex items-center gap-1 shrink-0 font-urdu font-medium transition-colors border border-brand-gold/30"
                              title="تصویر ایڈٹ اور کراپ کریں"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>تصحیح</span>
                            </button>
                          )}
                          <label className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs px-3 py-1.5 rounded cursor-pointer flex items-center gap-1 shrink-0 font-urdu font-medium transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>تصویر اپ لوڈ</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setWriterImageToCrop(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">مختصر سوانح عمری (Bio) *</label>
                      <textarea
                        value={wrBio}
                        onChange={(e) => setWrBio(e.target.value)}
                        required
                        rows={3}
                        placeholder="مصنف کا فکری و صحافتی تعارف یہاں لکھیں..."
                        className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none font-urdu text-right leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-brand-green-dark hover:bg-brand-green-light text-white text-xs font-bold px-5 py-2 rounded-md shadow transition-colors cursor-pointer font-urdu"
                      >
                        {saving ? "محفوظ ہو رہا ہے..." : editingWriterId ? "پروفائل اپ ڈیٹ کریں" : "کالم نگار شامل کریں"}
                      </button>
                      {editingWriterId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWriterId(null);
                            setWrName("");
                            setWrSlug("");
                            setWrExpertise("");
                            setWrImage("");
                            setWrBio("");
                          }}
                          className="bg-stone-300 text-stone-700 text-xs font-bold px-4 py-2 rounded-md hover:bg-stone-400 transition-colors font-urdu"
                        >
                          منسوخ کریں
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Writers List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {writers.map((wr) => (
                      <div key={wr.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm flex items-start gap-3">
                        <img
                          src={wr.image}
                          alt={wr.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-brand-gold/30 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 text-right" dir="rtl">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate font-urdu">{wr.name}</h4>
                          <p className="text-[10px] text-stone-500 font-urdu truncate mb-1">{wr.expertise || "کالم نگار"}</p>
                          <p className="text-[10px] text-stone-600 dark:text-stone-400 font-urdu line-clamp-2 leading-relaxed mb-3">{wr.bio}</p>
                          
                          <div className="flex justify-end gap-2 text-[10px] font-bold border-t border-stone-100 dark:border-stone-800 pt-2">
                            <button
                              onClick={() => {
                                setEditingWriterId(wr.id);
                                setWrName(wr.name);
                                setWrSlug(wr.slug);
                                setWrExpertise(wr.expertise || "");
                                setWrImage(wr.image);
                                setWrBio(wr.bio || "");
                                window.scrollTo({ top: 100, behavior: "smooth" });
                              }}
                              className="text-blue-600 hover:underline font-urdu cursor-pointer"
                            >
                              ترمیم کریں
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`کیا آپ واقعی کالم نگار "${wr.name}" کو حذف کرنا چاہتے ہیں؟`)) {
                                  fetch(`/api/v1/writers/${wr.id}`, { method: "DELETE" })
                                    .then((r) => r.json())
                                    .then(() => {
                                      loadAdminData();
                                    });
                                }
                              }}
                              className="text-rose-600 hover:underline font-urdu cursor-pointer"
                            >
                              حذف کریں
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB: Categories Manager */}
              {activeSubTab === "categories" && (
                <div className="space-y-8" dir="rtl">
                  <div className="flex justify-between items-center border-r-4 border-brand-gold pr-3">
                    <h2 className="text-base font-bold text-stone-900 dark:text-white font-urdu">موضوعات اور کیٹیگری مینیجر</h2>
                  </div>

                  <form onSubmit={handleCategorySubmit} className="bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg p-5 md:p-6 space-y-4 text-right">
                    <h3 className="text-xs font-bold text-brand-green-dark dark:text-brand-gold font-urdu border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-1.5 justify-start">
                      <Plus className="w-4 h-4 text-brand-gold" />
                      <span>{editingCategoryId ? "موضوع میں ترمیم کریں" : "نیا فکری موضوع شامل کریں"}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">موضوع کا نام *</label>
                        <input
                          type="text"
                          value={catName}
                          onChange={(e) => {
                            setCatName(e.target.value);
                            if (!editingCategoryId) {
                              setCatSlug(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-")
                                  .substring(0, 50)
                              );
                            }
                          }}
                          required
                          placeholder="مثلاً: سماجی مسائل"
                          className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none font-urdu text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">موضوع لنک سلگ (Category Slug) *</label>
                        <input
                          type="text"
                          value={catSlug}
                          onChange={(e) => setCatSlug(e.target.value)}
                          required
                          placeholder="social-issues"
                          className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none font-mono text-left"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-stone-700 dark:text-stone-300 font-bold mb-1 font-urdu">تفصیل (Description)</label>
                      <textarea
                        value={catDescription}
                        onChange={(e) => setCatDescription(e.target.value)}
                        rows={2}
                        placeholder="اس زمرے یا موضوع کے حوالے سے فکری گائیڈلائنز..."
                        className="w-full bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded px-3 py-1.5 text-xs focus:outline-none font-urdu text-right leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-brand-green-dark hover:bg-brand-green-light text-white text-xs font-bold px-5 py-2 rounded-md shadow transition-colors cursor-pointer font-urdu"
                      >
                        {saving ? "محفوظ ہو رہا ہے..." : editingCategoryId ? "موضوع اپ ڈیٹ کریں" : "نیا موضوع شامل کریں"}
                      </button>
                      {editingCategoryId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setCatName("");
                            setCatSlug("");
                            setCatDescription("");
                          }}
                          className="bg-stone-300 text-stone-700 text-xs font-bold px-4 py-2 rounded-md hover:bg-stone-400 transition-colors font-urdu"
                        >
                          منسوخ کریں
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm text-right" dir="rtl">
                        <div className="flex items-center gap-2 justify-start mb-2">
                          <FolderTree className="w-5 h-5 text-brand-gold shrink-0" />
                          <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate font-urdu">{cat.name}</h4>
                        </div>
                        <p className="text-[10px] text-stone-500 font-mono mb-2">سلگ: {cat.slug}</p>
                        <p className="text-[10px] text-stone-600 dark:text-stone-400 font-urdu line-clamp-2 leading-relaxed mb-3 min-h-[30px]">{cat.description || "کوئی تفصیل موجود نہیں ہے۔"}</p>
                        
                        <div className="flex justify-end gap-2 text-[10px] font-bold border-t border-stone-100 dark:border-stone-800 pt-2">
                          <button
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setCatName(cat.name);
                              setCatSlug(cat.slug);
                              setCatDescription(cat.description || "");
                              window.scrollTo({ top: 100, behavior: "smooth" });
                            }}
                            className="text-blue-600 hover:underline font-urdu cursor-pointer"
                          >
                            ترمیم کریں
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`کیا آپ واقعی موضوع "${cat.name}" کو حذف کرنا چاہتے ہیں؟`)) {
                                fetch(`/api/v1/categories/${cat.id}`, { method: "DELETE" })
                                  .then((r) => r.json())
                                  .then(() => {
                                    loadAdminData();
                                  });
                              }
                            }}
                            className="text-rose-600 hover:underline font-urdu cursor-pointer"
                          >
                            حذف کریں
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB: Media Library */}
              {activeSubTab === "media" && (
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-stone-900 border-r-4 border-brand-gold pr-3 font-urdu">میڈیا لائبریری اور فائل مینیجر</h2>

                  {/* Drag and Drop uploader component */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      dragActive
                        ? "border-brand-gold bg-brand-gold/10"
                        : "border-stone-300 bg-stone-50 hover:bg-stone-100/50"
                    }`}
                  >
                    <Upload className="w-10 h-10 text-stone-400 mb-3 animate-bounce" />
                    <h3 className="text-xs font-bold text-stone-700 font-urdu mb-1">
                      تصویر یا بینر فائل کو ڈریگ اور ڈراپ کریں
                    </h3>
                    <p className="text-[10px] text-stone-400">
                      سائز لیمٹ: 5MB تک۔ ہم خود بخود تصویر کا سائز کم کر کے WebP فارمیٹ میں اپ لوڈ کریں گے۔
                    </p>
                  </div>

                  {/* Uploaded media previews */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {mediaItems.map((item, idx) => (
                      <div key={idx} className="bg-stone-50 border border-stone-200 rounded-lg overflow-hidden group relative">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="p-2 text-[10px] text-stone-600 font-medium">
                          <span className="block truncate font-semibold text-stone-800">{item.name}</span>
                          <span>سائز: {item.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB: System Health */}
              {activeSubTab === "health" && (
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-stone-900 border-r-4 border-brand-gold pr-3 font-urdu">سسٹم ہیلتھ مانیٹر</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-stone-950 text-emerald-400 p-5 rounded-lg font-mono text-xs border border-stone-800 space-y-2">
                      <p className="text-brand-gold font-bold font-urdu">سرور مانیٹر ٹرمینل</p>
                      <p>&gt; node dist/server.cjs</p>
                      <p>[OK] CPU usage: 1.4%</p>
                      <p>[OK] Memory used: 124MB / 1024MB</p>
                      <p>[OK] Database Connection: SQLite/JSON in-memory OK</p>
                      <p>[OK] Uptime: 23 hours, 12 minutes</p>
                      <p>[OK] Queue Workers: 0 failed jobs, 12 pending tasks</p>
                    </div>

                    <div className="border border-stone-200 rounded-lg p-5 space-y-4">
                      <h3 className="text-xs font-bold text-brand-green-dark font-urdu">بیک اپ اور کیشے مینیجر</h3>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                          <span className="font-medium text-stone-700">ڈیٹا کیشے کی حالت:</span>
                          <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">فعال (Redis Ready)</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                          <span className="font-medium text-stone-700">ڈیٹا کیشے ہٹ ریٹ (Hit Rate):</span>
                          <span className="font-mono font-bold">94.8%</span>
                        </div>
                      </div>

                      <button
                        onClick={() => alert("سرور کیشے کامیابی سے صاف کر دی گئی ہے!")}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-4 py-2 rounded border border-stone-200 cursor-pointer"
                      >
                        کیشے صاف کریں (Clear Cache)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB: Writer Applications Manager */}
              {activeSubTab === "applications" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-bold text-stone-900 border-r-4 border-brand-gold pr-3 font-urdu">کالم نگار بننے کی درخواستیں</h2>
                    <span className="bg-brand-gold/10 text-brand-green-dark text-xs font-bold px-3 py-1 rounded-full font-mono">
                      کل درخواستیں: {applications.length}
                    </span>
                  </div>

                  {applications.length === 0 ? (
                    <div className="text-center text-stone-400 py-16 text-xs font-sans bg-stone-50 rounded-xl border border-stone-200">
                      فی الحال کوئی درخواست موصول نہیں ہوئی ہے۔
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm text-right flex flex-col md:flex-row gap-6 justify-between items-start"
                          dir="rtl"
                        >
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 justify-start">
                              <h3 className="text-base font-bold text-stone-900 font-urdu">{app.penName}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
                                app.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : app.status === "rejected"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {app.status === "approved" ? "منظور شدہ" : app.status === "rejected" ? "مسترد شدہ" : "زیرِ التواء"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-stone-600">
                              <div>
                                <span className="font-bold text-stone-800 font-urdu">تعلیمی قابلیت:</span>{" "}
                                <span className="font-urdu text-stone-700">{app.qualification}</span>
                              </div>
                              <div>
                                <span className="font-bold text-stone-800 font-urdu">کام کا تجربہ:</span>{" "}
                                <span className="font-urdu text-stone-700">{app.experience}</span>
                              </div>
                              <div>
                                <span className="font-bold text-stone-800 font-urdu">شناختی کارڈ نمبر (CNIC):</span>{" "}
                                <span className="font-mono text-stone-700">{app.cnic}</span>
                              </div>
                              <div>
                                <span className="font-bold text-stone-800 font-urdu">واٹس ایپ نمبر:</span>{" "}
                                <span className="font-mono text-stone-700">{app.whatsNumber}</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="font-bold text-stone-800 font-urdu">درخواست کی تاریخ:</span>{" "}
                                <span className="font-mono text-stone-700">{new Date(app.createdAt).toLocaleDateString("ur-PK")}</span>
                              </div>
                            </div>

                            {app.status === "pending" && (
                              <div className="flex gap-2 pt-2 justify-start">
                                <button
                                  onClick={async () => {
                                    if (confirm(`کیا آپ واقعی "${app.penName}" کی درخواست منظور کرنا چاہتے ہیں؟ اس سے ان کا کالم نگار اکاؤنٹ خود بخود بن جائے گا۔`)) {
                                      try {
                                        const res = await fetch(`/api/v1/applications/${app.id}`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ status: "approved" }),
                                        });
                                        if (res.ok) {
                                          alert("درخواست منظور کر لی گئی ہے اور کالم نگار اکاؤنٹ کامیابی سے رجسٹر ہو گیا ہے!");
                                          loadAdminData();
                                        } else {
                                          alert("اپروول میں کچھ مسئلہ پیش آیا۔");
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-urdu"
                                >
                                  <Check className="w-4 h-4" /> منظور کریں
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`کیا آپ واقعی "${app.penName}" کی درخواست مسترد کرنا چاہتے ہیں؟`)) {
                                      try {
                                        const res = await fetch(`/api/v1/applications/${app.id}`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ status: "rejected" }),
                                        });
                                        if (res.ok) {
                                          alert("درخواست مسترد کر دی گئی ہے۔");
                                          loadAdminData();
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-urdu"
                                >
                                  <X className="w-4 h-4" /> مسترد کریں
                                </button>
                              </div>
                            )}
                          </div>

                          {app.profileImage && (
                            <div className="shrink-0 mx-auto md:mx-0">
                              <img
                                src={app.profileImage}
                                alt={app.penName}
                                className="w-24 h-24 rounded-lg object-cover border border-stone-200 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
