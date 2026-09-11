import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Film, Sparkles, User, RefreshCw, Calendar, MapPin } from "lucide-react";
import { MobileBottomDock } from "@/components/common/MobileBottomDock";

export const Route = createFileRoute("/actor")({
  validateSearch: (s: Record<string, unknown>) => ({
    name: typeof s.name === "string" ? s.name.slice(0, 120) : "",
    id: typeof s.id === "string" && /^\d+$/.test(s.id) ? s.id : "",
  }),
  head: () => ({ meta: [{ title: "Hồ sơ diễn viên | Mochi Film" }] }),
  component: ActorPage,
});

function ActorPage() {
  const { name, id } = Route.useSearch();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["actor", name, id],
    queryFn: async () => {
      const r = await fetch(`/api/actor?${new URLSearchParams({ name, id })}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Không tải được diễn viên");
      return j;
    },
    retry: false,
  });

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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 pb-24 lg:pb-12 space-y-8">
        {/* Title Area */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-pink-400">
            <User className="w-4 h-4" />
            <span className="text-xs uppercase font-bold tracking-wider">Hồ sơ diễn viên</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
            {data?.actor?.name || name || "Diễn viên"}
          </h1>
          <p className="font-hand text-pink-300 text-base sm:text-lg">
            Thông tin chi tiết & các tác phẩm điện ảnh xuất sắc ♡
          </p>
        </div>

        {/* Loading State */}
        {isPending && (
          <div className="rounded-3xl border border-white/10 bg-[#12121a]/80 p-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-400 font-medium">Đang tải hồ sơ diễn viên...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3"
          >
            <p className="text-sm text-rose-300">{error.message}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {/* Candidates Selector (if multiple matching actors) */}
        {data?.candidates && (
          <section className="space-y-4 rounded-3xl border border-white/[0.08] bg-[#12121a]/80 p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Chọn đúng diễn viên để xem hồ sơ:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {data.candidates.map((a: any) => (
                <Link
                  key={a.id}
                  to="/actor"
                  search={{ name: a.name, id: String(a.id) }}
                  className="group rounded-2xl border border-white/[0.07] hover:border-pink-500/50 bg-[#171016] p-2.5 transition duration-200 text-center flex flex-col items-center hover:scale-105"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2">
                    {a.image ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${a.image}`}
                        alt={a.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-pink-400 line-clamp-2">
                    {a.name}
                  </span>
                </Link>
              ))}
            </div>
            {!data.candidates.length && (
              <p className="text-sm text-zinc-400 py-4 text-center">
                Không tìm thấy diễn viên phù hợp.
              </p>
            )}
          </section>
        )}

        {/* Actor Profile Section */}
        {data?.actor && (
          <>
            <section className="rounded-3xl border border-white/[0.08] bg-[#12121a]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              {data.actor.image ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${data.actor.image}`}
                  alt={data.actor.name}
                  className="w-32 sm:w-44 aspect-[3/4] object-cover rounded-2xl ring-2 ring-pink-500/30 shadow-lg shadow-pink-500/10 shrink-0"
                />
              ) : (
                <div className="w-32 sm:w-44 aspect-[3/4] rounded-2xl bg-zinc-900 ring-2 ring-white/10 flex items-center justify-center shrink-0 text-zinc-600">
                  <User className="w-12 h-12" />
                </div>
              )}

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    {data.actor.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                    {data.actor.birthday && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.07]">
                        <Calendar className="w-3.5 h-3.5 text-pink-400" />
                        {data.actor.birthday}
                      </span>
                    )}
                    {data.actor.birthplace && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.07]">
                        <MapPin className="w-3.5 h-3.5 text-pink-400" />
                        {data.actor.birthplace}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">
                    Tiểu sử
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed max-h-48 overflow-y-auto pr-2 whitespace-pre-line no-scrollbar">
                    {data.actor.biography ||
                      "Chưa có thông tin tiểu sử tiếng Việt cho diễn viên này."}
                  </p>
                </div>
              </div>
            </section>

            {/* Filmography Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
                    <Film className="w-5 h-5 text-pink-400" />
                    <span>Phim đã tham gia ({data.movies.length})</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Bấm vào phim để tìm nguồn xem vietsub trên Mochi Film
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {data.movies.map((m: any, i: number) => (
                  <Link
                    key={`${m.type}:${m.id}:${i}`}
                    to="/search"
                    search={{ q: m.original || m.title, source: "all" }}
                    className="group rounded-2xl border border-white/[0.07] bg-[#12121a] hover:bg-[#181822] hover:border-pink-500/40 p-2.5 transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] shadow-sm hover:shadow-lg hover:shadow-pink-500/10 cursor-pointer"
                  >
                    <div className="overflow-hidden rounded-xl bg-zinc-900 aspect-[2/3] relative">
                      {m.poster ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${m.poster}`}
                          alt={m.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Film className="w-8 h-8" />
                        </div>
                      )}
                      {m.year && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/10">
                          {m.year}
                        </span>
                      )}
                    </div>

                    <div className="pt-2.5">
                      <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-pink-400 transition leading-snug">
                        {m.title}
                      </h3>
                      {m.character && (
                        <p className="mt-1 truncate text-[11px] text-zinc-400">
                          Vai: {m.character}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="pt-6 border-t border-white/[0.06] text-center text-xs text-zinc-500">
          Dữ liệu diễn viên và phim từ TMDB. Website không lưu trữ video trực tiếp.
        </footer>
      </main>

      {/* Unified Mobile Bottom Navigation Dock */}
      <MobileBottomDock />
    </div>
  );
}
