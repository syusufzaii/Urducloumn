import fs from "fs";
import path from "path";
import { DatabaseState, Article, Writer, Category, Comment, Ad, Page, Settings } from "../types.js";

// Determine file path for persistence
const DB_FILE = path.join(process.cwd(), "src", "data", "db.json");

// Rich, authentic Urdu seed data
const initialWriters: Writer[] = [
  {
    id: "w1",
    name: "جاوید چوہدری",
    slug: "javed-chaudhry",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
    bio: "جاوید چوہدری پاکستان کے معروف ترین کالم نگار اور اینکر پرسن ہیں۔ وہ اپنے روزنامہ کالم 'زیرو پوائنٹ' کے لیے مشہور ہیں جس میں وہ سماجی، سیاسی اور فکری موضوعات پر لکھتے ہیں۔",
    expertise: "سیاست، سماجی مسائل، فکری تربیت",
    socialLinks: { twitter: "https://twitter.com/javedch", facebook: "https://facebook.com/javedch" },
    views: 12540,
    isFeatured: true,
    joinedAt: "2020-01-15T00:00:00.000Z",
    isVerified: true,
    isGuest: false
  },
  {
    id: "w2",
    name: "حسن نثار",
    slug: "hassan-nisar",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
    bio: "حسن نثار پاکستان کے ایک معروف دانشور، تجزیہ کار اور جرات مند کالم نگار ہیں۔ ان کی تحریریں سماجی پسماندگی اور تاریخی حقائق پر مبنی تنقید کے لیے جانی جاتی ہیں۔",
    expertise: "تاریخ، عمرانیات، ملکی سیاست",
    socialLinks: { twitter: "https://twitter.com/hassannisar", facebook: "https://facebook.com/hassannisar" },
    views: 9480,
    isFeatured: true,
    joinedAt: "2019-06-10T00:00:00.000Z",
    isVerified: true,
    isGuest: false
  },
  {
    id: "w3",
    name: "حامد میر",
    slug: "hamid-mir",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200",
    bio: "حامد میر پاکستان کے نڈر کالم نگار اور صحافی ہیں۔ وہ کئی دہائیوں سے ملکی سیاست، انسانی حقوق اور بلوچستان کے مسائل پر تواتر سے لکھ رہے ہیں۔",
    expertise: "قومی سلامتی، بین الاقوامی امور، انسانی حقوق",
    socialLinks: { twitter: "https://twitter.com/HamidMirPAK" },
    views: 11020,
    isFeatured: true,
    joinedAt: "2021-03-22T00:00:00.000Z",
    isVerified: true,
    isGuest: false
  },
  {
    id: "w4",
    name: "یاسر پیرزادہ",
    slug: "yasir-pirzada",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200",
    bio: "یاسر پیرزادہ اپنے منفرد طنزیہ اور مزاحیہ کالموں کے لیے مشہور ہیں۔ وہ کالم کے ذریعے معاشرتی منافقت اور روزمرہ کے مسائل پر گہرا وار کرتے ہیں۔",
    expertise: "طنز و مزاح، سماجی رویے، ادب",
    socialLinks: { twitter: "https://twitter.com/yasirpirzada" },
    views: 7540,
    isFeatured: false,
    joinedAt: "2022-09-01T00:00:00.000Z",
    isVerified: true,
    isGuest: false
  }
];

const initialCategories: Category[] = [
  { id: "c1", name: "کالمز", slug: "columns", description: "پاکستان کے صفِ اول کے دانشوروں کے تازہ ترین کالم اور آراء۔", views: 45200 },
  { id: "c2", name: "تجزیے", slug: "analysis", description: "سیاسی اور معاشی صورتحال پر تفصیلی تجزیاتی مضامین۔", views: 23100 },
  { id: "c3", name: "اداریے", slug: "editorials", description: "موقر جرائد اور اخبارات کے باضابطہ اداریے اور فکری آراء۔", views: 12400 },
  { id: "c4", name: "بین الاقوامی", slug: "international", description: "عالمی سیاست، خارجہ امور اور خطے کے اہم ترین مسائل۔", views: 18900 },
  { id: "c5", name: "معاشیات", slug: "economy", description: "پاکستان اور عالمی معیشت، بجٹ، افراط زر اور کاروباری تجزیے۔", views: 14200 }
];

