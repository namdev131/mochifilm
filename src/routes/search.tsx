import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SEARCH_SOURCES, SOURCES, mergeMovies, searchMoviesMerged } from "@/lib/api";
import type { SourceFilter, SourceId } from "@/lib/types";
import { ArrowLeft, Search as SearchIcon, SlidersHorizontal, RefreshCw } from "lucide-react";
import { MobileBottomDock } from "@/components/common/MobileBottomDock";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.replace(/\s+/g, " ").trim() : "",
    source: (SEARCH_SOURCES.includes(search.source as SourceId)
      ? search.source
      : "all") as SourceFilter,
  }),
  head: () => ({ meta: [{ title: "Tìm kiếm phim | Mochi Film" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q, source } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isPending, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ["search-results", q, source],
      queryFn: ({ pageParam }) => searchMoviesMerged(q, source, pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        const previous = new Set(
          pages
            .slice(0, -1)
            .flat()
            .map((movie) => `${movie.source}:${movie.slug}`),
        );
        return lastPage.some((movie) => !previous.has(`${movie.source}:${movie.slug}`))
          ? pages.length + 1
          : undefined;
      },
      enabled: Boolean(q),
      retry: 1,
    });
  const movies = mergeMovies(data?.pages || []);

  return (
    <div className="min-h-screen bg-[#09090d] text-zinc-100 font-sans selection:bg-pink-500 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between bg-[#09090d]/85 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-pink-400" />
            <span>Trang chủ</span>
          </Link>
        </div>

        <Link to="/" className="flex items-center">
          <img
            src="/assets/mochi/wordmark.webp"
            alt="Mochi Film"
            className="h-9 sm:h-11 w-auto object-contain drop-shadow-[0_4px_12px_rgba(255,79,131,0.2)]"
          />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 pb-24 lg:pb-12 space-y-6 sm:space-y-8">
        {/* Title Area */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
            Tìm kiếm phim
          </h1>
          <p className="font-hand text-pink-300 text-base sm:text-lg">
            Tìm kiếm phim bom tấn, anime, phim bộ trên toàn hệ thống máy chủ ♡
          </p>
        </div>

        {/* Search Input & Source Filter Form */}
        <form
          key={`${q}:${source}`}
          role="search"
          className="flex flex-wrap gap-2.5 sm:gap-3 p-2 rounded-2xl bg-[#12121a]/90 backdrop-blur-xl border border-white/[0.08] shadow-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void navigate({
              to: "/search",
              search: {
                q: String(form.get("q") || "").trim(),
                source: String(form.get("source")) as SourceFilter,
              },
            });
          }}
        >
          <div className="relative flex-1 basis-full sm:basis-auto min-w-0">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              aria-label="Từ khóa tìm kiếm"
              placeholder="Nhập tên phim, diễn viên, anime..."
              className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl border border-white/[0.08] bg-[#161016] text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition shadow-inner"
            />
          </div>

          <div className="relative flex items-center min-w-0 flex-1 sm:flex-none">
            <SlidersHorizontal className="absolute left-3.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <select
              name="source"
              defaultValue={source}
              aria-label="Nguồn phim"
              className="w-full h-11 sm:h-12 pl-9 pr-8 rounded-xl border border-white/[0.08] bg-[#161016] text-xs sm:text-sm font-semibold text-zinc-200 focus:outline-none focus:border-pink-500/60 transition cursor-pointer appearance-none"
            >
              <option value="all">Tất cả nguồn</option>
              {SOURCES.filter((item) => SEARCH_SOURCES.includes(item.id)).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="h-11 sm:h-12 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-xs sm:text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <SearchIcon className="w-4 h-4" />
            <span>Tìm kiếm</span>
          </button>
        </form>

        {/* Status indicator */}
        <div role="status" aria-live="polite" className="text-xs sm:text-sm text-zinc-400">
          {!q ? (
            "Nhập từ khóa và bấm Tìm kiếm để khám phá kho phim."
          ) : isPending ? (
            <span className="text-pink-400 animate-pulse">Đang tìm kiếm phim “{q}”…</span>
          ) : (
            <span>
              Tìm thấy <strong className="text-white font-bold">{movies.length}</strong> kết quả cho
              “<span className="text-pink-400 font-semibold">{q}</span>”
            </span>
          )}
        </div>

        {/* Error Notification */}
        {isError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center space-y-2 text-sm text-rose-300"
          >
            <p>Không tải được kết quả tìm kiếm từ máy chủ.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 text-pink-400 hover:underline font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {q && !isPending && !isError && movies.length === 0 && (
          <div className="py-16 text-center space-y-3 rounded-3xl border border-white/[0.06] bg-[#12121a]/50 p-8">
            <img
              src="/assets/mochi/mascot-mini.png"
              alt="Mochi Mascot"
              className="w-16 h-16 mx-auto opacity-70"
            />
            <p className="text-base font-bold text-zinc-200">Không tìm thấy phim phù hợp</p>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Thử tìm kiếm với tên phim tiếng Anh hoặc đổi nguồn phim ở bộ lọc phía trên.
            </p>
          </div>
        )}

        {/* Movies Grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
          aria-label="Kết quả tìm kiếm"
        >
          {movies.map((movie) => (
            <Link
              key={`${movie.source}:${movie.slug}`}
              to="/movie/$slug"
              params={{ slug: movie.slug }}
              search={{ source: movie.source || "kkphim" }}
              className="group rounded-2xl border border-white/[0.07] bg-[#12121a] hover:bg-[#181822] hover:border-pink-500/40 p-2.5 sm:p-3 transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] shadow-sm hover:shadow-lg hover:shadow-pink-500/10 cursor-pointer focus-visible:outline-2 focus-visible:outline-pink-500"
            >
              <div className="overflow-hidden rounded-xl bg-zinc-900 aspect-[2/3] relative">
                <img
                  src={movie.poster || movie.thumb || "/assets/mochi/mascot-mini.png"}
                  alt={movie.name}
                  loading="lazy"
                  className="aspect-[2/3] w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-pink-400 border border-white/10 uppercase">
                  {movie.source}
                </span>
              </div>

              <div className="pt-2.5">
                <h2 className="line-clamp-2 text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-pink-400 transition leading-snug">
                  {movie.name}
                </h2>
                <p className="mt-1 truncate text-[11px] text-zinc-400">
                  {[movie.year, movie.quality, movie.lang].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More Button */}
        {q && hasNextPage && (
          <div className="pt-4 text-center">
            <button
              type="button"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
              className="px-6 py-3 rounded-xl border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-xs sm:text-sm font-bold text-pink-400 transition cursor-pointer disabled:opacity-50"
            >
              {isFetchingNextPage ? "Đang tải thêm phim..." : "Tải thêm kết quả"}
            </button>
          </div>
        )}
      </main>

      {/* Unified Mobile Bottom Navigation Dock */}
      <MobileBottomDock />
    </div>
  );
}
