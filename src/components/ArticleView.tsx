import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2, VolumeX, Bookmark, Share2, Printer, Type,
  ArrowRight, ShieldAlert, Check, Copy, MessageSquare, Star, Info, Play, Pause, RefreshCw, Send, Sparkles,
  List, ArrowUp, Square, SkipBack, SkipForward, Loader2, Facebook, Twitter, BadgeCheck
} from "lucide-react";
import { Article, Writer, Category, Comment } from "../types";
import AdSlot from "./AdSlot";

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.004 2c-5.518 0-9.998 4.48-9.998 9.997 0 2.006.592 3.874 1.614 5.44L2.006 22l4.71-1.543c1.517.915 3.284 1.44 5.174 1.44 5.518 0 10-4.48 10-9.998 0-5.517-4.482-9.998-10-9.998zm4.493 13.982c-.22.616-1.272 1.148-1.751 1.21-.48.06-1.077.087-1.727-.123-.65-.21-1.353-.448-2.317-.864-3.856-1.662-6.347-5.572-6.54-5.83-.191-.256-1.397-1.858-1.397-3.543 0-1.686.861-2.51 1.172-2.822.31-.31.62-.39.83-.39s.41 0 .6.01c.2 0 .46-.08.72.54.26.63.89 2.18.97 2.34.08.16.13.35.03.56-.1.21-.15.34-.31.52-.16.18-.34.4-.48.54-.15.15-.31.32-.13.63.18.3.79 1.3 1.69 2.1 1.16 1.03 2.13 1.35 2.44 1.48.3.13.48.11.66-.09.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.16.29.11 1.83.86 2.14 1.01.31.16.52.24.6.37.07.13.07.75-.15 1.37z" clipRule="evenodd" />
  </svg>
);

interface ArticleViewProps {
  articleSlug: string;
  onBack: () => void;
  dataSaver: boolean;
  onSelectWriter: (slug: string) => void;
}