const initialArticles: Article[] = [
  {
    id: "a1",
    title: "بحران کا حل اور ہماری ذمہ داری",
    slug: "crisis-solution-and-our-responsibility",
    excerpt: "کیا ہم صرف حکومتوں کو دوش دے کر بری الذمہ ہو سکتے ہیں یا بطور معاشرہ ہمیں اپنے گریبانوں میں بھی جھانکنا پڑے گا؟ ایک فکری جائزہ۔",
    body: `آج پاکستان جس معاشی اور سیاسی بحران کا شکار ہے، اس کی جڑیں صرف گذشتہ چند سالوں میں نہیں بلکہ ہماری دہائیوں کی کوتاہیوں میں پیوست ہیں۔ ہم نے بطور قوم ہمیشہ شارٹ کٹ تلاش کرنے کی کوشش کی ہے، جبکہ ترقی اور خوشحالی کا راستہ ہمیشہ سخت محنت، قانون کی بالادستی اور معاشی ڈسپلن سے ہو کر گزرتا ہے۔\n\nسب سے پہلے ہمیں یہ سمجھنا ہوگا کہ معاشی خود انحصاری کے بغیر سیاسی آزادی ایک خواب بن کر رہ جاتی ہے۔ ہم جب تک بیرونی امداد اور قرضوں کے سہارے چلنے کی عادت نہیں چھوڑیں گے، ہم کبھی خود مختار فیصلے نہیں کر سکیں گے۔ ہماری برآمدات نہ ہونے کے برابر ہیں، جبکہ درآمدات کا حجم آسمان کو چھو رہا ہے۔ اس معاشی عدم توازن نے ہمارے روپے کی قدر کو خاک میں ملا دیا ہے۔\n\nلیکن سوال یہ ہے کہ کیا یہ سب صرف سیاستدانوں یا حکمرانوں کا قصور ہے؟ جواب ہے، ہرگز نہیں۔ بطور شہری ہم نے ٹیکس چوری کو فن بنا رکھا ہے۔ ہم قانون کی پاسداری کو کمزوری اور اس کی خلاف ورزی کو بہادری سمجھتے ہیں۔ تعلیم اور ریسرچ پر ہمارا بجٹ نہ ہونے کے برابر ہے، اور ہم اب بھی ستر سال پرانے زراعتی طریقوں پر اڑے ہوئے ہیں۔\n\nبحران سے نکلنے کا واحد راستہ یہ ہے کہ ہم بنیادی ڈھانچے میں اصلاحات لائیں، زراعت کو جدید ٹیکنالوجی سے لیس کریں اور اپنے نوجوانوں کو فنی تعلیم فراہم کریں۔ ہمیں اپنی امپورٹ پر قابو پانا ہوگا اور مقامی مصنوعات کی حوصلہ افزائی کرنی ہوگی۔ یہ سفر کٹھن ضرور ہے لیکن یہی واحد راستہ ہے جو ہمیں ایک باعزت اور مستحکم قوم بنا سکتا ہے۔`,
    categoryId: "c1",
    writerId: "w1",
    tags: ["معیشت", "پاکستان", "اصلاحات", "ترقی"],
    views: 4520,
    status: "published",
    publishedAt: "2026-07-10T12:00:00.000Z",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800&h=450",
    caption: "پاکستان کے معاشی استحکام کے لیے ٹھوس فیصلوں کی ضرورت ہے۔",
    credit: "رائٹرز فوٹو",
    readingTime: 4,
    isFeatured: true,
    isEditorsPick: true,
    isTrending: true,
    relatedArticleIds: ["a5"]
  },
  {
    id: "a2",
    title: "تاریخ کا سبق اور ہماری فراموشی",
    slug: "history-lesson-and-our-forgetfulness",
    excerpt: "قومیں جب تاریخ کے اسباق کو فراموش کر دیتی ہیں تو جغرافیائی حدود بھی ان کا ساتھ چھوڑ دیتی ہیں۔ حسن نثار کا ایک فکر انگیز کالم۔",
    body: `ہم عجیب لوگ ہیں۔ ہم تاریخ پڑھتے ضرور ہیں لیکن اس سے سبق حاصل کرنے کے بجائے اسے صرف فخر کرنے یا رونے دھونے کے لیے استعمال کرتے ہیں۔ جو قومیں اپنی غلطیوں سے نہیں سیکھتیں، تاریخ انہیں کوڑے دان میں پھینک دیتی ہے۔\n\nرومی سلطنت سے لے کر مغلیہ سلطنت تک، زوال کی وجوہات ہمیشہ ایک ہی رہی ہیں: عیش و عشرت، ناانصافی، میرٹ کی پامالی اور علم و ہنر سے دوری۔ آج ہمارے معاشرے میں میرٹ کا قتلِ عام عام بات ہے۔ ہم سفارش اور رشوت کے بغیر کسی کام کی امید نہیں رکھتے۔ جس ملک میں انصاف بکتا ہو اور قانون صرف کمزور کے لیے ہو، وہ ملک کبھی ترقی کی دوڑ میں شامل نہیں ہو سکتا۔\n\nہمیں یہ ماننا ہوگا کہ ہماری پسماندگی کی وجہ کوئی بیرونی سازش نہیں بلکہ ہمارا اپنا رویہ ہے۔ ہم نے تعلیم کو صرف ڈگریوں کے حصول کا ذریعہ بنا دیا ہے، شعور اور فکری پختگی سے ہمارا کوئی تعلق نہیں رہا۔ جب تک ہم اپنی ترجیحات کو درست نہیں کریں گے، ہمارا زوال جاری رہے گا۔ اب وقت ہے کہ ہم خوابِ غفلت سے جاگیں اور علم و میرٹ کی بالادستی قائم کریں۔`,
    categoryId: "c1",
    writerId: "w2",
    tags: ["تاریخ", "زوال", "تعلیم", "معاشرہ"],
    views: 3820,
    status: "published",
    publishedAt: "2026-07-09T15:30:00.000Z",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800&h=450",
    caption: "کتب خانوں سے دوری فکری پسماندگی کا سبب بنتی ہے۔",
    credit: "گیٹی امیجز",
    readingTime: 3,
    isFeatured: false,
    isEditorsPick: true,
    isTrending: false
  },
  {
    id: "a3",
    title: "خارجہ پالیسی کے نئے تقاضے اور چیلنجز",
    slug: "foreign-policy-new-demands-and-challenges",
    excerpt: "بدلتی ہوئی دنیا اور بلاک پولیٹکس میں پاکستان کو ایک متوازن خارجہ پالیسی کی ضرورت ہے جو قومی مفاد کے عین مطابق ہو۔",
    body: `موجودہ دور میں بین الاقوامی تعلقات کی حرکیات بڑی تیزی سے تبدیل ہو رہی ہیں۔ اب جنگیں صرف میدانِ کارزار میں نہیں بلکہ معیشت، ٹیکنالوجی اور میڈیا کے محاذوں پر لڑی جا رہی ہیں۔ ایسے میں پاکستان کے لیے اپنی خارجہ پالیسی کو نئے خطوط پر استوار کرنا ناگزیر ہو چکا ہے۔\n\nہمیں یہ سمجھنا ہوگا کہ اب وہ دور لد گیا جب ہم کسی ایک سپر پاور کے بلاک میں شامل ہو کر فوائد حاصل کر سکتے تھے۔ اب ہمیں چین کے ساتھ اپنے سٹریٹیجک تعلقات کو مزید مضبوط بنانے کے ساتھ ساتھ امریکہ اور یورپی یونین کے ساتھ بھی تجارت پر مبنی پائیدار تعلقات برقرار رکھنے ہوں گے۔\n\nدوسری جانب خطے میں ہمارے ہمسایہ ممالک کے ساتھ تعلقات بھی انتہائی اہمیت کے حامل ہیں۔ افغانستان کی غیر مستحکم صورتحال اور بھارت کے ساتھ دیرینہ تنازعہ کشمیر ہمارے لیے بڑے چیلنجز ہیں۔ ہمیں اپنی خارجہ پالیسی کو امداد کے محور سے نکال کر تجارت اور علاقائی روابط (Regional Connectivity) پر مرکوز کرنا ہوگا۔ سی پیک اس سلسلے میں ایک اہم سنگِ میل ثابت ہو سکتا ہے بشرطیکہ ہم اس کے منصوبوں کو بروقت اور شفاف طریقے سے مکمل کریں۔`,
    categoryId: "c4",
    writerId: "w3",
    tags: ["خارجہ پالیسی", "چین", "امریکہ", "سی-پیک"],
    views: 2950,
    status: "published",
    publishedAt: "2026-07-08T09:00:00.000Z",
    image: "https://images.unsplash.com/photo-1521791136368-1a46827d0505?auto=format&fit=crop&q=80&w=800&h=450",
    caption: "عالمی برادری میں متوازن خارجہ تعلقات پاکستان کے مفاد میں ہیں۔",
    credit: "اے ایف پی",
    readingTime: 5,
    isFeatured: false,
    isEditorsPick: false,
    isTrending: true
  },
  {
    id: "a4",
    title: "سوشل میڈیا اور ہماری ذہنی صحت",
    slug: "social-media-and-our-mental-health",
    excerpt: "سوشل میڈیا جہاں رابطوں کا تیز ترین ذریعہ ہے، وہیں یہ خاموشی سے ہماری توجہ اور ذہنی سکون کو بھی نگل رہا ہے۔ ایک طنزیہ جائزہ۔",
    body: `آج کل کے دور میں اگر آپ کے پاس سمارٹ فون ہے اور آپ دن میں دس بار فیس بک یا ٹویٹر چیک نہیں کرتے، تو آپ کو دُنیا عجیب نظروں سے دیکھتی ہے۔ ہم نے زندگی کو سکرینوں کے پیچھے مقید کر لیا ہے اور لائکس اور شیئرز کی گنتی پر اپنے خوش اور ناخوش ہونے کا معیار طے کر لیا ہے۔\n\nسوشل میڈیا کا سب سے بڑا نقصان یہ ہے کہ اس نے ہم سے ہمارے حقیقی رشتے چھین لیے ہیں۔ ایک ہی کمرے میں بیٹھے چار لوگ ایک دوسرے سے بات کرنے کے بجائے اپنی اپنی سکرینوں پر مگن ہوتے ہیں۔ ہم دُنیا بھر کی فکر کرتے ہیں لیکن اپنے ساتھ بیٹھے بھائی یا دوست کا حال پوچھنا بھول جاتے ہیں۔\n\nاس فیس بک کی جنت میں ہر کوئی خوش نظر آتا ہے۔ ہر شخص بہترین کھانا کھا رہا ہے، خوبصورت ترین مقامات پر گھوم رہا ہے اور زندگی کا لطف اٹھا رہا ہے۔ اس کا نتیجہ یہ نکلتا ہے کہ دیکھنے والا احساسِ کمتری کا شکار ہو جاتا ہے۔ ہمیں یہ سمجھنے کی ضرورت ہے کہ سوشل میڈیا پر نظر آنے والی زندگی اکثر ایک فریب ہوتی ہے۔ زندگی کی اصل خوبصورتی حقیقی رابطوں، کتابوں کے مطالعے اور قدرت کے قریب وقت گزارنے میں ہے۔`,
    categoryId: "c2",
    writerId: "w4",
    tags: ["سوشل میڈیا", "ذہنی صحت", "معاشرہ", "ٹیکنالوجی"],
    views: 1980,
    status: "published",
    publishedAt: "2026-07-07T14:20:00.000Z",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800&h=450",
    caption: "سکرینوں کی دنیا نے ہمیں حقیقی رشتوں سے دور کر دیا ہے۔",
    readingTime: 3,
    isFeatured: false,
    isEditorsPick: false,
    isTrending: false
  },
  {
    id: "a5",
    title: "معاشی خود انحصاری اور جدید زراعت (دوسرا حصہ)",
    slug: "economic-self-reliance-and-modern-agriculture-part-2",
    excerpt: "ہمارے گذشتہ کالم 'بحران کا حل اور ہماری ذمہ داری' کے تسلسل میں معاشی خود انحصاری کے حصول کے عملی اقدامات کا تفصیلی جائزہ۔",
    body: `ہمارے گذشتہ کالم "بحران کا حل اور ہماری ذمہ داری" میں ہم نے ان فکری اور ساختی مسائل پر روشنی ڈالی تھی جنہوں نے ملکی معیشت کو مفلوج کر رکھا ہے۔ آج ہم اس سلسلے کے دوسرے کالم میں معاشی خود انحصاری کے حصول کے لیے زراعت کے شعبے میں عملی اقدامات کا جائزہ لیں گے۔\n\nپاکستان بنیادی طور پر ایک زراعتی ملک ہے، لیکن ستم ظریفی یہ ہے کہ ہمیں اب بھی اربوں ڈالر کا خوردنی تیل، گندم اور کپاس درآمد کرنی پڑتی ہے۔ اس کی بڑی وجہ روایتی زراعتی طریقے اور پانی کا ضیاع ہے۔ جب تک ہم زراعت کو جدید ٹیکنالوجی سے لیس نہیں کریں گے، ہماری فی ایکڑ پیداوار میں اضافہ ممکن نہیں۔\n\nاس کا حل کیا ہے؟ ہمیں سب سے پہلے ڈرپ اریگیشن (Drip Irrigation) جیسے طریقوں کو اپنانا ہوگا تاکہ قیمتی پانی بچایا جا سکے۔ دوسرے نمبر پر، کارپوریٹ فارمنگ کو فروغ دیا جائے جہاں جدید مشینری اور معیاری بیج کا استعمال ممکن ہو سکے۔ اس کے علاوہ کسانوں کو بلا سود یا انتہائی کم شرح سود پر قرضے فراہم کیے جائیں تاکہ وہ مڈل مین کے چنگل سے آزاد ہو سکیں اور اپنی فصلوں کی بہتر قیمت حاصل کر سکیں۔\n\nاگر ہم صرف اپنے زراعتی شعبے کو درست سمت میں گامزن کر لیں، تو نہ صرف ہم خوراک میں خود کفیل ہو جائیں گے بلکہ اربوں ڈالر کا قیمتی زرمبادلہ بھی بچا سکیں گے۔ یہ خود انحصاری ہی اصل آزادی کی ضامن ہے۔`,
    categoryId: "c1",
    writerId: "w1",
    tags: ["معیشت", "زراعت", "خود-انحصاری", "اصلاحات"],
    views: 1240,
    status: "published",
    publishedAt: "2026-07-11T09:00:00.000Z",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800&h=450",
    caption: "جدید زراعتی انقلاب ہی پاکستان کی معاشی بقا کا ضامن ہے۔",
    credit: "فائل فوٹو",
    readingTime: 3,
    isFeatured: false,
    isEditorsPick: false,
    isTrending: true,
    relatedArticleIds: ["a1"]
  }
];

