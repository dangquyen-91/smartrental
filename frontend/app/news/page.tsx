'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import { cn } from '@/lib/utils';
import { gsap } from 'gsap';

const RSS_FEEDS = [
  {
    name: 'VnExpress BĐS',
    url: 'https://vnexpress.net/rss/kinh-doanh-bat-dong-san.rss',
    favicon: 'https://vnexpress.net/favicon.ico',
  },
  {
    name: 'Dân trí BĐS',
    url: 'https://dantri.com.vn/rss/bat-dong-san.rss',
    favicon: 'https://dantri.com.vn/favicon.ico',
  },
  {
    name: 'Zing News',
    url: 'https://zingnews.vn/rss/home.rss',
    favicon: 'https://static-zingnews.zadn.vn/version-3.7.22/images/icon_zing_new.png',
  },
];

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json';

interface RssItem {
  title: string;
  link: string;
  thumbnail: string;
  pubDate: string;
  description: string;
  author: string;
  source: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Vừa xong';
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-[#e8e8e8]" />
      <div className="p-5">
        <div className="h-4 bg-[#e8e8e8] rounded w-1/3 mb-3" />
        <div className="h-5 bg-[#e8e8e8] rounded w-full mb-2" />
        <div className="h-5 bg-[#e8e8e8] rounded w-2/3 mb-4" />
        <div className="h-3 bg-[#e8e8e8] rounded w-full mb-2" />
        <div className="h-3 bg-[#e8e8e8] rounded w-3/4" />
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<RssItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );
  }, []);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        RSS_FEEDS.map(async (feed) => {
          const res = await fetch(
            `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(feed.url)}&count=10`
          );
          if (!res.ok) return [];
          const data = await res.json();
          if (data.status !== 'ok') return [];
          return (data.items ?? []).map((item: any) => ({
            ...item,
            source: feed.name,
          }));
        })
      );

      const merged = results
        .flat()
        .filter((a) => a.title && a.link)
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      setArticles(merged);
    } catch {
      setError('Không thể tải tin tức. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'vnexpress', label: 'VnExpress' },
    { id: 'dantri', label: 'Dân trí' },
    { id: 'zing', label: 'Zing' },
  ];

  const filtered =
    activeCategory === 'all'
      ? articles
      : articles.filter((a) => {
          if (activeCategory === 'vnexpress') return a.source === 'VnExpress BĐS';
          if (activeCategory === 'dantri') return a.source === 'Dân trí BĐS';
          if (activeCategory === 'zing') return a.source === 'Zing News';
          return true;
        });

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <PublicNavbar activeLink="news" />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-white py-20 px-4 md:px-10">
          <div className="mx-auto text-center" style={{ maxWidth: '768px' }}>
            <span className="inline-block px-4 py-1.5 bg-[#ffef3d] text-[#676000] text-xs font-bold rounded-full mb-6 uppercase tracking-wider">
              Tin tức
            </span>
            <h1 ref={headingRef} className="text-3xl md:text-5xl font-bold text-[#191c1d] mb-6 leading-tight opacity-0">
              Tin tức bất động sản<br />cập nhật liên tục
            </h1>
            <p className="text-[#4a4733] text-lg leading-relaxed max-w-2xl mx-auto">
              Tổng hợp tin tức từ các nguồn uy tín: thị trường, chính sách,
              xu hướng và nhận định chuyên gia.
            </p>
          </div>
        </section>

        {/* ── Category filter ── */}
        <section className="px-4 md:px-10 bg-white border-b border-[#e8e8e8]">
          <div className="mx-auto" style={{ maxWidth: '1280px' }}>
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all',
                    activeCategory === cat.id
                      ? 'bg-[#ffef3d] text-[#1f1c00] shadow-sm'
                      : 'bg-[#f3f4f5] text-[#4a4733] hover:bg-[#e8e8e8]',
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── News grid ── */}
        <section className="py-10 px-4 md:px-10">
          <div className="mx-auto" style={{ maxWidth: '1280px' }}>

            {/* Refresh button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={fetchNews}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#676000] bg-[#ffef3d] rounded-full hover:shadow-md transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Làm mới
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#f3f4f5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#c1c1c1] text-3xl">error</span>
                </div>
                <p className="text-base font-semibold text-[#191c1d] mb-2">{error}</p>
                <button
                  onClick={fetchNews}
                  className="px-6 py-2 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-md transition-all"
                >
                  Thử lại
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#f3f4f5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#c1c1c1] text-3xl">newspaper</span>
                </div>
                <p className="text-base font-semibold text-[#191c1d] mb-2">Không có tin tức nào</p>
                <p className="text-sm text-[#4a4733]">Thử chọn nguồn khác hoặc làm mới trang.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filtered.map((article, i) => (
                  <a
                    key={`${article.link}-${i}`}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="h-48 overflow-hidden bg-[#f3f4f5] shrink-0">
                      {article.thumbnail && article.thumbnail.startsWith('http') ? (
                        <img
                          src={article.thumbnail}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#c1c1c1] text-5xl">image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-[#676000] bg-[#ffef3d] px-2 py-0.5 rounded-full">
                          {article.source}
                        </span>
                        <span className="text-xs text-[#4a4733]">
                          {formatRelativeTime(article.pubDate)}
                        </span>
                      </div>

                      <h3 className="text-[15px] font-bold text-[#191c1d] leading-snug mb-3 line-clamp-3 group-hover:text-[#676000] transition-colors">
                        {article.title}
                      </h3>

                      {article.description && (
                        <p className="text-xs text-[#4a4733] leading-relaxed line-clamp-3 flex-1">
                          {stripHtml(article.description)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
