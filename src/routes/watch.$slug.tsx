import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SourceId, EpisodeServerItem, MovieCard } from "@/lib/types";
import { fetchDetail, fetchLatest, SOURCES } from "@/lib/api";

import "@/styles/player.css";
import "@/styles/player-controls.css";
import { PlayerSidebar } from "@/components/player/PlayerSidebar";
import { PlayerTopbar } from "@/components/player/PlayerTopbar";
import { PlayerRightbar } from "@/components/player/PlayerRightbar";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PlayerPanels } from "@/components/player/PlayerPanels";
import { PlayerMobileNav } from "@/components/player/PlayerMobileNav";

export interface WatchSearchParams {
  source?: SourceId;
  ep?: number;
  srv?: number;
}

export const Route = createFileRoute("/watch/$slug")({
  validateSearch: (search: Record<string, unknown>): WatchSearchParams => ({
    source: (search.source as SourceId) || "kkphim",
    ep:
      typeof search.ep === "number"
        ? search.ep
        : typeof search.ep === "string"
          ? parseInt(search.ep, 10) || 0
          : 0,
    srv:
      typeof search.srv === "number"
        ? search.srv
        : typeof search.srv === "string"
          ? parseInt(search.srv, 10) || 0
          : 0,
  }),
  component: WatchPlayerPage,
});

function WatchPlayerPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const currentSource: SourceId = search.source || "kkphim";
  const epIndex = search.ep ?? 0;
  const srvIndex = search.srv ?? 0;

  // Toast
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

  // Movie details query
  const {
    data: movie,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["movieDetail", slug, currentSource],
    queryFn: () => fetchDetail(slug, currentSource),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Recommendations query
  const { data: latestMovies = [] } = useQuery({
    queryKey: ["recommendations", currentSource],
    queryFn: () => fetchLatest(currentSource, 1),
    staleTime: 1000 * 60 * 5,
  });

  // Active episode calculation
  const currentServer = movie?.servers?.[srvIndex] || movie?.servers?.[0] || null;
  const currentEp: EpisodeServerItem | null =
    currentServer?.items?.[epIndex] || currentServer?.items?.[0] || null;
  const streamUrl: string | null = currentEp?.m3u8 || currentEp?.embed || null;

  // Favorites state synced with localStorage
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lv-favorites") || "[]";
      const favs = JSON.parse(raw);
      setIsFavorite(favs.some((f: any) => f.slug === slug));
    } catch {
      // ignore
    }
  }, [slug]);

  const toggleFavorite = () => {
    if (!movie) return;
    try {
      const raw = localStorage.getItem("lv-favorites") || "[]";
      let favs: MovieCard[] = JSON.parse(raw);
      const exists = favs.some((f) => f.slug === slug);
      if (exists) {
        favs = favs.filter((f) => f.slug !== slug);
        setIsFavorite(false);
        triggerToast("Đã bỏ khỏi yêu thích");
      } else {
        favs.push({
          slug: movie.slug,
          name: movie.name,
          origin_name: movie.origin_name,
          poster: movie.poster,
          thumb: movie.thumb,
          source: currentSource,
          year: movie.year,
          quality: movie.quality,
        });
        setIsFavorite(true);
        triggerToast("Đã thêm vào yêu thích");
      }
      localStorage.setItem("lv-favorites", JSON.stringify(favs));
      window.dispatchEvent(new CustomEvent("lv-favorites-sync"));
    } catch {
      triggerToast("Không thể cập nhật danh sách yêu thích");
    }
  };

  // Initial position from lv-progress
  const [initialPosition, setInitialPosition] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lv-progress") || "{}";
      const map = JSON.parse(raw);
      const key = `${currentSource}:${slug}:${srvIndex}:${epIndex}`;
      const savedPos = map[key]?.position;
      if (typeof savedPos === "number" && savedPos > 0) {
        setInitialPosition(savedPos);
      } else {
        setInitialPosition(0);
      }
    } catch {
      setInitialPosition(0);
    }
  }, [slug, currentSource, srvIndex, epIndex]);

  // Synchronize and record watch history when movie and episode load (real data, zero mock numbers)
  useEffect(() => {
    if (!movie || !currentEp) return;
    try {
      const raw = localStorage.getItem("lv-progress") || "{}";
      const map = JSON.parse(raw);
      const key = `${currentSource}:${movie.slug}:${srvIndex}:${epIndex}`;
      const existing = map[key];
      // Keep existing real progress or start at 0; never fabricate fake 60s or 2700s
      const pos = typeof existing?.position === "number" ? existing.position : 0;
      const dur = typeof existing?.duration === "number" ? existing.duration : 0;
      map[key] = {
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        thumb: movie.thumb || movie.poster,
        poster: movie.poster || movie.thumb,
        source: currentSource,
        ep: epIndex,
        srv: srvIndex,
        episode_name: currentEp.name,
        position: pos,
        duration: dur,
        updatedAt: Date.now(),
      };
      localStorage.setItem("lv-progress", JSON.stringify(map));
      window.dispatchEvent(new CustomEvent("lv-history-sync"));
    } catch {
      // ignore
    }
  }, [movie?.slug, currentEp?.name, currentSource, srvIndex, epIndex]);

  // Real watch progress updates as video plays (throttled & debounced from HTMLVideoElement)
  const lastSavedSecRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentProgressRef = useRef<{ cur: number; dur: number }>({ cur: 0, dur: 0 });

  const persistProgress = (currSec: number, totalSec: number) => {
    if (!movie || !currentEp) return;
    const cur = Math.max(0, Math.floor(isFinite(currSec) && !isNaN(currSec) ? currSec : 0));
    const dur = Math.max(0, Math.floor(isFinite(totalSec) && !isNaN(totalSec) ? totalSec : 0));

    try {
      const raw = localStorage.getItem("lv-progress") || "{}";
      const map = JSON.parse(raw);
      const key = `${currentSource}:${movie.slug}:${srvIndex}:${epIndex}`;
      const existing = map[key];
      // Real duration from HTMLVideoElement if available; otherwise preserve existing duration, never fake it
      const finalDur = dur > 0 ? dur : (typeof existing?.duration === "number" ? existing.duration : 0);

      map[key] = {
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        thumb: movie.thumb || movie.poster,
        poster: movie.poster || movie.thumb,
        source: currentSource,
        ep: epIndex,
        srv: srvIndex,
        episode_name: currentEp.name,
        position: cur,
        duration: finalDur,
        updatedAt: Date.now(),
      };
      localStorage.setItem("lv-progress", JSON.stringify(map));
      window.dispatchEvent(new CustomEvent("lv-history-sync"));
      lastSavedSecRef.current = cur;
    } catch {
      // ignore
    }
  };

  const handleTimeProgress = (currSec: number, totalSec: number) => {
    if (!movie || !currentEp) return;
    if (isNaN(currSec) || !isFinite(currSec)) return;

    currentProgressRef.current = { cur: currSec, dur: totalSec };

    const diff = Math.abs(currSec - lastSavedSecRef.current);
    // Throttle: save immediately if position changed by >= 3 seconds or video finished
    if (diff >= 3 || (totalSec > 0 && currSec >= totalSec - 1)) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      persistProgress(currSec, totalSec);
    } else {
      // Debounce trailing updates
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        persistProgress(currSec, totalSec);
      }, 2000);
    }
  };

  // Flush any pending progress before unmounting or switching episodes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        const { cur, dur } = currentProgressRef.current;
        if (cur > 0) {
          persistProgress(cur, dur);
        }
      }
    };
  }, [movie?.slug, currentEp?.name, currentSource, srvIndex, epIndex]);

  // Player Display Modes: Theater & Lights Out
  const [isLightsOut, setIsLightsOut] = useState(false);
  const [isTheater, setIsTheater] = useState(false);

  const toggleLights = () => {
    setIsLightsOut((prev) => {
      const next = !prev;
      triggerToast(next ? "Đã tắt đèn" : "Đã bật đèn");
      return next;
    });
  };

  const toggleTheater = () => {
    setIsTheater((prev) => {
      const next = !prev;
      triggerToast(next ? "Đã chuyển chế độ rạp" : "Đã thoát chế độ rạp");
      return next;
    });
  };


  const currentSourceObj = SOURCES.find((s) => s.id === currentSource);
  const currentSourceName = currentSourceObj?.label || currentSource;

  // Kích hoạt Mochi Loading Animation khi tải luồng phát và dữ liệu từ máy chủ
  useEffect(() => {
    if (isLoading) {
      const movieTitle = (movie as any)?.name || slug;
      (window as any).MochiLoader?.showMovie?.(movieTitle, currentSourceName);
    } else {
      (window as any).MochiLoader?.finishMovie?.();
    }
  }, [isLoading, (movie as any)?.name, slug, currentSourceName]);

  return (
    <div
      className={`player-page-root ${isLightsOut ? "lights-out" : ""} ${
        isTheater ? "theater" : ""
      }`}
    >
      {/* Sidebar */}
      <PlayerSidebar onShowToast={triggerToast} />

      {/* Main Content Area */}
      <main className="app">
        {/* Topbar */}
        <PlayerTopbar
          onShowToast={triggerToast}
        />

        {isLoading ? (
          <div
            className="player-loading-stage"
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
              Đang khởi động trình phát...
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, maxWidth: 420 }}>
              Đang nạp luồng video từ máy chủ {currentSourceName}
            </div>
          </div>
        ) : error || !movie ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: 18,
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, marginBottom: 8, color: "#fff" }}>
              Không thể tải phim trên nguồn {currentSourceName}
            </h2>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 12,
                maxWidth: 500,
                margin: "0 auto 20px",
              }}
            >
              Máy chủ hiện tại có thể chưa cập nhật tựa phim này hoặc đường truyền đang bận.
              Vui lòng thử lại sau.
            </p>
            <button type="button" className="btn primary" onClick={() => refetch()}>
              ↻ Thử lại
            </button>
            <div>
              <Link to="/" style={{ color: "var(--pink)", fontSize: 13, textDecoration: "none" }}>
                ← Quay lại trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Player Shell & Controls */}
            <PlayerControls
              movie={movie}
              activeEpisode={currentEp}
              activeStreamUrl={streamUrl}
              servers={movie.servers}
              activeServerIndex={srvIndex}
              activeEpisodeIndex={epIndex}
              onSelectEpisode={(srv, ep) => {
                navigate({
                  to: "/watch/$slug",
                  params: { slug },
                  search: { source: currentSource, srv, ep },
                });
                triggerToast(
                  `Chuyển sang ${movie.servers?.[srv]?.items?.[ep]?.name || `Tập ${ep + 1}`}`
                );
              }}
              providerId={currentSource}
              onChangeProvider={(newProv) => {
                navigate({
                  to: "/watch/$slug",
                  params: { slug },
                  search: { source: newProv, srv: 0, ep: 0 },
                });
                triggerToast(`Đang chuyển sang kho phim ${newProv.toUpperCase()}`);
              }}
              isFavorite={isFavorite}
              isLightsOut={isLightsOut}
              isTheater={isTheater}
              onToggleFavorite={toggleFavorite}
              onToggleLights={toggleLights}
              onToggleTheater={toggleTheater}
              onShowToast={triggerToast}
              onTimeProgress={handleTimeProgress}
              initialPosition={initialPosition}
            />

            {/* Rightbar: episodes beside on desktop; stacked vertically on mobile */}
            <PlayerRightbar
              movieName={movie.name}
              movieLang={movie.lang}
              servers={movie.servers}
              activeServerIndex={srvIndex}
              activeEpisodeIndex={epIndex}
              onSelectEpisode={(srv, ep) => {
                navigate({
                  to: "/watch/$slug",
                  params: { slug },
                  search: { source: currentSource, srv, ep },
                });
                triggerToast(
                  `Chuyển sang ${movie.servers?.[srv]?.items?.[ep]?.name || `Tập ${ep + 1}`}`
                );
              }}
              providerId={currentSource}
              onChangeProvider={(newProv) => {
                navigate({
                  to: "/watch/$slug",
                  params: { slug },
                  search: { source: newProv, srv: 0, ep: 0 },
                });
                triggerToast(`Đang chuyển sang kho phim ${newProv.toUpperCase()}`);
              }}
              onShowToast={triggerToast}
            />

            {/* Synopsis, Shortcuts, Comments, Recommendations */}
            <PlayerPanels
              synopsis={movie.content || ""}
              movieSlug={movie.slug}
              recommendations={latestMovies.filter((m) => m.slug !== slug)}
              currentSource={currentSource}
              onShowToast={triggerToast}
            />
          </>
        )}


      </main>

      {/* Mobile Navigation */}
      <PlayerMobileNav onShowToast={triggerToast} />

      {/* Toast Notification */}
      <div className={`toast ${showToast ? "show" : ""}`} id="toast">
        {toastMessage}
      </div>
    </div>
  );
}