export default function ArticleView({ articleSlug, onBack, dataSaver, onSelectWriter }: ArticleViewProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [writer, setWriter] = useState<Writer | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [categoryRelatedArticles, setCategoryRelatedArticles] = useState<Array<Article & { writer?: Writer }>>([]);
  const [loading, setLoading] = useState(true);

  // Styling and Accessibility states
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl" | "2xl">("lg");
  const [readingMode, setReadingMode] = useState<"normal" | "text" | "data-saver">("normal");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loadingTTS, setLoadingTTS] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [audioProgress, setAudioProgress] = useState(0);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [speechInstance, setSpeechInstance] = useState<SpeechSynthesisUtterance | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Web Speech Synthesis (TTS) Player states
  const [showTtsPlayer, setShowTtsPlayer] = useState(false);
  const [speechState, setSpeechState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(-1);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [ttsMode, setTtsMode] = useState<"ai" | "browser">("ai");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isTransitioningRef = React.useRef(false);
  const speechTimeoutRef = React.useRef<number | null>(null);

  // Comments state
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Correction report state
  const [correctionText, setCorrectionText] = useState("");
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false);

  // Reading Progress & Scroll-to-Top State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isShareExpanded, setIsShareExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }

      // Show scroll-to-top button after scrolling down 500px
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    // Initial calculation
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [article, loading]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Parse article body for headings and paragraphs
  const { parsedItems, headingsList } = useMemo(() => {
    if (!article) return { parsedItems: [], headingsList: [] };

    const paragraphs = article.body.split("\n\n");
    const parsed: Array<{
      type: "heading" | "paragraph";
      text: string;
      level?: number;
      id: string;
    }> = [];
    const headings: Array<{ text: string; id: string; level: number }> = [];

    paragraphs.forEach((para, idx) => {
      const trimmed = para.trim();
      if (!trimmed) return;

      // Check for HTML heading tags (e.g. <h2>Heading</h2> or <h3>Subheading</h3>)
      const htmlMatch = trimmed.match(/<h([2-3])(?:\s+[^>]*)*>(.*?)<\/h\1>/i);
      // Check for markdown heading style (e.g. ### Subheading or ## Heading)
      const mdMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

      if (htmlMatch) {
        const level = parseInt(htmlMatch[1], 10);
        const rawText = htmlMatch[2];
        // Strip other HTML elements from inside if any
        const text = rawText.replace(/<\/?[^>]+(>|$)/g, "").trim();
        const id = `sec-${idx}`;
        parsed.push({ type: "heading", text, level, id });
        headings.push({ text, id, level });
      } else if (mdMatch) {
        const level = mdMatch[1].length;
        const text = mdMatch[2];
        const id = `sec-${idx}`;
        parsed.push({ type: "heading", text, level, id });
        headings.push({ text, id, level });
      } else {
        // Fallback auto-detection for headings:
        // A paragraph is considered a heading if it is short (< 70 chars) and does not end with standard Urdu/English ending punctuation
        const isShort = trimmed.length < 70;
        const hasSentenceEnding = /[۔\.؟!]$/.test(trimmed);

        if (isShort && !hasSentenceEnding) {
          const id = `sec-${idx}`;
          parsed.push({ type: "heading", text: trimmed, level: 3, id });
          headings.push({ text: trimmed, id, level: 3 });
        } else {
          parsed.push({ type: "paragraph", text: trimmed, id: `para-${idx}` });
        }
      }
    });

    return { parsedItems: parsed, headingsList: headings };
  }, [article]);

  // Active section scroll spy state
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");

  useEffect(() => {
    if (headingsList.length === 0) return;

    const handleScrollSpy = () => {
      const scrollPosition = window.scrollY + 140; // offset for sticky headers and comfortable reading visibility
      let activeId = "";

      for (let i = 0; i < headingsList.length; i++) {
        const h = headingsList[i];
        const el = document.getElementById(h.id);
        if (el) {
          if (el.offsetTop <= scrollPosition) {
            activeId = h.id;
          }
        }
      }

      // Clear if scrolled back to the very top
      if (window.scrollY < 120) {
        activeId = "";
      }

      setActiveHeadingId(activeId);
    };

    window.addEventListener("scroll", handleScrollSpy);
    handleScrollSpy(); // initial call

    return () => {
      window.removeEventListener("scroll", handleScrollSpy);
    };
  }, [headingsList, loading]);

  // Smooth scroll helper with comfortable offset
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    setCategoryRelatedArticles([]);
    // Fetch article and comments
    fetch(`/api/v1/articles/slug/${articleSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Article not found");
        return res.json();
      })
      .then((art: Article) => {
        setArticle(art);

        // Check if bookmarked in local storage
        const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
        setIsBookmarked(bookmarks.includes(art.id));

        // Fetch related Writer, Category and ALL articles to resolve links
        Promise.all([
          fetch(`/api/v1/writers`).then((r) => r.json()),
          fetch(`/api/v1/categories`).then((r) => r.json()),
          fetch(`/api/v1/articles?status=all`).then((r) => r.json()),
        ]).then(([writers, categories, allArticles]: [Writer[], Category[], Article[]]) => {
          const wr = writers.find((w) => w.id === art.writerId);
          if (wr) setWriter(wr);
          const cat = categories.find((c) => c.id === art.categoryId);
          if (cat) setCategory(cat);

          // Find actual Article objects for each of the relatedArticleIds
          if (art.relatedArticleIds && art.relatedArticleIds.length > 0) {
            const related = allArticles.filter((a) => art.relatedArticleIds?.includes(a.id));
            setRelatedArticles(related);
          } else {
            setRelatedArticles([]);
          }

          // Fetch 3 related columns based on the same category
          const categoryArticles = allArticles.filter(
            (a) => a.categoryId === art.categoryId && a.id !== art.id
          );
          const topCategoryArticles = categoryArticles.slice(0, 3);
          const enrichedCategoryArticles = topCategoryArticles.map((item) => {
            const w = writers.find((wr) => wr.id === item.writerId);
            return { ...item, writer: w };
          });
          setCategoryRelatedArticles(enrichedCategoryArticles);
        });

        // Fetch Approved Comments
        fetch(`/api/v1/articles/${art.id}/comments`)
          .then((r) => r.json())
          .then((cms) => setComments(cms));

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [articleSlug]);

  // Clean up any speaking voice when component unmounts or changes
  useEffect(() => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeechState("stopped");
    setCurrentSegmentIndex(-1);

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (_) {}
        audioRef.current = null;
      }
    };
  }, [articleSlug]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Auto-select standard Urdu voice, or Hindi, or fallback to first available
      const urduVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith("ur-pk") || v.lang.toLowerCase() === "ur"
      ) || voices.find(
        (v) => v.lang.toLowerCase().includes("ur")
      ) || voices.find(
        (v) => v.lang.toLowerCase().startsWith("hi-in") || v.lang.toLowerCase().includes("hindi")
      );
      
      if (urduVoice) {
        setSelectedVoiceName(urduVoice.name);
      } else if (voices.length > 0) {
        const defaultVoice = voices.find((v) => v.default) || voices[0];
        setSelectedVoiceName(defaultVoice.name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Handle Bookmarking offline library
  const toggleBookmark = () => {
    if (!article) return;
    const bookmarks: string[] = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    let updated: string[];

    if (bookmarks.includes(article.id)) {
      updated = bookmarks.filter((id) => id !== article.id);
      setIsBookmarked(false);
    } else {
      updated = [...bookmarks, article.id];
      setIsBookmarked(true);

      // Save full article metadata and content to local library cache for offline PWA viewing!
      const offlineCache: Record<string, Article> = JSON.parse(localStorage.getItem("offlineCache") || "{}");
      offlineCache[article.id] = article;
      localStorage.setItem("offlineCache", JSON.stringify(offlineCache));
    }
    localStorage.setItem("bookmarks", JSON.stringify(updated));
  };

  // Copy article link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Generate AI Summary using Gemini API Route
  const generateSummary = async () => {
    if (!article || aiSummary) return;
    setGeneratingSummary(true);

    try {
      const res = await fetch("/api/v1/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyText: article.body }),
      });
      const data = await res.json();
      setAiSummary(data.summary || "خلاصہ فراہم نہیں کیا جا سکا۔");
    } catch (err) {
      console.error(err);
      setAiSummary("سبق آموز: کالم کا AI خلاصہ عارضی طور پر غیر دستیاب ہے۔");
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Build Speech Segments for paragraph-by-paragraph TTS reading
  const speechSegments = useMemo(() => {
    if (!article) return [];
    const list: Array<{ id: string; text: string; label: string }> = [
      { id: "title-segment", text: article.title, label: "کالم کا عنوان" },
    ];
    parsedItems.forEach((item, idx) => {
      if (item.type === "heading") {
        list.push({ id: item.id, text: item.text, label: `سرخی: ${item.text}` });
      } else {
        list.push({ id: item.id, text: item.text, label: `پیراگراف ${idx + 1}` });
      }
    });
    return list;
  }, [article, parsedItems]);

  // Strip HTML and Markdown for cleaner speech reading
  const cleanTextForSpeech = (rawText: string) => {
    if (!rawText) return "";
    return rawText
      .replace(/<\/?[^>]+(>|$)/g, "") // Strip HTML tags
      .replace(/[\[\]\(\)\*#_`~]/g, " ") // Strip common markdown symbols
      .replace(/\s+/g, " ") // Normalize spacing
      .trim();
  };

  // Play a specific segment by index
  const playSegment = async (index: number, isUserGesture: boolean = false) => {
    // Clear any active browser speech timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    // Cancel browser synthesis if active
    if (typeof window !== "undefined" && window.speechSynthesis) {
      isTransitioningRef.current = true;
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }

    // Stop and reset audio element if active
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
      } catch (err) {
        console.warn("Error pausing active audio:", err);
      }
    }

    if (index < 0 || index >= speechSegments.length) {
      // Speech finished!
      setSpeechState("stopped");
      setCurrentSegmentIndex(-1);
      setAudioProgress(0);
      isTransitioningRef.current = false;
      return;
    }

    setCurrentSegmentIndex(index);
    setAudioError("");

    const segment = speechSegments[index];

    if (ttsMode === "ai") {
      setIsAiLoading(true);
      setSpeechState("playing");

      try {
        const cleanedText = cleanTextForSpeech(segment.text);
        const res = await fetch("/api/v1/gemini/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanedText }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "سرور سے آواز حاصل کرنے میں ناکامی۔");
        }

        const data = await res.json();
        if (!data.audioData) {
          throw new Error("No audio data returned");
        }

        const audioBlob = base64ToBlob(data.audioData, data.mimeType || "audio/wav");
        const audioUrl = URL.createObjectURL(audioBlob);

        // Revoke previous URL to free memory
        if (ttsAudioUrl) {
          URL.revokeObjectURL(ttsAudioUrl);
        }
        setTtsAudioUrl(audioUrl);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        audioRef.current.src = audioUrl;

        // Apply rate / speed to audio playback if supported
        try {
          audioRef.current.playbackRate = speechRate;
        } catch (_) {}

        audioRef.current.onended = () => {
          setIsAiLoading(false);
          playSegment(index + 1, false);
        };

        audioRef.current.onerror = (e) => {
          console.warn("Audio playback error, falling back to browser speech synthesis:", e);
          setIsAiLoading(false);
          setAudioError("مصنوعی ذہانت (AI) آواز دستیاب نہیں ہے۔ براؤزر کی عام آواز پر منتقل کیا جا رہا ہے۔");
          
          // Fallback to browser voice mode
          setTtsMode("browser");
          setTimeout(() => {
            playSegment(index, false);
          }, 1500);
        };

        audioRef.current.ontimeupdate = () => {
          if (audioRef.current) {
            const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setAudioProgress(isNaN(progress) ? 0 : progress);
          }
        };

        setIsAiLoading(false);
        await audioRef.current.play();
        isTransitioningRef.current = false;
      } catch (err: any) {
        console.warn("Gemini TTS failed, automatically falling back to browser speech synthesis:", err);
        setIsAiLoading(false);
        setAudioError("مصنوعی ذہانت (AI) آواز دستیاب نہیں ہے۔ براؤزر کی عام آواز کا استعمال کیا جا رہا ہے۔");
        
        // Fallback to browser voice mode
        setTtsMode("browser");
        setTimeout(() => {
          playSegment(index, false);
        }, 1500);
      }
    } else {
      // Browser SpeechSynthesis Mode
      setSpeechState("playing");
      setAudioProgress(0);
      const utteranceText = cleanTextForSpeech(segment.text);
      const utterance = new SpeechSynthesisUtterance(utteranceText);

      // Set voice speed (rate)
      utterance.rate = speechRate;

      // Resolve voice and match utterance language to avoid silent browser rejection
      const voices = window.speechSynthesis.getVoices();
      
      // Self-healing: if availableVoices is empty, populate it now
      if (availableVoices.length === 0 && voices.length > 0) {
        setAvailableVoices(voices);
      }

      let activeVoice = voices.find((v) => v.name === selectedVoiceName);

      // Fallback search if no match or not selected yet
      if (!activeVoice) {
        activeVoice = voices.find(
          (v) => v.lang.toLowerCase().startsWith("ur-pk") || v.lang.toLowerCase() === "ur"
        ) || voices.find(
          (v) => v.lang.toLowerCase().includes("ur")
        ) || voices.find(
          (v) => v.lang.toLowerCase().startsWith("hi-in") || v.lang.toLowerCase() === "hi"
        ) || voices.find(
          (v) => v.lang.toLowerCase().includes("hi")
        );
      }

      if (activeVoice) {
        utterance.voice = activeVoice;
        utterance.lang = activeVoice.lang; // CRITICAL: matches voice language to prevent silent browser rejection
      } else {
        // If absolutely no Urdu/Hindi voice, fallback to browser's default voice and language to ensure sound plays
        const defaultVoice = voices.find((v) => v.default) || voices[0];
        if (defaultVoice) {
          utterance.voice = defaultVoice;
          utterance.lang = defaultVoice.lang;
        } else {
          utterance.lang = "ur-PK"; // Last-resort fallback
        }
      }

      utterance.onend = () => {
        // If we are currently transitioning manually, ignore this event to prevent overlapping advances
        if (isTransitioningRef.current) return;
        // Auto advance to next segment
        playSegment(index + 1, false);
      };

      utterance.onerror = (e) => {
        // If transitioning manually or interrupted, ignore to prevent race condition loops
        if (isTransitioningRef.current || e.error === "interrupted") {
          return;
        }
        console.warn("SpeechSynthesis utterance error:", e);
        // Auto advance to prevent getting stuck
        playSegment(index + 1, false);
      };

      // If initiated directly by a user gesture, play completely synchronously to avoid iOS/Safari autoplay blocks!
      if (isUserGesture) {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
        isTransitioningRef.current = false;
      } else {
        // Use a short delay after cancel() to let the browser speech thread fully clear and transition
        speechTimeoutRef.current = window.setTimeout(() => {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
            // Reset transitioning guard once spoken
            isTransitioningRef.current = false;
          }
        }, 150) as unknown as number;
      }
    }

    // Smoothly scroll active text segment into viewport
    setTimeout(() => {
      const element = document.getElementById(segment.id === "title-segment" ? "article-title-heading" : segment.id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 180);
  };

  const handleStartSpeech = () => {
    setShowTtsPlayer(true);
    if (speechState === "paused") {
      if (ttsMode === "ai" && audioRef.current) {
        audioRef.current.play().then(() => {
          setSpeechState("playing");
        }).catch((err) => {
          console.warn("AI Audio resume error:", err);
          playSegment(currentSegmentIndex !== -1 ? currentSegmentIndex : 0, true);
        });
      } else {
        window.speechSynthesis.resume();
        setSpeechState("playing");
      }
    } else {
      // Starting from button click is a direct user gesture
      playSegment(currentSegmentIndex !== -1 ? currentSegmentIndex : 0, true);
    }
  };

  const handlePauseSpeech = () => {
    if (speechState === "playing") {
      if (ttsMode === "ai" && audioRef.current) {
        audioRef.current.pause();
        setSpeechState("paused");
      } else {
        window.speechSynthesis.pause();
        setSpeechState("paused");
      }
    }
  };

  const handleStopSpeech = () => {
    isTransitioningRef.current = true;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Stop standard browser speech
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume(); // Ensure it doesn't get stuck in paused state
    }

    // Stop and reset audio element
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
      } catch (_) {}
    }

    setSpeechState("stopped");
    setCurrentSegmentIndex(-1);
    setAudioProgress(0);
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 200);
  };

  const handlePrevSegment = () => {
    if (currentSegmentIndex > 0) {
      // Prev segment button is a user gesture
      playSegment(currentSegmentIndex - 1, true);
    }
  };

  const handleNextSegment = () => {
    if (currentSegmentIndex < speechSegments.length - 1) {
      // Next segment button is a user gesture
      playSegment(currentSegmentIndex + 1, true);
    }
  };

  const handleSetRate = (rate: number) => {
    setSpeechRate(rate);
    if (speechState === "playing" && currentSegmentIndex !== -1) {
      // Apply live playback rate to HTMLAudioElement if in AI mode
      if (ttsMode === "ai" && audioRef.current) {
        try {
          audioRef.current.playbackRate = rate;
        } catch (_) {}
      } else {
        // Re-play segment to update SpeechSynthesis rate
        playSegment(currentSegmentIndex, true);
      }
    }
  };

  // Main high-level toggle button handler
  const handleTTSPlay = async () => {
    setShowTtsPlayer(true);
    if (speechState === "playing") {
      handlePauseSpeech();
    } else {
      handleStartSpeech();
    }
  };

  // Base64 helper for Gemini TTS playback (converting raw PCM to playable WAV if needed)
  const base64ToBlob = (base64: string, mime: string) => {
    const binary = atob(base64);
    
    // Check if it already has a standard audio container header
    const isRiff = binary.startsWith("RIFF");
    const isMp3 = binary.startsWith("ID3") || (binary.length > 2 && binary.charCodeAt(0) === 0xFF && (binary.charCodeAt(1) & 0xE0) === 0xE0);
    const isFlac = binary.startsWith("fLaC");
    const isOgg = binary.startsWith("OggS");

    // If it lacks a standard audio container header, it is raw headerless PCM.
    // We MUST wrap it in a WAV container so the browser can play it!
    if (!isRiff && !isMp3 && !isFlac && !isOgg) {
      // Parse sample rate if available in mimetype, e.g., "audio/pcm;rate=24000"
      let sampleRate = 24000;
      const rateMatch = mime.match(/rate=(\d+)/);
      if (rateMatch && rateMatch[1]) {
        sampleRate = parseInt(rateMatch[1], 10);
      }

      const pcmLength = binary.length;
      const wavHeaderBuffer = new ArrayBuffer(44);
      const view = new DataView(wavHeaderBuffer);

      // RIFF identifier
      view.setUint8(0, 0x52); // R
      view.setUint8(1, 0x49); // I
      view.setUint8(2, 0x46); // F
      view.setUint8(3, 0x46); // F
      // File length (36 + pcmLength)
      view.setUint32(4, 36 + pcmLength, true);
      // WAVE identifier
      view.setUint8(8, 0x57); // W
      view.setUint8(9, 0x41); // A
      view.setUint8(10, 0x56); // V
      view.setUint8(11, 0x45); // E
      // fmt chunk identifier
      view.setUint8(12, 0x66); // f
      view.setUint8(13, 0x6d); // m
      view.setUint8(14, 0x74); // t
      view.setUint8(15, 0x20); // space
      // format chunk length (16)
      view.setUint32(16, 16, true);
      // sample format (1 = Linear PCM)
      view.setUint16(20, 1, true);
      // channel count (1 = Mono)
      view.setUint16(22, 1, true);
      // sample rate
      view.setUint32(24, sampleRate, true);
      // byte rate (sampleRate * 1 channel * 16 bits / 8 = sampleRate * 2)
      view.setUint32(28, sampleRate * 2, true);
      // block align (1 channel * 16 bits / 8 = 2)
      view.setUint16(32, 2, true);
      // bits per sample (16)
      view.setUint16(34, 16, true);
      // data chunk identifier
      view.setUint8(36, 0x64); // d
      view.setUint8(37, 0x61); // a
      view.setUint8(38, 0x74); // t
      view.setUint8(39, 0x61); // a
      // data chunk length
      view.setUint32(40, pcmLength, true);

      // Convert header to uint8array
      const headerArray = new Uint8Array(wavHeaderBuffer);

      // Convert binary PCM data to uint8array
      const pcmArray = new Uint8Array(pcmLength);
      for (let i = 0; i < pcmLength; i++) {
        pcmArray[i] = binary.charCodeAt(i);
      }

      // Concatenate header and pcm data
      const combined = new Uint8Array(44 + pcmLength);
      combined.set(headerArray, 0);
      combined.set(pcmArray, 44);

      return new Blob([combined], { type: "audio/wav" });
    }

    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: mime });
  };

  // Submit dynamic comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent || !authorName || !authorEmail) return;

    setCommentError("");
    setCommentSuccess(false);

    try {
      const res = await fetch(`/api/v1/articles/${article?.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorEmail,
          content: commentContent,
        }),
      });

      if (res.ok) {
        setCommentSuccess(true);
        setCommentContent("");
        // Reload comments list from server
        fetch(`/api/v1/articles/${article?.id}/comments`)
          .then((r) => r.json())
          .then((cms) => setComments(cms));
      } else {
        const d = await res.json();
        setCommentError(d.error || "تبصرہ جمع کرنے میں خرابی پیش آئی۔");
      }
    } catch (err) {
      console.error(err);
      setCommentError("سرور سے کنیکٹ نہیں ہو سکا۔");
    }
  };

  // Submit editorial corrections report
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionText) return;
    setCorrectionSubmitted(true);
    setCorrectionText("");
    setTimeout(() => setCorrectionSubmitted(false), 5000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-500 animate-pulse font-sans">
        مضمون لوڈ کیا جا رہا ہے، براہ کرم انتظار کریں...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans">
        <h2 className="text-xl font-bold text-rose-600 mb-4 font-urdu">مضمون تلاش کرنے میں ناکامی!</h2>
        <p className="text-sm text-stone-500 mb-8">معذرت، یہ کالم ہمارے ریکارڈ میں موجود نہیں ہے یا اسے ہٹا دیا گیا ہے۔</p>
        <button onClick={onBack} className="bg-brand-green-dark text-white px-5 py-2 rounded font-medium flex items-center gap-2 mx-auto">
          <ArrowRight className="w-4 h-4 ml-1" /> واپس جائیں
        </button>
      </div>
    );
  }

  // Set sizing classes based on state
  const sizeClasses = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
    "2xl": "text-2xl md:text-3xl",
  }[fontSize];

  return (
    <>
      {/* Thin, scrolling reading progress bar (RTL direction for Urdu site) */}
      <motion.div 
        className="fixed top-0 right-0 h-1 bg-gradient-to-l from-brand-gold via-amber-400 to-amber-300 z-50 shadow-[0_2px_8px_rgba(217,163,22,0.6)] origin-right"
        style={{ width: `${scrollProgress}%` }}
        id="reading-progress-bar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <article className={`${headingsList.length > 0 ? "max-w-6xl" : "max-w-4xl"} mx-auto px-4 sm:px-6 py-8 font-sans`}>
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 hover:text-brand-gold text-brand-green-dark text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer group"
        id="back-to-home-btn"
      >
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        <span>کالمز کی فہرست میں واپس جائیں</span>
      </button>

      {/* Top Advertisement Slot (Leaderboard size) */}
      <AdSlot size="leaderboard" dataSaver={dataSaver} className="mb-8" />

      {/* Responsive Columns Grid Layout */}
      <div className={headingsList.length > 0 ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" : ""}>
        
        {/* Main Article Content Column */}
        <div className={headingsList.length > 0 ? "lg:col-span-9 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 md:p-8 shadow-sm" : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 md:p-8 shadow-sm"}>
        
        {/* Header Metadata */}
        <div className="border-b border-stone-100 dark:border-stone-800 pb-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="bg-brand-gold/10 text-brand-green-dark text-xs font-bold px-3 py-1 rounded">
              {category?.name || "آراء"}
            </span>
            <span className="text-stone-400 text-xs">
              شائع شدہ: {new Date(article.publishedAt).toLocaleDateString("ur-PK", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          <h1 
            id="article-title-heading"
            className={`text-2xl md:text-3xl lg:text-4xl font-bold font-urdu leading-tight mb-4 transition-all duration-500 rounded-lg ${
              currentSegmentIndex === 0 
                ? "text-brand-gold bg-amber-500/10 border-r-4 border-brand-gold px-4 py-3 -mr-4 dark:bg-amber-500/5 shadow-sm"
                : "text-stone-900 dark:text-white"
            }`}
          >
            {article.title}
          </h1>

          {/* Writer Info and sharing strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              onClick={() => writer && onSelectWriter(writer.slug)}
              className="flex items-center gap-3 text-right group cursor-pointer"
            >
              <img
                src={writer?.image}
                alt={writer?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-brand-gold/30 group-hover:border-brand-gold transition-colors"
              />
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-brand-gold transition-colors flex items-center gap-1">
                  <span>{writer?.name}</span>
                  {writer?.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10 inline-block" title="تصدیق شدہ کالم نگار" />
                  )}
                </h4>
                <p className="text-[11px] text-stone-500">{writer?.expertise}</p>
              </div>
            </button>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleTTSPlay}
                className={`p-2 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold cursor-pointer border transition-colors ${
                  speechState === "playing"
                    ? "bg-brand-gold/20 text-brand-gold border-brand-gold/40 animate-pulse"
                    : "bg-stone-50 hover:bg-stone-100 text-brand-green-dark border-stone-200"
                }`}
                title={speechState === "playing" ? "آڈیو روکیں" : "کالم سنیں"}
                id="tts-play-btn"
              >
                {speechState === "playing" ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span className="font-urdu">
                  {speechState === "playing" ? "آڈیو روکیں" : "کالم سنیں"}
                </span>
              </button>

              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isBookmarked
                    ? "bg-brand-gold/20 text-brand-gold border-brand-gold/40"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-500 border-stone-200"
                }`}
                title={isBookmarked ? "محفوظ شدہ کالم" : "کالم محفوظ کریں"}
                id="bookmark-btn"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                onClick={copyLink}
                className="p-2 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-500 border border-stone-200 cursor-pointer"
                title="لنک کاپی کریں"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handlePrint}
                className="p-2 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-500 border border-stone-200 cursor-pointer"
                title="پرنٹ کریں"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
          {audioError && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs flex items-start gap-2 animate-fade-in font-urdu leading-relaxed">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{audioError}</span>
            </div>
          )}
        </div>

        {/* Web Speech API & AI Urdu TTS Player Panel */}
        <AnimatePresence>
          {(showTtsPlayer || speechState !== "stopped") && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-6 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-850 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="p-4 sm:p-5" dir="rtl">
                {/* Header with Mode Toggle Options */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 mb-4 gap-4">
                  <div className="flex items-center gap-2 text-right">
                    <Volume2 className={`w-5 h-5 text-brand-gold shrink-0 ${speechState === "playing" ? "animate-pulse" : ""}`} />
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white font-urdu">آڈیو کالم ریڈر</h3>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-urdu leading-normal">
                        {ttsMode === "ai" 
                          ? "جدید مصنوعی ذہانت (AI) کی مدد سے انتہائی پرکشش اور قدرتی اردو آواز میں کالم سنیں۔" 
                          : "براؤزر کی مدد سے مفت اور رواں آڈیو کالم ریڈر کی سہولت۔"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mode selector pill toggle */}
                    <div className="flex bg-stone-150 dark:bg-stone-900 rounded-lg p-0.5 border border-stone-200/50 dark:border-stone-800 shrink-0">
                      <button
                        onClick={() => {
                          handleStopSpeech();
                          setTtsMode("ai");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          ttsMode === "ai"
                            ? "bg-brand-gold text-stone-900 font-bold shadow-sm"
                            : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span className="font-urdu">AI بہترین آواز</span>
                      </button>
                      <button
                        onClick={() => {
                          handleStopSpeech();
                          setTtsMode("browser");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          ttsMode === "browser"
                            ? "bg-brand-gold text-stone-900 font-bold shadow-sm"
                            : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span className="font-urdu">عام آواز</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        handleStopSpeech();
                        setShowTtsPlayer(false);
                      }}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold cursor-pointer p-1.5"
                      title="بند کریں"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress & Current Sentence Display */}
                <div className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-lg p-3.5 mb-4">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2 font-urdu">
                    <span>
                      {currentSegmentIndex !== -1 
                        ? `پڑھا جا رہا ہے: ${speechSegments[currentSegmentIndex]?.label}` 
                        : "کالم سننے کے لیے نیچے پلے (Play) کا بٹن دبائیں"}
                    </span>
                    <span>
                      {speechSegments.length > 0 && currentSegmentIndex !== -1
                        ? `${Math.round(((currentSegmentIndex + 1) / speechSegments.length) * 100)}% مکمل`
                        : "0% مکمل"}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-stone-150 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-brand-gold h-full transition-all duration-300"
                      style={{
                        width: `${
                          speechSegments.length > 0 && currentSegmentIndex !== -1
                            ? ((currentSegmentIndex + 1) / speechSegments.length) * 105 // Slightly scaled for natural visuals
                            : 0
                        }%`,
                        maxWidth: "100%"
                      }}
                    />
                  </div>

                  {/* AI Generating Loader Indicator */}
                  {isAiLoading ? (
                    <div className="flex items-center gap-2 text-xs text-brand-gold font-urdu py-1.5 justify-center sm:justify-start bg-amber-500/5 rounded p-2 border border-brand-gold/10">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                      <span>مصنوعی ذہانت (AI) سے آڈیو آواز تیار کی جا رہی ہے...</span>
                    </div>
                  ) : currentSegmentIndex !== -1 && speechSegments[currentSegmentIndex] ? (
                    <p className="mt-2 text-xs text-stone-700 dark:text-stone-300 font-medium font-urdu leading-relaxed text-right border-r-2 border-brand-gold/40 pr-2">
                      {speechSegments[currentSegmentIndex].text}
                    </p>
                  ) : (
                    <p className="mt-2 text-[10px] text-stone-400 font-urdu leading-relaxed text-right">
                      آپ مضمون کے کسی بھی پیراگراف یا عنوان پر براہ راست کلک کر کے بھی وہاں سے آڈیو سن سکتے ہیں۔
                    </p>
                  )}
                </div>

                {/* Controls Layout */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Primary Play/Pause/Stop Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevSegment}
                      disabled={currentSegmentIndex <= 0}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-750 dark:text-stone-300 disabled:opacity-40 cursor-pointer transition-colors"
                      title="پچھلا پیراگراف"
                    >
                      <SkipForward className="w-4 h-4" /> {/* SkipForward works as previous in RTL */}
                    </button>

                    {speechState === "playing" ? (
                      <button
                        onClick={handlePauseSpeech}
                        className="px-4 py-2 rounded-lg bg-brand-gold text-stone-900 hover:bg-amber-500 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                        title="روکیں"
                      >
                        <Pause className="w-4 h-4" />
                        <span className="font-urdu">روکیں</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartSpeech}
                        className="px-4 py-2 rounded-lg bg-brand-green-dark text-white hover:bg-brand-green-light font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                        title="سنیں"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span className="font-urdu">
                          {speechState === "paused" ? "جاری رکھیں" : "سنیں"}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={handleStopSpeech}
                      disabled={speechState === "stopped"}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-600 dark:text-red-400 disabled:opacity-40 cursor-pointer transition-colors"
                      title="بند کریں"
                    >
                      <Square className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleNextSegment}
                      disabled={currentSegmentIndex >= speechSegments.length - 1}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-750 dark:text-stone-300 disabled:opacity-40 cursor-pointer transition-colors"
                      title="اگلا پیراگراف"
                    >
                      <SkipBack className="w-4 h-4" /> {/* SkipBack works as next in RTL */}
                    </button>
                  </div>

                  {/* Settings: Speed & Voices */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Speech Speed Selection */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-stone-400 font-urdu">رفتار:</span>
                      <div className="flex bg-stone-150 dark:bg-stone-800 rounded-md p-0.5">
                        {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => handleSetRate(rate)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                              speechRate === rate
                                ? "bg-white dark:bg-stone-700 text-stone-950 dark:text-white shadow-sm"
                                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speech Voice Selection (Only visible in Browser TTS Mode) */}
                    {ttsMode === "browser" && availableVoices.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400 font-urdu">آواز:</span>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => {
                            setSelectedVoiceName(e.target.value);
                            if (speechState === "playing" && currentSegmentIndex !== -1) {
                              setTimeout(() => playSegment(currentSegmentIndex, true), 100);
                            }
                          }}
                          className="bg-stone-100 dark:bg-stone-800 border-none rounded-md px-2 py-1 text-[10px] font-semibold text-stone-700 dark:text-stone-300 outline-none max-w-[130px] sm:max-w-[185px] truncate cursor-pointer"
                        >
                          {availableVoices.map((v) => {
                            const isUrdu = v.lang.toLowerCase().includes("ur");
                            const isHindi = v.lang.toLowerCase().includes("hi");
                            const badge = isUrdu ? " (بہترین اردو)" : isHindi ? " (ہندی - متبادل)" : "";
                            return (
                              <option key={v.name} value={v.name}>
                                {v.name} ({v.lang}){badge}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Font Control Bar and view settings */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 mb-6 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-brand-gold" /> رسم الخط سائز:
            </span>
            <div className="flex items-center bg-stone-100 rounded-md p-0.5">
              {(["sm", "base", "lg", "xl", "2xl"] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono uppercase font-bold cursor-pointer transition-colors ${
                    fontSize === sz ? "bg-white text-stone-900 shadow-sm" : "hover:text-stone-900"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <span>طرزِ مطالعہ:</span>
            <div className="flex bg-stone-100 rounded-md p-0.5">
              <button
                onClick={() => setReadingMode("normal")}
                className={`px-3 py-1 text-[11px] rounded font-medium cursor-pointer transition-colors ${
                  readingMode === "normal" ? "bg-white text-stone-900 shadow-sm" : "hover:text-stone-900"
                }`}
              >
                نارمل
              </button>
              <button
                onClick={() => setReadingMode("text")}
                className={`px-3 py-1 text-[11px] rounded font-medium cursor-pointer transition-colors ${
                  readingMode === "text" ? "bg-white text-stone-900 shadow-sm" : "hover:text-stone-900"
                }`}
              >
                صرف متن
              </button>
            </div>
          </div>
        </div>

        {/* AI summary toggle option */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-stone-800/40 dark:to-stone-800/20 border border-brand-gold/20 rounded-xl p-4 md:p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-green-dark dark:text-brand-gold flex items-center gap-1.5 font-urdu">
              <Sparkles className="w-4 h-4 text-brand-gold animate-bounce" />
              کالم کا مصنوعی ذہانت (AI) خلاصہ
            </h3>
            {!aiSummary && (
              <button
                onClick={generateSummary}
                disabled={generatingSummary}
                className="bg-brand-green-dark text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-brand-green-light transition-colors flex items-center gap-1 cursor-pointer"
                id="ai-summarize-btn"
              >
                {generatingSummary ? "خلاصہ تیار ہو رہا ہے..." : "خلاصہ تیار کریں"}
              </button>
            )}
          </div>

          {aiSummary ? (
            <p className="text-xs md:text-sm text-stone-700 dark:text-stone-300 font-medium leading-relaxed leading-urdu text-right">
              {aiSummary}
            </p>
          ) : (
            <p className="text-[11px] text-stone-500 font-light">
              طویل تحاریر کا فوری مطالعہ کرنے کے لیے مصنوعی ذہانت (AI) خلاصہ کار کا استعمال کریں۔ یہ متن کا فکری نچوڑ فراہم کرتا ہے۔
            </p>
          )}
        </div>

        {/* HERO IMAGE */}
        {readingMode !== "text" && !dataSaver && article.image && (
          <div className="mb-8 overflow-hidden rounded-lg border border-stone-200">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-auto max-h-[400px] object-cover"
              referrerPolicy="no-referrer"
            />
            {(article.caption || article.credit) && (
              <div className="bg-stone-50 dark:bg-stone-800/50 p-3 border-t border-stone-200 text-xs text-stone-500 flex justify-between">
                <span>{article.caption}</span>
                {article.credit && <span className="font-mono text-[10px]">{article.credit}</span>}
              </div>
            )}
          </div>
        )}

        {/* Mobile / Inline Table of Contents */}
        {headingsList.length > 0 && (
          <div className="lg:hidden bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-xl p-4 mb-6">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-brand-gold" />
                  <h3 className="text-xs font-bold text-stone-900 dark:text-white font-urdu">مشمولاتِ کالم (فوری نیوی گیشن)</h3>
                </div>
                <div className="text-stone-400 group-open:rotate-180 transition-transform duration-200">
                  <span className="text-[10px] block">▼</span>
                </div>
              </summary>
              <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 space-y-1.5">
                {headingsList.map((h) => {
                  const isActive = activeHeadingId === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => scrollToHeading(h.id)}
                      className={`block w-full text-right text-xs py-1.5 px-3 rounded-md transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-brand-gold/10 text-brand-gold font-bold font-urdu"
                          : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/40 font-urdu"
                      }`}
                    >
                      <span>{h.text}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* COLUMN BODY TEXT */}
        <div className={`urdu-text tracking-wide text-stone-800 dark:text-stone-100 ${sizeClasses}`}>
          {(() => {
            let paragraphCount = 0;
            const paragraphItems = parsedItems.filter((item) => item.type === "paragraph");
            // Choose index to insert (e.g. after the 2nd paragraph, or middle)
            const insertIndex = paragraphItems.length > 2 ? 1 : Math.max(0, paragraphItems.length - 1);

            return parsedItems.map((item) => {
              const segmentIndex = speechSegments.findIndex((s) => s.id === item.id);
              const isActiveSegment = currentSegmentIndex === segmentIndex && segmentIndex !== -1;

              if (item.type === "heading") {
                const HeadingTag = item.level === 1 ? "h2" : item.level === 2 ? "h3" : "h4";
                return (
                  <HeadingTag
                    key={item.id}
                    id={item.id}
                    onClick={() => segmentIndex !== -1 && playSegment(segmentIndex, true)}
                    className={`font-urdu font-bold mt-10 mb-4 pb-2 border-b text-right scroll-mt-24 transition-all duration-300 rounded-lg cursor-pointer hover:bg-stone-50/50 dark:hover:bg-stone-800/20 px-2 -mx-2 ${
                      isActiveSegment
                        ? "text-brand-gold border-brand-gold bg-amber-500/10 px-4 py-3 -mr-4 dark:bg-amber-500/5 shadow-sm"
                        : activeHeadingId === item.id
                        ? "text-brand-gold border-brand-gold scale-[1.01]"
                        : "text-brand-green-dark border-stone-100 dark:border-stone-800"
                    }`}
                    style={{
                      fontSize: item.level === 1 ? "1.4em" : item.level === 2 ? "1.25em" : "1.1em"
                    }}
                    title="یہاں سے سننے کے لیے کلک کریں"
                  >
                    {item.text}
                  </HeadingTag>
                );
              }

              // It's a paragraph
              const currentParaIndex = paragraphCount;
              paragraphCount++;

              return (
                <React.Fragment key={item.id}>
                  <p 
                    id={item.id}
                    onClick={() => segmentIndex !== -1 && playSegment(segmentIndex, true)}
                    className={`mb-6 last:mb-0 whitespace-pre-wrap leading-loose text-right transition-all duration-500 rounded-lg cursor-pointer hover:bg-stone-50/50 dark:hover:bg-stone-800/20 px-2 -mx-2 ${
                      isActiveSegment 
                        ? "bg-amber-500/10 border-r-4 border-brand-gold px-4 py-3 -mr-4 dark:bg-amber-500/5 shadow-sm" 
                        : ""
                    }`}
                    title="اس پیراگراف سے سننے کے لیے کلک کریں"
                  >
                    {item.text}
                  </p>

                  {/* Render the inline related article banner right after the designated paragraph index */}
                  {currentParaIndex === insertIndex && relatedArticles.length > 0 && (
                    <div className="my-8 p-5 bg-stone-50 dark:bg-stone-800/40 border-r-4 border-brand-gold rounded-l-xl shadow-sm text-right">
                      <span className="block text-[11px] font-bold text-brand-green-dark dark:text-brand-gold uppercase tracking-wider mb-2 font-urdu">
                        سلِسلۂ کالمز: اس موضوع پر مصنف کی مزید تحریر پڑھیں
                      </span>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-sm md:text-base font-bold text-stone-950 dark:text-white font-urdu leading-snug">
                            {relatedArticles[0].title}
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-urdu line-clamp-2 leading-relaxed">
                            {relatedArticles[0].excerpt}
                          </p>
                        </div>
                        <a
                          href={`#/article/${relatedArticles[0].slug}`}
                          className="shrink-0 bg-brand-green-dark hover:bg-brand-green-light text-white text-xs font-bold px-4 py-2 rounded-md shadow-sm transition-all duration-200 flex items-center gap-1 hover:gap-2 font-urdu"
                        >
                          <span>کالم پڑھیں</span>
                          <ArrowRight className="w-4 h-4 rotate-180" />
                        </a>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            });
          })()}
        </div>

        {/* Display related articles series if any exist */}
        {relatedArticles.length > 0 && (
          <div className="border-t border-stone-150 dark:border-stone-800 pt-6 mt-8 text-right">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white font-urdu border-r-4 border-brand-gold pr-3 mb-4">
              متعلقہ کالمز اور سلسلہ وار تحاریر:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map((rel) => (
                <a
                  key={rel.id}
                  href={`#/article/${rel.slug}`}
                  className="p-4 bg-stone-50 dark:bg-stone-850 hover:bg-brand-gold/5 border border-stone-200 dark:border-stone-800 hover:border-brand-gold/30 rounded-lg transition-all duration-150 flex items-start gap-3 text-right group"
                >
                  <div className="w-2 h-2 rounded-full bg-brand-gold mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                  <div className="flex-1">
                    <h4 className="text-xs md:text-sm font-bold text-stone-900 dark:text-white font-urdu leading-snug group-hover:text-brand-gold transition-colors">
                      {rel.title}
                    </h4>
                    <p className="text-[10px] md:text-xs text-stone-500 mt-1 line-clamp-1 font-urdu">
                      {rel.excerpt}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Display sponsored tags */}
        <div className="border-t border-stone-100 dark:border-stone-800 pt-6 mt-8 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="bg-stone-100 text-stone-600 text-xs px-3 py-1 rounded hover:bg-stone-200 transition-colors cursor-pointer font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Social Media Sharing Widget */}
        <div className="border-t border-stone-150 dark:border-stone-800 pt-6 mt-8 text-right" dir="rtl">
          <div className="bg-stone-50 dark:bg-stone-850/30 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white font-urdu">کالم شیئر کریں (Share Column)</h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-urdu">اس علمی شراکت کو سوشل میڈیا پلیٹ فارمز پر اپنے حلقہ احباب میں عام کریں</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-stone-500 font-urdu shrink-0">
                <Share2 className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                <span>قارئین کے ساتھ کالم شیئر کریں</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* WhatsApp button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${article ? `کالم: ${article.title}` : "مضمون پڑھیں"}\n${window.location.href}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 font-urdu font-semibold transition-all hover:scale-[1.02] shadow-sm active:scale-95"
                id="widget-share-whatsapp"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>واٹس ایپ (WhatsApp)</span>
              </a>

              {/* Facebook button */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 font-urdu font-semibold transition-all hover:scale-[1.02] shadow-sm active:scale-95"
                id="widget-share-facebook"
              >
                <Facebook className="w-4 h-4" />
                <span>فیس بک (Facebook)</span>
              </a>

              {/* Twitter/X button */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  article ? `کالم: ${article.title}` : "مضمون پڑھیں"
                )}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 font-urdu font-semibold transition-all hover:scale-[1.02] shadow-sm active:scale-95"
                id="widget-share-twitter"
              >
                <Twitter className="w-4 h-4" />
                <span>ٹویٹر (Twitter / X)</span>
              </a>

              {/* Copy Link button */}
              <button
                onClick={copyLink}
                className={`text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 font-urdu font-semibold transition-all hover:scale-[1.02] shadow-sm active:scale-95 border ${
                  isCopied
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-750 border-stone-200 dark:border-stone-700"
                }`}
                id="widget-share-copy"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? "لنک کاپی ہو گیا!" : "لنک کاپی کریں (Copy Link)"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Articles by Category */}
        {categoryRelatedArticles.length > 0 && (
          <div className="border-t border-stone-150 dark:border-stone-800 pt-8 mt-8 text-right" dir="rtl">
            <div className="flex items-center gap-2 mb-6 border-r-4 border-brand-gold pr-3">
              <Sparkles className="w-4.5 h-4.5 text-brand-gold" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white font-urdu">
                مزید متعلقہ کالمز ({category?.name || "اسی زمرے سے"}):
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {categoryRelatedArticles.map((rel) => (
                <a
                  key={rel.id}
                  href={`#/article/${rel.slug}`}
                  className="group flex flex-col h-full bg-stone-50/50 dark:bg-stone-850/30 hover:bg-white dark:hover:bg-stone-800 border border-stone-150 dark:border-stone-800 hover:border-brand-gold/40 hover:shadow-md rounded-xl p-4 transition-all duration-300 text-right shadow-sm"
                >
                  {/* Related Article Image */}
                  {!dataSaver && rel.image && (
                    <div className="mb-3 overflow-hidden rounded-lg aspect-video bg-stone-100">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Writer Profile Header */}
                  {rel.writer && (
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 font-urdu">
                        {rel.writer.name}
                      </span>
                      <img
                        src={rel.writer.image}
                        alt={rel.writer.name}
                        className="w-5 h-5 rounded-full object-cover border border-stone-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h4 className="text-xs md:text-sm font-bold text-stone-900 dark:text-white font-urdu leading-snug group-hover:text-brand-gold transition-colors line-clamp-2 mb-2 flex-1">
                    {rel.title}
                  </h4>

                  {/* Excerpt */}
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-urdu line-clamp-2 leading-relaxed mb-3">
                    {rel.excerpt}
                  </p>

                  {/* Meta Footer */}
                  <div className="flex items-center justify-between border-t border-stone-150 dark:border-stone-800/60 pt-2.5 mt-auto text-[10px] text-stone-400">
                    <span>{rel.readingTime} منٹ مطالعہ</span>
                    <span>
                      {new Date(rel.publishedAt).toLocaleDateString("ur-PK", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Table of Contents Sidebar Column (Desktop Only) */}
      {headingsList.length > 0 && (
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 self-start bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
            <List className="w-4 h-4 text-brand-gold" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white font-urdu">مشمولاتِ کالم</h3>
          </div>
          <div className="relative border-r border-stone-100 dark:border-stone-800 pr-2 mr-1 space-y-3">
            {headingsList.map((h) => {
              const isActive = activeHeadingId === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => scrollToHeading(h.id)}
                  className={`block w-full text-right text-xs transition-all duration-200 hover:text-brand-gold focus:outline-none cursor-pointer pr-3 relative ${
                    isActive
                      ? "text-brand-gold font-bold font-urdu scale-[1.02]"
                      : "text-stone-500 dark:text-stone-400 font-urdu"
                  }`}
                >
                  {isActive && (
                    <div className="absolute right-[-11px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-gold rounded-full shadow-sm shadow-brand-gold/50" />
                  )}
                  <span>{h.text}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>

      {/* Middle Advertisement Slot (Square size) */}
      <AdSlot size="square" dataSaver={dataSaver} className="my-8" />

      {/* Editorial Correction Suggestion form */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-stone-900 border-r-4 border-brand-gold pr-3 mb-2 font-urdu">
          ادارتی تصحیح اور رپورٹ
        </h3>
        <p className="text-xs text-stone-500 mb-4 leading-normal">
          اگر آپ کو اس تحریر میں املا کی غلطی، تاریخی عدم تسلسل، یا اخلاقی تضاد نظر آیا ہے تو براہ کرم ہمیں مطلع کریں۔ ہم سچائی اور دیانتداری پر یقین رکھتے ہیں۔
        </p>

        {correctionSubmitted ? (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 p-4 rounded text-center text-xs font-semibold">
            رپورٹ موصول ہو گئی۔ تصحیح کے لیے ادارتی ٹیم آپ کی مشکور ہے۔
          </div>
        ) : (
          <form onSubmit={handleCorrectionSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="مثال: پیراگراف 2 میں 'وفاقی بجٹ' کی تاریخ درست نہیں ہے۔۔۔"
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              required
              className="flex-1 bg-stone-50 text-stone-900 placeholder-stone-400 text-xs rounded-md px-3 py-2 border border-stone-200 focus:outline-none focus:bg-white focus:border-brand-gold"
            />
            <button
              type="submit"
              className="bg-brand-green-dark text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-brand-green-light transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ارسال کریں</span>
            </button>
          </form>
        )}
      </div>

      {/* COMMENTS SECTION WORKSPACE */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-stone-900 font-urdu mb-6 flex items-center gap-2 border-b border-stone-100 pb-3">
          <MessageSquare className="w-5 h-5 text-brand-gold" />
          تبصرے اور قارئین کی آراء ({comments.length})
        </h3>

        {/* Comment Submission Form */}
        <form onSubmit={handleCommentSubmit} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-lg border border-stone-200">
          <h4 className="text-xs font-bold text-brand-green-dark font-urdu">اپنی رائے کا اظہار کریں</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="اپنا مکمل نام لکھیں..."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              className="bg-white text-stone-900 placeholder-stone-400 text-xs rounded-md px-3 py-2 border border-stone-200 focus:outline-none focus:border-brand-gold"
            />
            <input
              type="email"
              placeholder="اپنا ای میل لکھیں (پوشیدہ رہے گا)..."
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              required
              className="bg-white text-stone-900 placeholder-stone-400 text-xs rounded-md px-3 py-2 border border-stone-200 focus:outline-none focus:border-brand-gold"
            />
          </div>
          <textarea
            placeholder="معزز قاری، شائستگی اور اخلاقی حدود کا خیال رکھتے ہوئے تعمیری کمنٹ لکھیں۔ گالی گلوچ اور نازیبا جملوں پر مبنی کمنٹ بلاک کر دیئے جائیں گے۔"
            rows={3}
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            required
            className="w-full bg-white text-stone-900 placeholder-stone-400 text-xs rounded-md px-3 py-2 border border-stone-200 focus:outline-none focus:border-brand-gold"
          ></textarea>

          {commentError && <p className="text-xs text-rose-600 font-medium">{commentError}</p>}
          {commentSuccess && (
            <p className="text-xs text-emerald-600 font-medium">
              آپ کا تبصرہ جمع کر دیا گیا ہے۔ منظوری کے بعد کالم کے نیچے دکھائی دے گا۔
            </p>
          )}

          <button
            type="submit"
            className="bg-brand-green-dark hover:bg-brand-green-light text-white text-xs font-bold px-5 py-2.5 rounded-md transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            id="comment-submit-btn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>تبصرہ شائع کریں</span>
          </button>
        </form>

        {/* Comments Feed */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-stone-400 text-xs py-8">
              اس تحریر پر فی الحال کوئی تبصرہ نہیں ہے۔ پہلا تبصرہ لکھ کر بحث کا آغاز کریں۔
            </div>
          ) : (
            comments.map((com) => (
              <div key={com.id} className="border-b border-stone-100 last:border-0 pb-4 last:pb-0" id={`comment-${com.id}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-stone-900">{com.authorName}</span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(com.createdAt).toLocaleDateString("ur-PK")}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed text-right">{com.content}</p>

                {/* Sub-replies loop */}
                {com.replies && com.replies.length > 0 && (
                  <div className="mr-6 mt-3 pl-2 border-r-2 border-brand-gold bg-stone-50 p-2.5 rounded space-y-3">
                    {com.replies.map((reply) => (
                      <div key={reply.id}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[11px] font-bold text-stone-800">{reply.authorName}</span>
                          <span className="text-[9px] text-stone-400">
                            {new Date(reply.createdAt).toLocaleDateString("ur-PK")}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 text-right">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </article>

    {/* Floating Scroll-to-Top Button */}
    <AnimatePresence>
      {showScrollTop && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-6 z-50 p-3.5 rounded-full bg-brand-green-dark hover:bg-brand-green-light text-white shadow-xl border border-brand-gold/30 hover:border-brand-gold flex items-center justify-center cursor-pointer group"
          aria-label="اوپر جائیں"
          id="scroll-to-top-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1" />
          <span className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-stone-900 dark:bg-stone-800 text-white text-[11px] font-urdu font-medium py-1 px-2.5 rounded shadow-md whitespace-nowrap pointer-events-none border border-stone-850 dark:border-stone-700">
            اوپر جائیں
          </span>
        </motion.button>
      )}
    </AnimatePresence>

    {/* Floating Share Menu */}
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3" dir="rtl">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsShareExpanded(!isShareExpanded)}
        className="p-3.5 rounded-full bg-brand-gold hover:bg-amber-500 text-stone-900 shadow-xl border border-brand-gold/30 flex items-center justify-center cursor-pointer group relative"
        aria-label="شیئر کریں"
        id="floating-share-trigger-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 className={`w-5 h-5 transition-transform duration-300 ${isShareExpanded ? "rotate-45" : ""}`} />
        <span className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-stone-900 dark:bg-stone-800 text-white text-[11px] font-urdu font-medium py-1 px-2.5 rounded shadow-md whitespace-nowrap pointer-events-none border border-stone-850 dark:border-stone-700">
          شیئر کریں
        </span>
      </motion.button>

      {/* Share Options List */}
      <AnimatePresence>
        {isShareExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-2 mb-1"
          >
            {/* WhatsApp Share Button */}
            <motion.a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `${article ? `کالم: ${article.title}` : "مضمون پڑھیں"}\n${window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer relative group"
              title="واٹس ایپ پر شیئر کریں"
              whileHover={{ y: -2 }}
              id="share-whatsapp-btn"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-stone-900 dark:bg-stone-800 text-white text-[11px] font-urdu font-medium py-1 px-2.5 rounded shadow-md whitespace-nowrap pointer-events-none border border-stone-850 dark:border-stone-700">
                واٹس ایپ
              </span>
            </motion.a>

            {/* Twitter Share Button */}
            <motion.a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                article ? `کالم: ${article.title}` : "مضمون پڑھیں"
              )}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-sky-400 hover:bg-sky-500 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer relative group"
              title="ٹویٹر پر شیئر کریں"
              whileHover={{ y: -2 }}
              id="share-twitter-btn"
            >
              <Twitter className="w-5 h-5" />
              <span className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-stone-900 dark:bg-stone-800 text-white text-[11px] font-urdu font-medium py-1 px-2.5 rounded shadow-md whitespace-nowrap pointer-events-none border border-stone-850 dark:border-stone-700">
                ٹویٹر (X)
              </span>
            </motion.a>

            {/* Facebook Share Button */}
            <motion.a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer relative group"
              title="فیس بک پر شیئر کریں"
              whileHover={{ y: -2 }}
              id="share-facebook-btn"
            >
              <Facebook className="w-5 h-5" />
              <span className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-stone-900 dark:bg-stone-800 text-white text-[11px] font-urdu font-medium py-1 px-2.5 rounded shadow-md whitespace-nowrap pointer-events-none border border-stone-850 dark:border-stone-700">
                فیس بک
              </span>
            </motion.a>

            {/* Copy Link Button */}
            <motion.button
              onClick={copyLink}
              className="w-11 h-11 rounded-full bg-stone-600 hover:bg-stone-700 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer relative group"
              title="لنک کاپی کریں"
              whileHover={{ y: -2 }}
              id="share-copy-btn"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-stone-900 dark:bg-stone-800 text-white text-[11px] font-urdu font-medium py-1 px-2.5 rounded shadow-md whitespace-nowrap pointer-events-none border border-stone-850 dark:border-stone-700">
                {isCopied ? "لنک کاپی ہو گیا!" : "لنک کاپی کریں"}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