const initialComments: Comment[] = [
  {
    id: "co1",
    articleId: "a1",
    authorName: "محمد علی",
    authorEmail: "ali@example.com",
    content: "بہت ہی شاندار اور فکر انگیز تحریر۔ واقعی جب تک ہم خود ٹیکس نہیں دیں گے اور قانون کا احترام نہیں کریں گے، ملکی بحران حل نہیں ہو سکتا۔",
    status: "approved",
    createdAt: "2026-07-10T14:30:00.000Z",
    replies: [
      {
        id: "co1_r1",
        articleId: "a1",
        authorName: "احمد خان",
        authorEmail: "ahmad@example.com",
        content: "علی بھائی، آپ کی بات بالکل درست ہے لیکن حکومت کو بھی ٹیکس کے پیسوں کا درست استعمال دکھانا ہوگا تاکہ عوام میں اعتماد بحال ہو۔",
        status: "approved",
        createdAt: "2026-07-10T15:00:00.000Z"
      }
    ]
  },
  {
    id: "co2",
    articleId: "a1",
    authorName: "فاطمہ رضوی",
    authorEmail: "fatima@example.com",
    content: "جاوید صاحب نے معیشت کے بنیادی مسائل پر بہت گہرا اور حقیقت پسندانہ تبصرہ کیا ہے۔ نوجوانوں کے لیے فنی تعلیم وقت کی اہم ترین ضرورت ہے۔",
    status: "approved",
    createdAt: "2026-07-10T16:15:00.000Z"
  }
];

