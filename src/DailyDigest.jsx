import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  { id: "all", label: "All", icon: "◉" },
  { id: "js", label: "JS / TS", icon: "⬡" },
  { id: "ai", label: "AI & GenAI", icon: "◈" },
  { id: "tech", label: "General Tech", icon: "▣" },
  { id: "saved", label: "Saved", icon: "★" },
];

const SOURCES = [
  {
    name: "Hacker News",
    category: "tech",
    color: "#FF6600",
    fetchFn: async () => {
      const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
      const ids = await res.json();
      const items = await Promise.all(
        ids.slice(0, 12).map(async (id) => {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return r.json();
        })
      );
      return items
        .filter((i) => i && i.title)
        .map((i) => ({
          title: i.title,
          url: i.url || `https://news.ycombinator.com/item?id=${i.id}`,
          points: i.score,
          comments: i.descendants || 0,
          time: i.time * 1000,
          source: "Hacker News",
          category: categorizeHN(i.title),
        }));
    },
  },
  {
    name: "Dev.to",
    category: "js",
    color: "#3B49DF",
    fetchFn: async () => {
      const res = await fetch("https://dev.to/api/articles?per_page=10&tag=javascript");
      const items = await res.json();
      return items.map((i) => ({
        title: i.title,
        url: i.url,
        points: i.positive_reactions_count,
        comments: i.comments_count,
        time: new Date(i.published_at).getTime(),
        source: "Dev.to",
        category: "js",
        coverImage: i.cover_image,
        readingTime: i.reading_time_minutes,
      }));
    },
  },
  {
    name: "Dev.to AI",
    category: "ai",
    color: "#10B981",
    fetchFn: async () => {
      const res = await fetch("https://dev.to/api/articles?per_page=10&tag=ai");
      const items = await res.json();
      return items.map((i) => ({
        title: i.title,
        url: i.url,
        points: i.positive_reactions_count,
        comments: i.comments_count,
        time: new Date(i.published_at).getTime(),
        source: "Dev.to",
        category: "ai",
        coverImage: i.cover_image,
        readingTime: i.reading_time_minutes,
      }));
    },
  },
];

