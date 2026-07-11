/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Writer {
  id: string;
  name: string;
  slug: string;
  image: string;
  bio: string;
  expertise: string; // e.g. "سیاست، معاشیات"
  socialLinks: {
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  views: number;
  isFeatured: boolean;
  joinedAt: string;
  isVerified?: boolean;
  isGuest?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  views: number;
}

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  parentId?: string; // For nested replies
  replies?: Comment[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  categoryId: string;
  writerId: string;
  tags: string[];
  views: number;
  status: "draft" | "review" | "published" | "scheduled";
  publishedAt: string;
  image?: string;
  caption?: string;
  credit?: string;
  readingTime: number;
  isFeatured: boolean;
  isEditorsPick: boolean;
  isTrending: boolean;
  summary?: string; // AI Summary
  audioUrl?: string; // TTS Audio link if any
  relatedArticleIds?: string[]; // IDs of related or sequential articles
}

export interface Ad {
  id: string;
  title: string;
  size: "leaderboard" | "square" | "skyscraper" | "mobile-sticky";
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  views: number;
  clicks: number;
  deviceTarget: "all" | "desktop" | "mobile";
  impressionsLimit?: number;
  activeFrom?: string;
  activeTo?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export interface Settings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  allowComments: boolean;
  moderateComments: boolean;
  adsEnabled: boolean;
  dataSaverDefault: boolean;
  featuredVideoUrl?: string;
  featuredVideoTitle?: string;
}

export interface NewsletterSubscriber {
  email: string;
  name?: string;
  joinedAt: string;
}

export interface WriterApplication {
  id: string;
  penName: string;
  qualification: string;
  experience: string;
  cnic: string;
  whatsApp: string;
  image: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
}

export interface DatabaseState {
  writers: Writer[];
  categories: Category[];
  articles: Article[];
  comments: Comment[];
  ads: Ad[];
  pages: Page[];
  settings: Settings;
  newsletterSubscribers: NewsletterSubscriber[];
  writerApplications: WriterApplication[];
}