const initialAds: Ad[] = [
  {
    id: "ad1",
    title: "ہوم پیج ٹاپ بینر - AdSense",
    size: "leaderboard",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=900&h=120",
    linkUrl: "https://urducolumns.pk/advertise",
    active: true,
    views: 1250,
    clicks: 42,
    deviceTarget: "all"
  },
  {
    id: "ad2",
    title: "موبائل اسٹکی باٹم - ڈائریکٹ اشتہار",
    size: "mobile-sticky",
    imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=320&h=50",
    linkUrl: "https://urducolumns.pk/advertise",
    active: true,
    views: 3100,
    clicks: 180,
    deviceTarget: "mobile"
  },
  {
    id: "ad3",
    title: "سائیڈ بار اسکوائر - اشتہار",
    size: "square",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=300&h=250",
    linkUrl: "https://urducolumns.pk/advertise",
    active: true,
    views: 950,
    clicks: 25,
    deviceTarget: "desktop"
  }
];

const initialPages: Page[] = [
  {
    id: "p1",
    title: "ہمارے بارے میں (About Us)",
    slug: "about",
    content: `<h1>ہمارے بارے میں</h1><p>UrduColumns.pk پاکستان کا جدید ترین اور مقبول ترین کالم پورٹل ہے جہاں ہم ملک اور بیرون ملک کے صف اول کے کالم نگاروں اور دانشوروں کی تحریروں اور تجزیوں کو یکجا کرتے ہیں۔ ہمارا مقصد اپنے قارئین کو فکری، غیر جانبدارانہ اور تعمیری صحافت فراہم کرنا ہے۔</p>`
  },
  {
    id: "p2",
    title: "رابطہ کریں (Contact Us)",
    slug: "contact",
    content: `<h1>رابطہ کریں</h1><p>اگر آپ کے پاس کوئی سوال، رائے یا تجویز ہے تو آپ ہم سے براہ راست ای میل کے ذریعے رابطہ کر سکتے ہیں: <a href="mailto:info@urducolumns.pk">info@urducolumns.pk</a></p>`
  },
  {
    id: "p3",
    title: "ہمیں کالم بھیجیں (Submit a Column)",
    slug: "submit",
    content: `<h1>ہمیں کالم بھیجیں</h1><p>کیا آپ ایک لکھاری ہیں؟ اگر آپ اردو میں اچھے کالم لکھتے ہیں تو آپ اپنا کالم اشاعت کے لیے ہمیں <a href="mailto:submit@urducolumns.pk">submit@urducolumns.pk</a> پر بھیج سکتے ہیں۔ ہماری ادارتی ٹیم کالم کا جائزہ لے کر اسے شائع کرے گی۔</p>`
  }
];

