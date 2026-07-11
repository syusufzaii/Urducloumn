import React, { useState } from "react";
import { User, GraduationCap, Briefcase, CreditCard, Phone, Image as ImageIcon, Send, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import ImageCropper from "./ImageCropper";

interface ApplyWriterProps {
  onBack?: () => void;
}

export default function ApplyWriter({ onBack }: ApplyWriterProps) {
  const [formData, setFormData] = useState({
    penName: "",
    qualification: "",
    experience: "",
    cnic: "",
    whatsApp: "",
    image: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert uploaded image file to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("تصویر کا سائز 2MB سے کم ہونا ضروری ہے۔");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageToCrop(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Basic validation
    if (!formData.penName.trim()) {
      setError("براہ کرم اپنا قلمی نام درج کریں۔");
      setSubmitting(false);
      return;
    }
    if (!formData.qualification.trim()) {
      setError("براہ کرم اپنی تعلیم درج کریں۔");
      setSubmitting(false);
      return;
    }
    if (!formData.experience.trim()) {
      setError("براہ کرم اپنا سابقہ کام یا تجربہ درج کریں۔");
      setSubmitting(false);
      return;
    }
    if (!formData.cnic.trim()) {
      setError("براہ کرم اپنا شناختی کارڈ نمبر درج کریں۔");
      setSubmitting(false);
      return;
    }
    if (!formData.whatsApp.trim()) {
      setError("براہ کرم اپنا واٹس ایپ نمبر درج کریں۔");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          penName: "",
          qualification: "",
          experience: "",
          cnic: "",
          whatsApp: "",
          image: "",
        });
        setImagePreview(null);
      } else {
        const data = await response.json();
        setError(data.error || "درخواست جمع کرنے میں کوئی مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔");
      }
    } catch (err) {
      console.error(err);
      setError("سرور کے ساتھ رابطے میں خرابی۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں۔");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center font-sans">
        <div className="bg-white dark:bg-stone-900 border-2 border-brand-gold/30 rounded-3xl p-8 md:p-12 shadow-xl space-y-6">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold font-urdu text-stone-900 dark:text-white">درخواست کامیابی کے ساتھ جمع ہو گئی ہے!</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed leading-urdu text-right md:text-center">
            آپ کی درخواست موصول ہو گئی ہے۔ ہماری ایڈیٹوریل ٹیم آپ کی تعلیم، شناختی کارڈ اور تجرباتی کام کا تفصیلی جائزہ لے گی۔ تفصیلات درست پائے جانے پر آپ کا کالم نگار اکاؤنٹ فعال (Verified) کر دیا جائے گا اور ہم آپ سے دیے گئے واٹس ایپ نمبر پر رابطہ کریں گے۔
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setSubmitted(false)}
              className="bg-brand-green-dark text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-brand-green-light transition-colors cursor-pointer"
            >
              ایک اور درخواست جمع کریں
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs px-6 py-3 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                مرکزی صفحہ پر جائیں
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-sans">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-brand-gold transition-colors cursor-pointer ml-auto flex-row-reverse"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="font-urdu">مرکزی صفحہ پر واپس جائیں</span>
        </button>
      )}

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-md overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-brand-green-dark to-stone-900 text-white p-6 md:p-8 text-right relative">
          <div className="absolute left-6 top-6 bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            Join Team
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-urdu text-brand-gold">کالم نگار بننے کے لیے درخواست دیں</h1>
          <p className="text-xs text-stone-300 mt-2 leading-relaxed font-light leading-urdu">
            اگر آپ ایک لکھاری ہیں اور اردو کالم نگاری میں تجربہ رکھتے ہیں، تو آج ہی اپنی تفصیلات فراہم کر کے اردو کالمز کی ٹیم میں شامل ہوں۔
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-right">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 p-4 rounded-xl flex items-center gap-3 border border-rose-200 dark:border-rose-900/30 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Qalmi Name (Pen Name) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu">
                قلمی نام (Pen Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="penName"
                  value={formData.penName}
                  onChange={handleTextChange}
                  placeholder="مثال: اختر حسین نظامی"
                  className="w-full text-right bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-3 pr-10 pl-4 text-xs focus:outline-none focus:border-brand-gold text-stone-900 dark:text-white"
                  required
                />
                <User className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
              </div>
            </div>

            {/* Qualification */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu">
                تعلیم (Qualification) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleTextChange}
                  placeholder="مثال: ایم اے صحافت / ایم فل اردو"
                  className="w-full text-right bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-3 pr-10 pl-4 text-xs focus:outline-none focus:border-brand-gold text-stone-900 dark:text-white"
                  required
                />
                <GraduationCap className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
              </div>
            </div>

            {/* CNIC Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu">
                شناختی کارڈ نمبر (CNIC Number) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleTextChange}
                  placeholder="مثال: 37405-1234567-1"
                  className="w-full text-right bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-3 pr-10 pl-4 text-xs focus:outline-none focus:border-brand-gold text-stone-900 dark:text-white"
                  required
                />
                <CreditCard className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
              </div>
              <p className="text-[10px] text-stone-400 mr-2">صرف تصدیق کے لیے استعمال کیا جائے گا۔</p>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu">
                واٹس ایپ نمبر (WhatsApp Number) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="whatsApp"
                  value={formData.whatsApp}
                  onChange={handleTextChange}
                  placeholder="مثال: 0300-1234567"
                  className="w-full text-right bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-3 pr-10 pl-4 text-xs focus:outline-none focus:border-brand-gold text-stone-900 dark:text-white"
                  required
                />
                <Phone className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
              </div>
              <p className="text-[10px] text-stone-400 mr-2">مستقبل کے رابطوں کے لیے ضروری ہے۔</p>
            </div>
          </div>

          {/* Picture Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu">
              اپنی ایک تصویر (Profile Picture)
            </label>
            <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl p-6 text-center hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto text-stone-400">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
                  {imagePreview ? "تصویر کامیابی سے اپلوڈ ہو گئی" : "اپنی تصویر منتخب کرنے کے لیے یہاں کلک کریں یا ڈریگ کریں"}
                </div>
                <div className="text-[10px] text-stone-400">MAX 2MB (JPG, PNG)</div>
              </div>
            </div>
          </div>

          {/* Experience / Work */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 font-urdu">
              تجربہ یا سابقہ کام (Experience / Previous Work) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleTextChange}
                placeholder="اپنے صحافتی یا ادبی کام کی تفصیل یا اپنے کالموں کے لنکس یہاں درج کریں..."
                rows={5}
                className="w-full text-right bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-3 pr-10 pl-4 text-xs focus:outline-none focus:border-brand-gold text-stone-900 dark:text-white leading-relaxed"
                required
              />
              <Briefcase className="absolute right-3.5 top-3.5 w-4 h-4 text-stone-400" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full bg-brand-green-dark hover:bg-brand-green-light text-white font-bold text-sm py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                submitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "درخواست جمع کی جا رہی ہے..." : "درخواست جمع کریں"}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <ImageCropper
            imageSrc={imageToCrop}
            onCrop={(croppedDataUrl) => {
              setImagePreview(croppedDataUrl);
              setFormData((prev) => ({ ...prev, image: croppedDataUrl }));
              setImageToCrop(null);
            }}
            onCancel={() => {
              setImageToCrop(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
