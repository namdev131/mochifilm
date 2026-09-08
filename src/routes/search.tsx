import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SEARCH_SOURCES, SOURCES, mergeMovies, searchMoviesMerged } from "@/lib/api";
import type { SourceFilter, SourceId } from "@/lib/types";

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
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/"
          className="inline-block rounded-lg text-sm text-pink-400 hover:underline focus-visible:outline-2 focus-visible:outline-pink-500"
        >
          ‹ Trang chủ
        </Link>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Tìm kiếm phim</h1>
        <form
          key={`${q}:${source}`}
          role="search"
          className="my-6 flex flex-wrap gap-3"
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
          <input
            type="search"
            name="q"
            defaultValue={q}
            aria-label="Từ khóa tìm kiếm"
            placeholder="Nhập tên phim..."
            className="min-w-0 flex-1 basis-full rounded-xl border border-white/10 bg-[#13131b] px-4 py-3 text-sm focus:outline-pink-500 sm:basis-auto"
          />
          <select
            name="source"
            defaultValue={source}
            aria-label="Nguồn phim"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#13131b] px-3 py-3 text-sm sm:flex-none"
          >
            <option value="all">Tất cả nguồn</option>
            {SOURCES.filter((item) => SEARCH_SOURCES.includes(item.id)).map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white hover:bg-pink-500"
          >
            Tìm kiếm
          </button>
        </form>
        <div role="status" aria-live="polite" className="mb-6 break-words text-sm text-zinc-400">
          {!q
            ? "Nhập từ khóa để tìm phim."
            : isPending
              ? `Đang tìm kiếm “${q}”…`
              : `${movies.length} kết quả đã tải cho “${q}”`}
        </div>
        {isError && (
          <div role="alert" className="mb-6 rounded-xl border border-pink-500/30 p-4 text-sm">
            Không tải được kết quả tìm kiếm.{" "}
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-pink-400 underline"
            >
              Thử lại
            </button>
          </div>
        )}
        {q && !isPending && !isError && movies.length === 0 && (
          <p className="py-12 text-center text-zinc-400">
            Không tìm thấy phim phù hợp. Thử từ khóa hoặc nguồn khác.
          </p>
        )}
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          aria-label="Kết quả tìm kiếm"
        >
          {movies.map((movie) => (
            <Link
              key={`${movie.source}:${movie.slug}`}
              to="/movie/$slug"
              params={{ slug: movie.slug }}
              search={{ source: movie.source || "kkphim" }}
              className="group min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-pink-500"
            >
              <div className="overflow-hidden rounded-xl bg-zinc-900">
                <img
                  src={movie.poster || movie.thumb || "/assets/mochi/mascot-mini.png"}
                  alt={movie.name}
                  loading="lazy"
                  className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <h2 className="mt-3 line-clamp-2 text-sm font-semibold group-hover:text-pink-400">
                {movie.name}
              </h2>
              <p className="mt-1 truncate text-xs text-zinc-400">
                {[movie.year, movie.quality, movie.lang].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-xs text-pink-400">{movie.source}</p>
            </Link>
          ))}
        </div>
        {q && hasNextPage && (
          <div className="mt-8 text-center">
            <button
              type="button"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
              className="rounded-xl border border-pink-500/30 px-6 py-3 text-sm font-semibold text-pink-400 hover:bg-pink-500/10 disabled:opacity-50"
            >
              {isFetchingNextPage ? "Đang tải…" : "Tải thêm kết quả"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
