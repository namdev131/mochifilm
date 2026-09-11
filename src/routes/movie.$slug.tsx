import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { trailerEmbed } from "@/lib/trailer";
import { useQuery } from "@tanstack/react-query";
import type { SourceId, EpisodeServerItem, MovieCard } from "@/lib/types";
import { fetchDetail, fetchLatest, SOURCES } from "@/lib/api";
import { useConvexAuth, useMutation, useQuery as useConvexQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import "@/styles/details.css";
import { DetailSidebar } from "@/components/movie-detail/DetailSidebar";
import { DetailTopbar } from "@/components/movie-detail/DetailTopbar";
import { DetailHero } from "@/components/movie-detail/DetailHero";
import { DetailTabs, type DetailTabType } from "@/components/movie-detail/DetailTabs";
import { DetailContent } from "@/components/movie-detail/DetailContent";
import { DetailCast } from "@/components/movie-detail/DetailCast";
import { DetailComments } from "@/components/movie-detail/DetailComments";
import { DetailRecommendations } from "@/components/movie-detail/DetailRecommendations";
import { DetailMobileNav } from "@/components/movie-detail/DetailMobileNav";

export interface MovieSearchParams {
  source?: SourceId;
}

export const Route = createFileRoute("/movie/$slug")({
  validateSearch: (search: Record<string, unknown>): MovieSearchParams => ({
    source: (search.source as SourceId) || "kkphim",
  }),
  component: MovieDetailPage,
});

function MovieDetailPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const cloudFavorites = useConvexQuery(api.favorites.list, isAuthenticated ? {} : "skip");
  const setCloudFavorite = useMutation(api.favorites.set);
  const removeCloudFavorite = useMutation(api.favorites.remove);

  const currentSource: SourceId = search.source || "kkphim";

  // Toast notification
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1800);
  };

  // Fetch movie details
  const {
    data: sourceMovie,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["movieDetail", slug, currentSource],
    queryFn: () => fetchDetail(slug, currentSource),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { data: enrichment } = useQuery({
    queryKey: [
      "movieMetadata",
      slug,
      currentSource,
      sourceMovie?.origin_name || sourceMovie?.name,
      sourceMovie?.year,
      sourceMovie?.servers.length,
    ],
    enabled: Boolean(
      sourceMovie && ["single", "series", "tvshows"].includes(sourceMovie.type || ""),
    ),
    queryFn: async () => {
      const params = new URLSearchParams({ title: sourceMovie!.origin_name || sourceMovie!.name });
      if (sourceMovie!.year) params.set("year", String(sourceMovie!.year));
      params.set("type", sourceMovie!.type === "single" ? "movie" : "tv");
      const response = await fetch(`/api/movie-metadata?${params}`);
      if (!response.ok) throw new Error("Không tải được dữ liệu bổ sung");
      return response.json();
    },
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
  const extra = enrichment?.metadata;
  const movie =
    sourceMovie && extra
      ? {
          ...sourceMovie,
          trailer_url: sourceMovie.trailer_url || extra.trailer_url,
          vote_average: extra.vote_average,
          metadata_provider: extra.provider,
          metadata_url: extra.url,
          actors: extra.actors?.length ? extra.actors : sourceMovie.actors,
          director: extra.director?.length ? extra.director : sourceMovie.director,
          content: sourceMovie.content || extra.content,
          time: sourceMovie.time || extra.time,
          category: sourceMovie.category?.length ? sourceMovie.category : extra.category,
        }
      : sourceMovie;

  // Fetch recommendations from current source
  const { data: latestMovies = [] } = useQuery({
    queryKey: ["recommendations", currentSource],
    queryFn: () => fetchLatest(currentSource, 1),
    staleTime: 1000 * 60 * 5,
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<DetailTabType>("info");

  const handleTabChange = (tab: DetailTabType) => {
    setActiveTab(tab);
    const map: Record<DetailTabType, string> = {
      info: "infoPanel",
      cast: "castPanel",
      comments: "commentsPanel",
      suggested: "suggestedPanel",
    };
    const element = document.getElementById(map[tab]);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (isAuthenticated && cloudFavorites) {
      setIsFavorite(cloudFavorites.some((favorite) => favorite.slug === slug));
      return;
    }
    try {
      const favs = JSON.parse(localStorage.getItem("lv-favorites") || "[]");
      setIsFavorite(favs.some((favorite: MovieCard) => favorite.slug === slug));
    } catch {
      setIsFavorite(false);
    }
  }, [slug, isAuthenticated, cloudFavorites]);

  const toggleFavorite = async () => {
    if (!movie) return;
    try {
      if (isAuthenticated) {
        if (isFavorite) await removeCloudFavorite({ slug });
        else await setCloudFavorite({ slug, name: movie.name, poster: movie.poster, source: currentSource });
      } else {
        const favs: MovieCard[] = JSON.parse(localStorage.getItem("lv-favorites") || "[]");
        const next = isFavorite
          ? favs.filter((favorite) => favorite.slug !== slug)
          : [...favs, { slug: movie.slug, name: movie.name, origin_name: movie.origin_name, poster: movie.poster, thumb: movie.thumb, source: currentSource, year: movie.year, quality: movie.quality }];
        localStorage.setItem("lv-favorites", JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("lv-favorites-sync"));
      }
      setIsFavorite(!isFavorite);
      triggerToast(isFavorite ? "Đã bỏ khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích");
    } catch {
      triggerToast("Không thể cập nhật danh sách yêu thích");
    }
  };

  // Streaming & Episode Player
  const [activeEpisode, setActiveEpisode] = useState<EpisodeServerItem | null>(null);
  const [activeServerIndex, setActiveServerIndex] = useState<number>(0);
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState<number>(0);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);

  // Restore last watched episode and server if available in lv-progress
  useEffect(() => {
    if (!movie) return;
    try {
      const raw = localStorage.getItem("lv-progress") || "{}";
      const map = JSON.parse(raw);
      const prefix = `${currentSource}:${movie.slug}:`;
      const matchingKey = Object.keys(map).find((k) => k.startsWith(prefix));
      if (matchingKey) {
        const parts = matchingKey.split(":");
        const savedSrv = parseInt(parts[2], 10);
        const savedEp = parseInt(parts[3], 10);
        if (!isNaN(savedSrv)) setActiveServerIndex(savedSrv);
        if (!isNaN(savedEp)) setActiveEpisodeIndex(savedEp);
      }
    } catch {
      // ignore
    }
  }, [movie?.slug, currentSource]);

  const handleSelectEpisode = (ep: EpisodeServerItem, srvIdx: number, epIdx: number) => {
    if (!movie) return;
    const stream = ep.m3u8 || ep.embed;
    if (!stream) {
      triggerToast("Tập phim chưa có nguồn phát");
      return;
    }

    setActiveEpisode(ep);
    setActiveServerIndex(srvIdx);
    setActiveEpisodeIndex(epIdx);

    // Save to real watch progress in localStorage
    try {
      const raw = localStorage.getItem("lv-progress") || "{}";
      const map = JSON.parse(raw);
      const key = `${currentSource}:${movie.slug}:${srvIdx}:${epIdx}`;
      const existing = map[key];
      const pos = typeof existing?.position === "number" ? existing.position : 0;
      const dur = typeof existing?.duration === "number" ? existing.duration : 0;
      map[key] = {
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        thumb: movie.thumb || movie.poster,
        poster: movie.poster || movie.thumb,
        source: currentSource,
        ep: epIdx,
        srv: srvIdx,
        episode_name: ep.name,
        position: pos,
        duration: dur,
        updatedAt: Date.now(),
      };
      localStorage.setItem("lv-progress", JSON.stringify(map));
      window.dispatchEvent(new CustomEvent("lv-history-sync"));
    } catch {
      // ignore
    }

    // Chuyển thẳng sang trang video player chuyên biệt và kích hoạt loading animation
    if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
      (window as any).MochiLoader.showMovie(movie.name, currentSourceName);
    }
    navigate({
      to: "/watch/$slug",
      params: { slug: movie.slug },
      search: {
        source: currentSource,
        ep: epIdx,
        srv: srvIdx,
      },
    });
  };

  const handleWatchNow = () => {
    if (!movie) return;
    if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
      (window as any).MochiLoader.showMovie(movie.name, currentSourceName);
    }
    navigate({
      to: "/watch/$slug",
      params: { slug: movie.slug },
      search: {
        source: currentSource,
        ep: activeEpisodeIndex ?? 0,
        srv: activeServerIndex ?? 0,
      },
    });
  };

  const trailerDialog = useRef<HTMLDialogElement>(null);
  const [trailerSrc, setTrailerSrc] = useState<string | null>(null);
  const handleWatchTrailer = () => {
    const trailer = trailerEmbed(movie?.trailer_url);
    if (trailer) {
      setTrailerSrc(trailer);
      trailerDialog.current?.showModal();
    } else {
      triggerToast("Phim chưa có đoạn giới thiệu từ nguồn này");
    }
  };

  const handleWatchParty = () => {
    handleWatchNow();
  };

  const handleSourceChange = (newSource: SourceId) => {
    if (newSource === currentSource) return;
    const sourceObj = SOURCES.find((s) => s.id === newSource);
    triggerToast(`Đã chuyển nguồn sang ${sourceObj?.label || newSource}`);
    if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
      (window as any).MochiLoader.showMovie(movie?.name || slug, sourceObj?.label || newSource);
    }
    navigate({
      to: "/movie/$slug",
      params: { slug },
      search: { source: newSource },
    });
  };

  const currentSourceObj = SOURCES.find((s) => s.id === currentSource);
  const currentSourceName = currentSourceObj?.label || currentSource;

  // Kích hoạt Mochi Loading Animation khi tải dữ liệu chi tiết phim từ máy chủ
  useEffect(() => {
    if (isLoading) {
      const movieTitle = (movie as any)?.name || slug;
      (window as any).MochiLoader?.showMovie?.(movieTitle, currentSourceName);
    } else {
      (window as any).MochiLoader?.finishMovie?.();
    }
  }, [isLoading, (movie as any)?.name, slug, currentSourceName]);

  return (
    <div className="details-root">
      <dialog
        ref={trailerDialog}
        onClose={() => setTrailerSrc(null)}
        aria-label="Trailer phim"
        style={{
          margin: "auto",
          width: "min(900px, 95vw)",
          padding: 16,
          background: "#13131b",
          color: "white",
          borderRadius: 16,
        }}
      >
        <button type="button" autoFocus onClick={() => trailerDialog.current?.close()}>
          Đóng trailer
        </button>
        {trailerSrc && (
          <iframe
            src={trailerSrc}
            title={`Trailer ${movie?.name || "phim"}`}
            style={{ width: "100%", aspectRatio: "16/9", border: 0 }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </dialog>
      {/* Sidebar */}
      <DetailSidebar onShowToast={triggerToast} />

      {/* Main Content Area */}
      <main className="app">
        {/* Topbar */}
        <DetailTopbar onShowToast={triggerToast} />

        {isLoading ? (
          <div
            className="movie-loading-stage"
            style={{
              padding: "100px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 380,
            }}
          >
            <div className="mochi-loading-brand" style={{ marginBottom: 16 }}>
              <span className="mochi-loading-brand-dot" />
              Mochi Film
            </div>
            <div style={{ fontSize: 44, marginBottom: 12, animation: "pulse 2s infinite" }}>🎬</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              Đang tải thông tin phim...
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, maxWidth: 420 }}>
              Đang nạp dữ liệu chi tiết từ máy chủ {currentSourceName}
            </div>
          </div>
        ) : error || !movie ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 18,
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, marginBottom: 8, color: "#fff" }}>
              Không thể tải phim trên nguồn {currentSourceName}
            </h2>
            <p
              style={{ color: "var(--muted)", fontSize: 12, maxWidth: 500, margin: "0 auto 20px" }}
            >
              Máy chủ {currentSourceName} có thể chưa cập nhật tựa phim này hoặc đường truyền đang
              bận. Vui lòng thử chuyển sang nguồn phim khác.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {SOURCES.filter((s) => s.id !== currentSource).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="btn"
                  onClick={() => handleSourceChange(s.id)}
                >
                  Chuyển sang {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Hero Details Section */}
            <DetailHero
              movie={movie}
              isFavorite={isFavorite}
              currentSource={currentSource}
              activeServerIndex={activeServerIndex}
              activeEpisodeIndex={activeEpisodeIndex}
              onToggleFavorite={toggleFavorite}
              onWatchNow={handleWatchNow}
              onWatchTrailer={handleWatchTrailer}
              onWatchParty={handleWatchParty}
            />

            {/* Navigation Tabs */}
            <DetailTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Content Grid (Description + Facts + Player vs Cast + Comments) */}
            <section className="content-grid">
              <DetailContent
                movie={movie}
                activeEpisode={activeEpisode}
                activeServerIndex={activeServerIndex}
                activeEpisodeIndex={activeEpisodeIndex}
                activeStreamUrl={activeStreamUrl}
                onSelectEpisode={handleSelectEpisode}
                onClosePlayer={() => setActiveStreamUrl(null)}
              />

              <div>
                <DetailCast actors={movie.actors} />
                <DetailComments movieSlug={movie.slug} onShowToast={triggerToast} />
              </div>
            </section>

            {/* Recommendations Section */}
            <DetailRecommendations
              movies={latestMovies.filter((m) => m.slug !== slug)}
              currentSource={currentSource}
              onShowToast={triggerToast}
            />
          </>
        )}
      </main>

      {/* Mobile Floating Bottom Bar */}
      <DetailMobileNav onShowToast={triggerToast} />

      {/* Toast popup */}
      <div className={`toast ${showToast ? "show" : ""}`} id="toast">
        {toastMessage}
      </div>
    </div>
  );
}