const initialSettings: Settings = {
  siteName: "UrduColumns.pk",
  siteDescription: "پاکستان کے موقر اور ممتاز دانشوروں کے کالم اور فکری تجزیے",
  contactEmail: "info@urducolumns.pk",
  allowComments: true,
  moderateComments: true,
  adsEnabled: true,
  dataSaverDefault: false,
  featuredVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  featuredVideoTitle: "اہم سیاسی صورتحال پر خصوصی رپورٹ اور تجزیہ"
};

// Database class to read/write state
class JSONDatabase {
  private state: DatabaseState;

  constructor() {
    this.state = {
      writers: initialWriters,
      categories: initialCategories,
      articles: initialArticles,
      comments: initialComments,
      ads: initialAds,
      pages: initialPages,
      settings: initialSettings,
      newsletterSubscribers: [],
      writerApplications: []
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const loaded = JSON.parse(raw);
        this.state = { ...this.state, ...loaded };
        this.state.writerApplications = this.state.writerApplications || [];
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load JSON database, using initial data:", e);
    }
  }

  private save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save JSON database to disk:", e);
    }
  }

  public getWriters() { return this.state.writers; }
  public getWriterBySlug(slug: string) { return this.state.writers.find(w => w.slug === slug); }
  public getWriterById(id: string) { return this.state.writers.find(w => w.id === id); }
  public addWriter(writer: Writer) { this.state.writers.push(writer); this.save(); return writer; }
  public updateWriter(id: string, updated: Partial<Writer>) {
    const idx = this.state.writers.findIndex(w => w.id === id);
    if (idx !== -1) {
      this.state.writers[idx] = { ...this.state.writers[idx], ...updated } as Writer;
      this.save();
      return this.state.writers[idx];
    }
    return null;
  }
  public deleteWriter(id: string) {
    this.state.writers = this.state.writers.filter(w => w.id !== id);
    this.save();
  }
  public incrementWriterViews(id: string) {
    const writer = this.getWriterById(id);
    if (writer) { writer.views += 1; this.save(); }
  }

  public getCategories() { return this.state.categories; }
  public getCategoryBySlug(slug: string) { return this.state.categories.find(c => c.slug === slug); }
  public getCategoryById(id: string) { return this.state.categories.find(c => c.id === id); }
  public addCategory(cat: Category) { this.state.categories.push(cat); this.save(); return cat; }
  public updateCategory(id: string, updated: Partial<Category>) {
    const idx = this.state.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.state.categories[idx] = { ...this.state.categories[idx], ...updated } as Category;
      this.save();
      return this.state.categories[idx];
    }
    return null;
  }
  public deleteCategory(id: string) {
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    this.save();
  }

  public getArticles() { return this.state.articles; }
  public getArticleBySlug(slug: string) { return this.state.articles.find(a => a.slug === slug); }
  public getArticleById(id: string) { return this.state.articles.find(a => a.id === id); }
  public addArticle(art: Article) { this.state.articles.push(art); this.save(); return art; }
  public updateArticle(id: string, updated: Partial<Article>) {
    const idx = this.state.articles.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.state.articles[idx] = { ...this.state.articles[idx], ...updated } as Article;
      this.save();
      return this.state.articles[idx];
    }
    return null;
  }
  public deleteArticle(id: string) {
    this.state.articles = this.state.articles.filter(a => a.id !== id);
    this.save();
  }
  public incrementArticleViews(id: string) {
    const art = this.getArticleById(id);
    if (art) { art.views += 1; this.save(); }
  }

  public getComments() { return this.state.comments; }
  public getCommentsForArticle(articleId: string) {
    return this.state.comments.filter(c => c.articleId === articleId && c.status === "approved");
  }
  public addComment(comment: Comment) {
    this.state.comments.push(comment);
    this.save();
    return comment;
  }
  public updateCommentStatus(id: string, status: "approved" | "rejected" | "pending") {
    // Check main comments or sub-replies
    for (const c of this.state.comments) {
      if (c.id === id) {
        c.status = status;
        this.save();
        return c;
      }
      if (c.replies) {
        const rIdx = c.replies.findIndex(r => r.id === id);
        if (rIdx !== -1) {
          c.replies[rIdx].status = status;
          this.save();
          return c.replies[rIdx];
        }
      }
    }
    return null;
  }

  public getAds() { return this.state.ads; }
  public addAd(ad: Ad) { this.state.ads.push(ad); this.save(); return ad; }
  public updateAd(id: string, updated: Partial<Ad>) {
    const idx = this.state.ads.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.state.ads[idx] = { ...this.state.ads[idx], ...updated } as Ad;
      this.save();
      return this.state.ads[idx];
    }
    return null;
  }
  public incrementAdViews(id: string) {
    const ad = this.state.ads.find(a => a.id === id);
    if (ad) { ad.views += 1; this.save(); }
  }
  public incrementAdClicks(id: string) {
    const ad = this.state.ads.find(a => a.id === id);
    if (ad) { ad.clicks += 1; this.save(); }
  }

  public getPages() { return this.state.pages; }
  public getPageBySlug(slug: string) { return this.state.pages.find(p => p.slug === slug); }
  public updatePage(id: string, updated: Partial<Page>) {
    const idx = this.state.pages.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.state.pages[idx] = { ...this.state.pages[idx], ...updated } as Page;
      this.save();
      return this.state.pages[idx];
    }
    return null;
  }

  public getSettings() { return this.state.settings; }
  public updateSettings(updated: Partial<Settings>) {
    this.state.settings = { ...this.state.settings, ...updated };
    this.save();
    return this.state.settings;
  }

  public getNewsletterSubscribers() { return this.state.newsletterSubscribers; }
  public addNewsletterSubscriber(email: string, name?: string) {
    if (!this.state.newsletterSubscribers.some(s => s.email === email)) {
      this.state.newsletterSubscribers.push({ email, name, joinedAt: new Date().toISOString() });
      this.save();
    }
  }

  // Writer Application Helper Methods
  public getApplications() {
    return this.state.writerApplications || [];
  }
  public addApplication(app: any) {
    this.state.writerApplications = this.state.writerApplications || [];
    this.state.writerApplications.push(app);
    this.save();
    return app;
  }
  public updateApplicationStatus(id: string, status: "pending" | "approved" | "rejected") {
    this.state.writerApplications = this.state.writerApplications || [];
    const app = this.state.writerApplications.find(a => a.id === id);
    if (app) {
      app.status = status;
      this.save();
      return app;
    }
    return null;
  }
}

export const db = new JSONDatabase();
export default db;