function categorizeHN(title) {
  const t = title.toLowerCase();
  const jsKeywords = ["javascript", "typescript", "node", "react", "vue", "svelte", "deno", "bun", "npm", "next.js", "nuxt", "angular", "express", "fastify", "jsx", "tsx", "webpack", "vite", "eslint", "pnpm"];
  const aiKeywords = ["ai", "gpt", "llm", "openai", "anthropic", "claude", "gemini", "diffusion", "transformer", "neural", "machine learning", "deep learning", "gen ai", "genai", "copilot", "chatgpt", "midjourney", "stable diffusion", "langchain", "rag", "embedding", "fine-tun", "prompt"];
  if (jsKeywords.some((k) => t.includes(k))) return "js";
  if (aiKeywords.some((k) => t.includes(k))) return "ai";
  return "tech";
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const GRAIN_FILTER = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function DailyDigest() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [savedIds, setSavedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mounted, setMounted] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const results = await Promise.allSettled(SOURCES.map((s) => s.fetchFn()));
      const all = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value);
      all.sort((a, b) => b.time - a.time);
      setArticles(all);
      setError(null);
    } catch (e) {
      setError("Failed to fetch some feeds. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    setTimeout(() => setMounted(true), 100);
  }, [fetchAll]);

  const refresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const toggleSave = (idx) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const filtered = articles.filter((a, i) => {
    if (activeCategory === "saved") return savedIds.has(i);
    if (activeCategory === "all") return true;
    return a.category === activeCategory;
  });

  const categoryColor = (cat) => {
    switch (cat) {
      case "js": return "#F0DB4F";
      case "ai": return "#10B981";
      case "tech": return "#FF6600";
      default: return "#888";
    }
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #0a0a0f 0%, #0f1118 40%, #111320 100%)",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-30%", right: "-20%", width: "60vw", height: "60vw",
        background: "radial-gradient(circle, rgba(240,219,79,0.03) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", left: "-10%", width: "50vw", height: "50vw",
        background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header style={{
          marginBottom: 40,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: loading ? "#F0DB4F" : "#10B981",
              boxShadow: loading ? "0 0 12px #F0DB4F" : "0 0 12px #10B981",
              animation: loading ? "pulse 1.5s ease-in-out infinite" : "none",
            }} />
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 3,
              textTransform: "uppercase", color: "#666",
            }}>
              {loading ? "Fetching feeds..." : "Live feeds"}
            </span>
          </div>
          <h1 style={{
            fontSize: 36, fontWeight: 700, margin: "0 0 4px",
            background: "linear-gradient(135deg, #e8e6e1 0%, #a8a49e 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: -1,
          }}>
            {greeting}, dev.
          </h1>
          <p style={{ fontSize: 15, color: "#555", margin: 0, fontWeight: 300 }}>
            {dateStr} — your daily tech pulse
          </p>
        </header>

        {/* Category tabs */}
        <nav style={{
          display: "flex", gap: 6, marginBottom: 32, overflowX: "auto",
          paddingBottom: 4,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(15px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
        }}>
          {CATEGORIES.map((cat) => {
            const count = cat.id === "all" ? articles.length
              : cat.id === "saved" ? savedIds.size
              : articles.filter((a) => a.category === cat.id).length;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8,
                  border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.05)",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#e8e6e1" : "#555",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.25s ease",
                }}
              >
                <span style={{ fontSize: 11 }}>{cat.icon}</span>
                {cat.label}
                <span style={{
                  fontSize: 11, fontFamily: "'Space Mono', monospace",
                  color: active ? "#888" : "#444",
                  marginLeft: 2,
                }}>{count}</span>
              </button>
            );
          })}
          <button
            onClick={refresh}
            style={{
              marginLeft: "auto", padding: "8px 12px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.05)",
              background: "transparent", color: "#555", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", transition: "all 0.25s ease",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <span style={{
              display: "inline-block",
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
            }}>↻</span>
          </button>
        </nav>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                height: 100, borderRadius: 12,
                background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        )}

        {/* Articles */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 && (
              <div style={{
                textAlign: "center", padding: "60px 20px", color: "#444",
                fontStyle: "italic", fontSize: 14,
              }}>
                {activeCategory === "saved" ? "No saved articles yet. Tap ★ to save." : "No articles found."}
              </div>
            )}
            {filtered.map((article, i) => {
              const globalIdx = articles.indexOf(article);
              const saved = savedIds.has(globalIdx);
              const isHovered = hoveredCard === globalIdx;
              return (
                <div
                  key={`${article.source}-${i}`}
                  onMouseEnter={() => setHoveredCard(globalIdx)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    padding: "16px 18px",
                    borderRadius: 12,
                    border: `1px solid ${isHovered ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                    background: isHovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(10px)",
                    animation: `fadeUp 0.4s ease ${0.15 + i * 0.04}s both`,
                  }}
                >
                  {/* Category accent line */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                    background: categoryColor(article.category),
                    opacity: isHovered ? 0.8 : 0.3,
                    transition: "opacity 0.3s ease",
                    borderRadius: "3px 0 0 3px",
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Meta row */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                        flexWrap: "wrap",
                      }}>
                        <span style={{
                          fontFamily: "'Space Mono', monospace", fontSize: 10,
                          letterSpacing: 1.5, textTransform: "uppercase",
                          color: categoryColor(article.category), fontWeight: 700,
                        }}>
                          {article.category}
                        </span>
                        <span style={{ color: "#333", fontSize: 10 }}>•</span>
                        <span style={{
                          fontSize: 11, color: "#555",
                          fontFamily: "'Space Mono', monospace",
                        }}>
                          {article.source}
                        </span>
                        <span style={{ color: "#333", fontSize: 10 }}>•</span>
                        <span style={{
                          fontSize: 11, color: "#444",
                          fontFamily: "'Space Mono', monospace",
                        }}>
                          {timeAgo(article.time)}
                        </span>
                      </div>

                      {/* Title */}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 15, fontWeight: 500, color: "#ddd",
                          textDecoration: "none", lineHeight: 1.45,
                          display: "block", marginBottom: 8,
                        }}
                      >
                        {article.title}
                      </a>

                      {/* Stats */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 14, fontSize: 12,
                        color: "#555", fontFamily: "'Space Mono', monospace",
                      }}>
                        {article.points != null && (
                          <span>▲ {article.points}</span>
                        )}
                        {article.comments != null && (
                          <span>◻ {article.comments}</span>
                        )}
                        {article.readingTime && (
                          <span>{article.readingTime} min read</span>
                        )}
                      </div>
                    </div>

                    {/* Save button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave(globalIdx); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 18, padding: "4px 6px",
                        color: saved ? "#F0DB4F" : "#333",
                        transition: "all 0.2s ease",
                        transform: saved ? "scale(1.1)" : "scale(1)",
                        flexShrink: 0,
                      }}
                    >
                      {saved ? "★" : "☆"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && articles.length > 0 && (
          <div style={{
            marginTop: 40, textAlign: "center", color: "#333",
            fontFamily: "'Space Mono', monospace", fontSize: 11,
            letterSpacing: 1,
          }}>
            {articles.length} articles from {SOURCES.length} sources
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        a:hover { color: #fff !important; }
        button:hover { color: #aaa !important; }
      `}</style>
    </div>
  );
}
