import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Radio,
  ExternalLink,
  Calendar,
  RefreshCw,
  Newspaper,
  AlertTriangle,
  Search,
  ImageOff,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

type NewsCategory = 'MARKETS' | 'ECONOMY' | 'COMPANIES' | 'FOREX' | 'CRYPTO' | 'CENTRAL_BANKS';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  category: NewsCategory;
  description?: string;
  facts: string;
  imageUrl?: string | null;
  url: string;
  tags?: string[];
  aiInterpretation?: string;
}

interface NewsPayload {
  success?: boolean;
  news?: NewsItem[];
  stale?: boolean;
  timestamp?: number;
  error?: string;
}

const CATEGORY_ORDER: NewsCategory[] = ['MARKETS', 'ECONOMY', 'COMPANIES', 'FOREX', 'CRYPTO', 'CENTRAL_BANKS'];

/** Real provider image, with a coherent fallback when none is published. */
const NewsImage: React.FC<{ item: NewsItem; label: string; className?: string }> = ({ item, label, className = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [item.imageUrl]);

  if (item.imageUrl && !failed) {
    return (
      <img
        src={item.imageUrl}
        alt={item.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03] ${className}`}
      />
    );
  }

  return (
    <div className="w-full h-full min-h-[160px] bg-gradient-to-br from-slate-800 via-slate-900 to-[#0B0F17] flex flex-col items-center justify-center gap-2 px-4 text-center">
      <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
        <ImageOff className="w-5 h-5 text-orange-400" />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-300 line-clamp-1">{item.source}</span>
    </div>
  );
};

export const NewsPage: React.FC = () => {
  const { t, currentLang } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [category, setCategory] = useState<'ALL' | NewsCategory>('ALL');
  const [search, setSearch] = useState('');

  const locale = currentLang === 'fr' ? 'fr-FR' : currentLang === 'mg' ? 'mg-MG' : 'en-GB';

  const categoryLabels: Record<NewsCategory, string> = {
    MARKETS: t.extra.newsCategoryMarkets,
    ECONOMY: t.extra.newsCategoryEconomy,
    COMPANIES: t.extra.newsCategoryCompanies,
    FOREX: t.extra.newsCategoryForex,
    CRYPTO: t.extra.newsCategoryCrypto,
    CENTRAL_BANKS: t.extra.newsCategoryCentralBanks,
  };

  const formatDate = (value: string) => {
    if (!value) return t.extra.newsDateUnknown;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t.extra.newsDateUnknown;
    try {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return date.toISOString();
    }
  };

  const formatUpdated = (value: Date) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(value);
    } catch {
      return value.toISOString();
    }
  };

  const load = useCallback(async (options?: { manual?: boolean; silent?: boolean }) => {
    if (options?.manual) setRefreshing(true);
    else if (!options?.silent) setLoading(true);

    try {
      const response = await fetch(`/api/market/news${options?.manual ? '?refresh=1' : ''}`, {
        headers: { Accept: 'application/json' },
      });
      const data = (await response.json().catch(() => ({}))) as NewsPayload;

      if (response.ok && data.success && Array.isArray(data.news)) {
        setNews(data.news);
        setStale(data.stale === true);
        setHasError(false);
        setLastUpdated(
          typeof data.timestamp === 'number' && Number.isFinite(data.timestamp)
            ? new Date(data.timestamp)
            : new Date(),
        );
      } else {
        // Keep the last real snapshot if one exists; never substitute fake data.
        setHasError(true);
        setStale(true);
      }
    } catch {
      setHasError(true);
      setStale(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((item) => news.some((article) => article.category === item)),
    [news],
  );

  useEffect(() => {
    if (category !== 'ALL' && news.length > 0 && !availableCategories.includes(category)) {
      setCategory('ALL');
    }
  }, [availableCategories, category, news.length]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return news.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false;
      if (!term) return true;
      const haystack = [
        item.title,
        item.description || item.facts,
        item.source,
        ...(item.tags || []),
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [category, news, search]);

  const [featured, ...rest] = filtered;
  const showErrorState = hasError && news.length === 0;

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            {t.extra.newsBadge}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 break-words">{t.extra.newsTitle}</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">{t.extra.newsSubtitle}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] text-slate-500 font-mono">
            {lastUpdated && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-emerald-400" />
                {t.extra.newsUpdatedAt} {formatUpdated(lastUpdated)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-slate-500" />
              {t.extra.newsAutoRefreshNote}
            </span>
            {news.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Newspaper className="w-3 h-3 text-orange-400" />
                {news.length} {t.extra.newsCountLabel}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => load({ manual: true })}
          disabled={refreshing}
          className="self-start lg:self-auto shrink-0 p-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 text-xs font-semibold shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
          <span>{t.extra.newsRefresh}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="w-full min-w-0 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 w-max min-w-full">
            <button
              onClick={() => setCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                category === 'ALL'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.common.all}
            </button>
            {availableCategories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  category === item
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {categoryLabels[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.common.search}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Stale warning: the last real snapshot is still displayed. */}
      {stale && news.length > 0 && (
        <div className="max-w-7xl mx-auto flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t.extra.newsStaleNotice}</span>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-label={t.extra.newsLoading}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden animate-pulse ${
                  index === 0 ? 'md:col-span-2 xl:col-span-2' : ''
                }`}
              >
                <div className="aspect-[16/9] bg-slate-800/70" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-28 rounded bg-slate-800" />
                  <div className="h-5 w-4/5 rounded bg-slate-800" />
                  <div className="h-3 w-full rounded bg-slate-800/80" />
                  <div className="h-3 w-2/3 rounded bg-slate-800/80" />
                </div>
              </div>
            ))}
          </div>
        ) : showErrorState ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-base font-bold text-white mt-4">{t.extra.newsErrorTitle}</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">{t.extra.newsErrorBody}</p>
            <button
              onClick={() => load({ manual: true })}
              disabled={refreshing}
              className="mt-5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t.extra.newsRetry}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <Newspaper className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 mt-3">{t.extra.newsEmpty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featured && (
              <article className="group md:col-span-2 xl:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition-colors flex flex-col md:grid md:grid-cols-2 min-w-0">
                <div className="relative aspect-[16/9] md:aspect-auto md:h-full md:min-h-[260px] overflow-hidden bg-slate-950">
                  <NewsImage item={featured} label={t.extra.newsNoImage} />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500 text-white shadow-lg">
                    {categoryLabels[featured.category]}
                  </span>
                </div>
                <div className="p-5 sm:p-6 flex flex-col min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-semibold text-slate-300">{featured.source}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-slate-500 font-mono inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(featured.date)}
                    </span>
                  </div>

                  <a
                    href={featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3"
                  >
                    <h2 className="text-lg sm:text-2xl font-bold text-white leading-snug hover:text-orange-300 transition-colors break-words">
                      {featured.title}
                    </h2>
                  </a>

                  {(featured.description || featured.facts) && (
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-3 line-clamp-4">
                      {featured.description || featured.facts}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {(featured.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] text-slate-400 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-5">
                    <a
                      href={featured.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300"
                    >
                      {t.extra.newsReadArticle}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            )}

            {rest.map((item) => (
              <article
                key={item.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition-colors flex flex-col min-w-0"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                  <NewsImage item={item} label={t.extra.newsNoImage} />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/90 text-white shadow-lg">
                    {categoryLabels[item.category]}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-semibold text-slate-300">{item.source}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-slate-500 font-mono inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.date)}
                    </span>
                  </div>

                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mt-2.5">
                    <h2 className="text-base font-bold text-white leading-snug hover:text-orange-300 transition-colors line-clamp-3 break-words">
                      {item.title}
                    </h2>
                  </a>

                  {(item.description || item.facts) && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-2.5 line-clamp-3">
                      {item.description || item.facts}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(item.tags || []).slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] text-slate-400 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-800/70 mt-4">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-400 hover:text-orange-300"
                    >
                      {t.extra.newsReadArticle}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
