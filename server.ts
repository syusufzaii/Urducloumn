import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import db from "./src/data/db";
import { Article, Comment, Ad, Writer } from "./src/types";

// Initialize Gemini API client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini client successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY environment variable found. Server running with AI fallbacks.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with sufficient limit for base64 media uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Request logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- API ROUTES ---

  // 1. Health check
  app.get("/api/v1/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 2. Settings Endpoints
  app.get("/api/v1/settings", (req, res) => {
    res.json(db.getSettings());
  });

  app.put("/api/v1/settings", (req, res) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  });

  // 3. Category Endpoints
  app.get("/api/v1/categories", (req, res) => {
    res.json(db.getCategories());
  });

  app.post("/api/v1/categories", (req, res) => {
    const { name, slug, description } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "Name and Slug are required" });
    const cat = db.addCategory({
      id: "c" + Date.now(),
      name,
      slug,
      description: description || "",
      views: 0
    });
    res.status(201).json(cat);
  });

  app.put("/api/v1/categories/:id", (req, res) => {
    const updated = db.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.json(updated);
  });

  app.delete("/api/v1/categories/:id", (req, res) => {
    db.deleteCategory(req.params.id);
    res.json({ success: true });
  });

  // 4. Writer Endpoints
  app.get("/api/v1/writers", (req, res) => {
    res.json(db.getWriters());
  });

  app.get("/api/v1/writers/:slug", (req, res) => {
    const writer = db.getWriterBySlug(req.params.slug);
    if (!writer) return res.status(404).json({ error: "Writer not found" });
    db.incrementWriterViews(writer.id);
    res.json(writer);
  });

  app.post("/api/v1/writers", (req, res) => {
    const { name, slug, bio, expertise, image, socialLinks, isVerified, isGuest } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "Name and Slug are required" });
    const writer = db.addWriter({
      id: "w" + Date.now(),
      name,
      slug,
      image: image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
      bio: bio || "",
      expertise: expertise || "",
      socialLinks: socialLinks || {},
      views: 0,
      isFeatured: false,
      joinedAt: new Date().toISOString(),
      isVerified: !!isVerified,
      isGuest: !!isGuest
    });
    res.status(201).json(writer);
  });

  app.put("/api/v1/writers/:id", (req, res) => {
    const updated = db.updateWriter(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Writer not found" });
    res.json(updated);
  });

  app.delete("/api/v1/writers/:id", (req, res) => {
    db.deleteWriter(req.params.id);
    res.json({ success: true });
  });

  // 5. Article Endpoints
  app.get("/api/v1/articles", (req, res) => {
    const { category, writer, tag, status, search, featured, editorsPick, trending } = req.query;
    let list = db.getArticles();

    // Filter by status (by default return only published for non-admins)
    if (status) {
      list = list.filter(a => a.status === status);
    } else {
      list = list.filter(a => a.status === "published");
    }

    if (category) {
      const cat = db.getCategoryBySlug(category as string);
      if (cat) list = list.filter(a => a.categoryId === cat.id);
    }

    if (writer) {
      const wr = db.getWriterBySlug(writer as string);
      if (wr) list = list.filter(a => a.writerId === wr.id);
    }

    if (tag) {
      list = list.filter(a => a.tags.includes(tag as string));
    }

    if (featured === "true") {
      list = list.filter(a => a.isFeatured);
    }

    if (editorsPick === "true") {
      list = list.filter(a => a.isEditorsPick);
    }

    if (trending === "true") {
      list = list.filter(a => a.isTrending);
    }

    if (search) {
      const query = (search as string).toLowerCase().trim();
      list = list.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.body.toLowerCase().includes(query) ||
        a.excerpt.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort by publish date descending
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    res.json(list);
  });

  app.get("/api/v1/articles/:id", (req, res) => {
    const art = db.getArticleById(req.params.id);
    if (!art) return res.status(404).json({ error: "Article not found" });
    db.incrementArticleViews(art.id);
    res.json(art);
  });

  app.get("/api/v1/articles/slug/:slug", (req, res) => {
    const art = db.getArticleBySlug(req.params.slug);
    if (!art) return res.status(404).json({ error: "Article not found" });
    db.incrementArticleViews(art.id);
    res.json(art);
  });

  app.post("/api/v1/articles", (req, res) => {
    const { title, slug, body, excerpt, categoryId, writerId, tags, image, caption, credit, isFeatured, isEditorsPick, isTrending, relatedArticleIds } = req.body;
    if (!title || !slug || !body || !categoryId || !writerId) {
      return res.status(400).json({ error: "Title, slug, body, categoryId, and writerId are required" });
    }

    // Calculate reading time roughly: 200 words per minute
    const wordCount = body.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const art = db.addArticle({
      id: "art" + Date.now(),
      title,
      slug,
      body,
      excerpt: excerpt || body.substring(0, 150) + "...",
      categoryId,
      writerId,
      tags: tags || [],
      views: 0,
      status: req.body.status || "published",
      publishedAt: req.body.publishedAt || new Date().toISOString(),
      image,
      caption,
      credit,
      readingTime,
      isFeatured: !!isFeatured,
      isEditorsPick: !!isEditorsPick,
      isTrending: !!isTrending,
      relatedArticleIds: relatedArticleIds || []
    });

    res.status(201).json(art);
  });

  app.put("/api/v1/articles/:id", (req, res) => {
    const updated = db.updateArticle(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Article not found" });
    res.json(updated);
  });

  app.delete("/api/v1/articles/:id", (req, res) => {
    db.deleteArticle(req.params.id);
    res.json({ success: true });
  });

  // 6. Comment Endpoints
  app.get("/api/v1/articles/:id/comments", (req, res) => {
    res.json(db.getCommentsForArticle(req.params.id));
  });

  // Admin Comments endpoint (includes all pending/rejected for moderation)
  app.get("/api/v1/admin/comments", (req, res) => {
    res.json(db.getComments());
  });

  app.post("/api/v1/articles/:id/comments", (req, res) => {
    const { authorName, authorEmail, content, parentId } = req.body;
    if (!authorName || !authorEmail || !content) {
      return res.status(400).json({ error: "Name, email, and content are required" });
    }

    const settings = db.getSettings();
    // Auto-approve if comment moderation is disabled
    const status = settings.moderateComments ? "pending" : "approved";

    const comment = db.addComment({
      id: "co" + Date.now(),
      articleId: req.params.id,
      authorName,
      authorEmail,
      content,
      status,
      createdAt: new Date().toISOString(),
      parentId
    });

    res.status(201).json(comment);
  });

  app.put("/api/v1/admin/comments/:id", (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const comment = db.updateCommentStatus(req.params.id, status);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.json(comment);
  });

  // 7. Ad Endpoints
  app.get("/api/v1/ads", (req, res) => {
    res.json(db.getAds());
  });

  app.post("/api/v1/ads", (req, res) => {
    const { title, size, imageUrl, linkUrl, deviceTarget } = req.body;
    if (!title || !size || !imageUrl || !linkUrl) {
      return res.status(400).json({ error: "Title, size, imageUrl, and linkUrl are required" });
    }
    const ad = db.addAd({
      id: "ad" + Date.now(),
      title,
      size,
      imageUrl,
      linkUrl,
      active: true,
      views: 0,
      clicks: 0,
      deviceTarget: deviceTarget || "all"
    });
    res.status(201).json(ad);
  });

  app.put("/api/v1/ads/:id", (req, res) => {
    const updated = db.updateAd(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Ad not found" });
    res.json(updated);
  });

  app.post("/api/v1/ads/:id/impression", (req, res) => {
    db.incrementAdViews(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/v1/ads/:id/click", (req, res) => {
    db.incrementAdClicks(req.params.id);
    res.json({ success: true });
  });

  // 8. Newsletter Signup
  app.post("/api/v1/newsletter/subscribe", (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    db.addNewsletterSubscriber(email, name);
    res.json({ success: true, message: "Newsletter subscribed successfully!" });
  });

  app.get("/api/v1/admin/newsletter-subscribers", (req, res) => {
    res.json(db.getNewsletterSubscribers());
  });

  // 9. Static pages endpoints
  app.get("/api/v1/pages/:slug", (req, res) => {
    const pg = db.getPageBySlug(req.params.slug);
    if (!pg) return res.status(404).json({ error: "Page not found" });
    res.json(pg);
  });

  app.put("/api/v1/pages/:slug", (req, res) => {
    const pg = db.getPageBySlug(req.params.slug);
    if (!pg) return res.status(404).json({ error: "Page not found" });
    const updated = db.updatePage(pg.id, req.body);
    res.json(updated);
  });

  // 10. Writer Applications Endpoints
  app.get("/api/v1/applications", (req, res) => {
    res.json(db.getApplications());
  });

  app.post("/api/v1/applications", (req, res) => {
    const { penName, qualification, experience, cnic, whatsApp, image } = req.body;
    if (!penName || !qualification || !experience || !cnic || !whatsApp) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }
    const appItem = db.addApplication({
      id: "app" + Date.now(),
      penName,
      qualification,
      experience,
      cnic,
      whatsApp,
      image: image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
      status: "pending",
      appliedAt: new Date().toISOString()
    });
    res.status(201).json(appItem);
  });

  app.put("/api/v1/applications/:id", (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const updated = db.updateApplicationStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Application not found" });

    if (status === "approved") {
      // Auto-create columnist profile!
      const isExist = db.getWriters().some(w => w.name.trim() === updated.penName.trim());
      if (!isExist) {
        db.addWriter({
          id: "w" + Date.now(),
          name: updated.penName,
          slug: updated.penName
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-")
            .substring(0, 50),
          image: updated.image,
          bio: `تعلیم: ${updated.qualification}۔ تجربہ: ${updated.experience}`,
          expertise: "کالم نگار",
          socialLinks: {},
          views: 0,
          isFeatured: false,
          joinedAt: new Date().toISOString(),
          isVerified: true, // Auto-verified on approval!
          isGuest: false
        });
      }
    }

    res.json(updated);
  });

  // --- GEMINI AI SERVICES ---

  // A. AI Column Summarization
  app.post("/api/v1/gemini/summarize", async (req, res) => {
    const { bodyText } = req.body;
    if (!bodyText) return res.status(400).json({ error: "bodyText is required" });

    if (!ai) {
      // Fallback response when API key is missing
      return res.json({
        summary: "یہ تحریر ملکی معاشی صورتحال میں بہتری اور سنجیدہ پالیسی اصلاحات کی ضرورت پر زور دیتی ہے۔ مصنف کے مطابق مقامی صنعت کی بحالی اور بیرونی امداد پر انحصار ختم کرنا ہی ملک کو بحران سے نکالنے کا واحد راستہ ہے۔"
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `براہ کرم درج ذیل اردو کالم کا ایک جامع اور فکری خلاصہ (3 سے 4 لائنوں میں) اردو زبان میں تیار کریں:\n\n${bodyText}`,
        config: {
          systemInstruction: "آپ ایک انتہائی ماہر اور فصیح اردو کالم خلاصہ نگار ہیں۔ آپ کالموں کا اصل لب لباب سادہ اور پرکشش اردو میں پیش کرتے ہیں۔",
        },
      });

      res.json({ summary: response.text });
    } catch (err: any) {
      console.error("Gemini summarize error:", err);
      res.status(500).json({ error: "AI summarizes failed. Using backup summaries.", fallback: true });
    }
  });

  // B. AI Editorial Suggestions
  app.post("/api/v1/gemini/editorial", async (req, res) => {
    const { title, body } = req.body;
    if (!body) return res.status(400).json({ error: "Draft body is required" });

    if (!ai) {
      return res.json({
        suggestions: [
          "سرخی کو مزید پرکشش بنانے کے لیے 'پاکستان اور نئے امکانات' کا اضافہ کریں۔",
          "دوسرے پیراگراف میں دیئے گئے اعداد و شمار کی توثیق کریں۔",
          "کالم کے اختتام پر قارئین کے لیے ایک مثبت فکری پیغام شامل کریں۔"
        ],
        suggestedTags: ["پاکستان", "اصلاحات", "ترقی", "سیاست"]
      });
    }

    try {
      const prompt = `براہ کرم درج ذیل کالم کے ڈرافٹ کا جائزہ لیں اور اس کی بہتری کے لیے 3 فکری اور ادارتی تجاویز پیش کریں، اور 4 مناسب اردو ٹیگز (Tags) تجویز کریں۔\n\nسرخی: ${title || "بغیر سرخی"}\n\nمتن:\n${body}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "آپ ایک سنئیر اردو اخبار کے چیف ایڈیٹر ہیں۔ آپ ڈرافٹ تحریروں کا جائزہ لے کر ہمیشہ مددگار، حوصلہ افزا اور فکری تجاویز اور موضوعاتی ٹیگز پیش کرتے ہیں۔ فارمیٹ ہمیشہ صاف اور پڑھنے کے لائق ہونا چاہیے۔",
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "بہتری کی تجاویز"
              },
              suggestedTags: {
                type: "array",
                items: { type: "string" },
                description: "تجویز کردہ ٹیگز"
              }
            },
            required: ["suggestions", "suggestedTags"]
          }
        },
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (err: any) {
      console.error("Gemini editorial error:", err);
      res.status(500).json({ error: "AI editorial suggestions failed." });
    }
  });

  // B2. AI-Powered Article Fetcher/Generator
  app.post("/api/v1/gemini/fetch-article", async (req, res) => {
    const { url, topic } = req.body;
    if (!url && !topic) {
      return res.status(400).json({ error: "URL or Topic is required." });
    }

    if (!ai) {
      // High-quality fallback dummy Urdu columns
      const mockTitles = [
        "بحران اور امکانات: ایک نیا فکری سفر",
        "معاشی خود انحصاری کے حصول کے چیلنجز",
        "سماجی رویے اور ہماری قومی ذمہ داری",
        "جدید ٹیکنالوجی اور اردو صحافت کا مستقبل"
      ];
      const mockBodies = [
        "آج ہم جس دور سے گزر رہے ہیں، اس میں فکری پختگی کی اشد ضرورت ہے۔ معاشی اور سیاسی بحران ہمارے معاشرے کی جڑوں کو کمزور کر رہے ہیں۔ جب تک ہم تعلیم، تحقیق اور میرٹ کی بالادستی پر توجہ نہیں دیں گے، ہمارا زوال جاری رہے گا۔\n\nدوسرا بڑا مسئلہ ہمارے سماجی رویوں کا ہے۔ ہم تنقید تو کرتے ہیں لیکن خود اصلاح کی کوشش نہیں کرتے۔ ہر شہری کو چاہیے کہ وہ اپنی سطح پر دیانت داری اور محنت کو اپنا شعار بنائے۔ یہی وہ راستہ ہے جس سے ہم بحرانوں سے نکل سکتے ہیں۔",
        "ملک کی معاشی خوشحالی کا دارومدار صرف غیر ملکی قرضوں یا امداد پر نہیں ہو سکتا۔ ہمیں اپنے پیروں پر کھڑا ہونا سیکھنا ہوگا۔ زراعت کو جدید خطوط پر استوار کرنا اور صنعتی شعبے کو تحفظ دینا انتہائی ناگزیر ہو چکا ہے۔\n\nنوجوانوں کو ہنر مند بنانا اور انہیں مائیکرو فنانسنگ فراہم کرنا ملکی معیشت کو پائیدار بنیادوں پر کھڑا کرنے کا بہترین نسخہ ہے۔ اگر آج ہم نے درست فیصلے نہ کیے تو آنے والی نسلیں ہمیں کبھی معاف نہیں کریں گی۔"
      ];

      const rIndex = Math.floor(Math.random() * mockTitles.length);
      const bIndex = Math.floor(Math.random() * mockBodies.length);

      return res.json({
        title: mockTitles[rIndex],
        body: mockBodies[bIndex],
        excerpt: "ملکی معاشی، سیاسی اور سماجی صورتحال کا ایک فکر انگیز اور جامع احاطہ۔",
        suggestedCategoryId: "c1",
        suggestedWriterId: "w1",
        tags: ["پاکستان", "اصلاحات", "معاشرہ"]
      });
    }

    try {
      let fetchedContent = "";
      if (url) {
        try {
          const fetchRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
          if (fetchRes.ok) {
            const html = await fetchRes.text();
            // Simple html-to-text conversion to avoid bloat
            fetchedContent = html
              .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 8000);
          }
        } catch (e) {
          console.warn("Direct URL fetching failed or blocked, falling back to direct AI generation:", e);
        }
      }

      const userPrompt = fetchedContent
        ? `Extract, translate, or synthesize a professional, full-length Urdu newspaper article/column based on the scraped content below. Make sure it is elegant, coherent, split into paragraphs, and written from a mature standpoint:\n\n${fetchedContent}`
        : `Write a highly professional, full-length Urdu article/column on the following topic/concept. It must sound exactly like a high-quality newspaper column from Daily Jang or Express:\n\nTopic/Idea: ${topic || url}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: `You are a chief content editor for a premium Urdu newspaper (UrduColumns.pk). Your task is to generate a comprehensive, highly professional Urdu article or column in response to the user's input.
          You must return a valid JSON object matching the requested schema.
          Ensure the article has mature phrasing, high-quality Urdu vocabulary, and is split into 4-6 readable paragraphs using double newlines (\\n\\n).
          Match the style to the most appropriate writer:
          - w1 (Javed Chaudhry style): moral/societal stories, motivational, simple but deep.
          - w2 (Hassan Nisar style): intellectual, historical references, blunt, highly critical.
          - w3 (Hamid Mir style): political reporting, news analysis, constitutional issues, journalist view.
          - w4 (Yasir Pirzada style): satirical, witty, social criticism mixed with lighthearted humour.
          
          Choose the categoryId correctly:
          - c1 (Columns - کالمز)
          - c2 (Analysis - تجزیے)
          - c3 (Editorials - اداریے)
          - c4 (International - بین الاقوامی)
          - c5 (Economy - معاشیات)`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "A captivating, professional Urdu title/headline." },
              body: { type: "string", description: "The full, complete Urdu article body with multiple paragraphs split by \\n\\n." },
              excerpt: { type: "string", description: "A highly professional 1-2 sentence Urdu summary/excerpt." },
              suggestedCategoryId: { type: "string", enum: ["c1", "c2", "c3", "c4", "c5"], description: "The category ID that fits best." },
              suggestedWriterId: { type: "string", enum: ["w1", "w2", "w3", "w4"], description: "The writer ID whose style matches most." },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "3-5 highly relevant Urdu tags."
              }
            },
            required: ["title", "body", "excerpt", "suggestedCategoryId", "suggestedWriterId", "tags"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (err: any) {
      console.error("Gemini fetch-article error:", err);
      res.status(500).json({ error: "Failed to fetch or generate article. Please try again." });
    }
  });

  // C. High-Fidelity Urdu TTS via Gemini 3.1 TTS Model
  app.post("/api/v1/gemini/tts", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    if (!ai) {
      return res.status(400).json({ error: "Gemini API key is required to perform high-fidelity AI Speech Synthesis." });
    }

    try {
      const textToSpeak = text.substring(0, 400); // Truncate text slightly to optimize speed and cost

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say clearly in standard, natural Urdu accent: ${textToSpeak}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" }, // Standard prebuilt voices (e.g., 'Kore', 'Puck', 'Zephyr')
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;
      const mimeType = inlineData?.mimeType || "audio/wav";
      if (base64Audio) {
        res.json({ audioData: base64Audio, mimeType });
      } else {
        throw new Error("No audio payload returned from Gemini TTS");
      }
    } catch (err: any) {
      // Check if it's a quota / limit exhausted error
      const isQuotaExceeded = 
        err.status === "RESOURCE_EXHAUSTED" || 
        err.statusCode === 429 || 
        (err.message && (err.message.toLowerCase().includes("quota") || err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED")));

      if (isQuotaExceeded) {
        console.warn("Gemini TTS warning: Quota exceeded or rate limited (429). Gracefully fallback to browser native Speech Synthesis.");
        res.status(429).json({ 
          error: "AI High-Fidelity Voice quota exceeded. Falling back to browser Speech Synthesis." 
        });
      } else {
        console.warn("Gemini TTS warning: Generation failed, falling back to browser Speech Synthesis.", err.message || err);
        res.status(500).json({ 
          error: "AI TTS Generation failed. Fallback to client-side SpeechSynthesis." 
        });
      }
    }
  });

  // --- Dynamic SEO Sitemaps and RSS Feeds ---

  // Dynamic Sitemap Index
  app.get("/sitemap.xml", (req, res) => {
    const domain = req.get("host") ? `https://${req.get("host")}` : "https://urducolumns.pk";
    const articles = db.getArticles().filter(a => a.status === "published");
    const categories = db.getCategories();
    const writers = db.getWriters();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${domain}/</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Static Pages -->
  <url>
    <loc>${domain}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${domain}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${domain}/submit</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

    // Categories
    categories.forEach(c => {
      xml += `  <url>
    <loc>${domain}/category/${c.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Writers
    writers.forEach(w => {
      xml += `  <url>
    <loc>${domain}/writer/${w.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Articles
    articles.forEach(a => {
      xml += `  <url>
    <loc>${domain}/article/${a.slug}</loc>
    <lastmod>${new Date(a.publishedAt).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  });

  // Dynamic RSS Feed
  app.get("/rss.xml", (req, res) => {
    const domain = req.get("host") ? `https://${req.get("host")}` : "https://urducolumns.pk";
    const articles = db.getArticles().filter(a => a.status === "published").slice(0, 10);

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>UrduColumns.pk</title>
    <link>${domain}</link>
    <description>پاکستان کے موقر اور ممتاز دانشوروں کے کالم اور فکری تجزیے</description>
    <language>ur</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

    articles.forEach(a => {
      const writer = db.getWriterById(a.writerId);
      rss += `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${domain}/article/${a.slug}</link>
      <description><![CDATA[${a.excerpt}]]></description>
      <author>${writer ? writer.name : "مصنف"}</author>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <guid>${domain}/article/${a.slug}</guid>
    </item>\n`;
    });

    rss += `  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml");
    res.send(rss);
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 and PORT 3000 as mandated
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UrduColumns.pk Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start UrduColumns.pk full-stack server:", err);
});
