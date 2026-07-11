import React, { useState } from "react";
import { Mail, CheckCircle2, AlertTriangle, Newspaper, Globe } from "lucide-react";

interface FooterProps {
  onTabChange: (tab: string) => void;
}

export default function Footer({ onTabChange }: FooterProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (res.ok) {
        setSubscribed(true);
        setEmail("");
        setName("");
      } else {
        const data = await res.json();
        setError(data.error || "سبسکرپشن ناکام رہی۔ براہ کرم دوبارہ کوشش کریں۔");
      }
    } catch (err) {
      console.error(err);
      setError("کنکشن کا مسئلہ۔ دوبارہ کوشش کریں۔");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-brand-green-dark text-stone-200 border-t-4 border-brand-gold mt-auto pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Introduction */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center font-bold text-brand-green-dark">
                ق
              </div>
              <span className="text-xl font-bold font-urdu text-white tracking-tight">
                اردو کالمز ڈاٹ پی کے
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-light">
              پاکستان کی سب سے معتبر اور جدید ترین فکری آراء کی ویب سائٹ۔ ہم ملک کے مایہ ناز دانشوروں، تجزیہ کاروں اور مبصرین کے مضامین ایک جگہ مہیا کرتے ہیں۔
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Globe className="w-4 h-4 text-brand-gold" />
              <span>عالمی اردو قارئین کے لیے خصوصی پورٹل</span>
            </div>
          </div>

          {/* Useful Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white border-r-4 border-brand-gold pr-3 mb-4 font-urdu">
              خصوصی صفحات
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onTabChange("about")} className="hover:text-brand-gold hover:underline text-stone-300">
                  ہمارے بارے میں (About Us)
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange("contact")} className="hover:text-brand-gold hover:underline text-stone-300">
                  رابطہ کریں (Contact Us)
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange("submit")} className="hover:text-brand-gold hover:underline text-stone-300">
                  کالم بھیجیں (Submit Column)
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange("advertise")} className="hover:text-brand-gold hover:underline text-stone-300">
                  اشتہار دیں (Advertise)
                </button>
              </li>
            </ul>
          </div>

          {/* Editorial Trust Policies */}
          <div>
            <h3 className="text-sm font-semibold text-white border-r-4 border-brand-gold pr-3 mb-4 font-urdu">
              ادارتی پالیسیاں
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onTabChange("editorial-policy")} className="hover:text-brand-gold hover:underline text-stone-300">
                  ادارتی پالیسی (Editorial Policy)
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange("corrections-policy")} className="hover:text-brand-gold hover:underline text-stone-300">
                  تصحیح کی پالیسی (Corrections)
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange("privacy")} className="hover:text-brand-gold hover:underline text-stone-300">
                  رازداری کی پالیسی (Privacy Policy)
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange("terms")} className="hover:text-brand-gold hover:underline text-stone-300">
                  قوانین و ضوابط (Terms & Conditions)
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter subscription */}
          <div className="bg-white/5 p-5 rounded-lg border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2 font-urdu flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-brand-gold" />
                سبسکرپشن نیوز لیٹر
              </h3>
              <p className="text-[11px] text-stone-300 mb-4 leading-normal">
                روزانہ کی بنیاد پر صفِ اول کے کالم نگاروں کے تازہ ترین کالم براہِ راست اپنے ان باکس میں حاصل کریں۔
              </p>
            </div>

            {subscribed ? (
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-3 rounded text-center text-xs flex flex-col items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>مبارک ہو! آپ کا نیوز لیٹر کامیابی سے رجسٹر کر دیا گیا ہے۔</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="text"
                  placeholder="اپنا نام لکھیں..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-stone-400 text-xs rounded-md px-3 py-2 border border-white/10 focus:outline-none focus:border-brand-gold"
                />
                <div className="relative">
                  <input
                    type="email"
                    placeholder="اپنا ای میل لکھیں..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/10 text-white placeholder-stone-400 text-xs rounded-md px-3 py-2 pl-8 border border-white/10 focus:outline-none focus:border-brand-gold"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                </div>
                {error && (
                  <div className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-gold text-brand-green-dark text-xs font-bold py-2 rounded-md hover:bg-brand-gold-dark transition-colors cursor-pointer shadow-md"
                >
                  {submitting ? "انتظار کریں..." : "سبسکرائب کریں"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Base bar credits */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <div className="mb-4 sm:mb-0">
            © 2026 اردو کالمز ڈاٹ پی کے (UrduColumns.pk). جملہ حقوق محفوظ ہیں۔
          </div>
          <div className="flex gap-4 font-mono text-[10px]">
            <a href="/sitemap.xml" target="_blank" className="hover:text-brand-gold hover:underline">
              Sitemap XML
            </a>
            <span className="text-white/10">|</span>
            <a href="/rss.xml" target="_blank" className="hover:text-brand-gold hover:underline">
              RSS Feed
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
