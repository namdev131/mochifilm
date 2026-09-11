import { useCallback, useEffect, useRef, useState } from "react";
import { useAppAuth } from "@/lib/auth-data-provider";
import "@/styles/mochi-loading.css";

const CELL_W = 192;
const CELL_H = 208;
const WAITING = { row: 6, frames: 6, fps: 5 };
const ATLAS_URL = "/assets/mochi/loading-atlas.png";
const defaultStatus = (name: string) => `Đang chuẩn bị phim, ${name} chờ Mochi một chút nha...`;

function getUserName() {
  if (typeof window === "undefined") return "bạn";
  try {
    const user =
      (window as any).Clerk?.user ||
      (window as any).MochiAuth?.getCurrentUser?.() ||
      (window as any).MochiAuth?.currentUser ||
      (window as any).currentUser ||
      JSON.parse(localStorage.getItem("mochi_user") || "null");
    return user?.firstName || user?.name || user?.displayName || user?.username || "bạn";
  } catch {
    return "bạn";
  }
}

export const MochiLoadingScreen = () => {
  const { user, isLoading } = useAppAuth();
  const [visible, setVisible] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [title, setTitle] = useState("Mochi đang chờ bạn 🍿");
  const [status, setStatus] = useState(defaultStatus("bạn"));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(0);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshUser = useCallback((nextName = getUserName()) => {
    const userName = nextName || "bạn";
    setTitle(`Mochi đang chờ ${userName} 🍿`);
  }, []);

  const show = useCallback(
    (message?: string) => {
      if (stopRef.current) clearTimeout(stopRef.current);
      setRemoved(false);
      setVisible(true);
      const userName = getUserName();
      setStatus(message || defaultStatus(userName));
      refreshUser(userName);
    },
    [refreshUser],
  );

  const hide = useCallback(() => {
    setVisible(false);
    stopRef.current = setTimeout(() => setRemoved(true), 350);
  }, []);

  useEffect(() => {
    refreshUser();
    const initialTimeout = setTimeout(hide, 2800);
    return () => clearTimeout(initialTimeout);
  }, [hide, refreshUser]);

  useEffect(() => {
    if (isLoading) return;
    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "bạn";
    refreshUser(userName);
    setStatus(defaultStatus(userName));
  }, [isLoading, refreshUser, user]);

  useEffect(() => {
    if (removed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const atlas = new Image();
    let frame = 0;
    let last = 0;
    let running = true;

    const render = (now: number) => {
      if (!running) return;
      if (!last) last = now;
      if (now - last >= 1000 / WAITING.fps) {
        frame = (frame + 1) % WAITING.frames;
        last = now;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (atlas.complete && atlas.naturalWidth) {
        context.drawImage(
          atlas,
          frame * CELL_W,
          WAITING.row * CELL_H,
          CELL_W,
          CELL_H,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }
      animationRef.current = requestAnimationFrame(render);
    };

    atlas.src = ATLAS_URL;
    animationRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [removed]);

  useEffect(() => {
    (window as any).MochiLoader = {
      show,
      showMovie: (_movieName?: string, sourceName?: string) =>
        show(
          sourceName
            ? `Đang chuẩn bị phim từ máy chủ ${sourceName}...`
            : defaultStatus(getUserName()),
        ),
      hide,
      finish: hide,
      finishMovie: hide,
      setText: (message: string) => setStatus(message || ""),
      setTitle: (message: string) => setTitle(message || ""),
      setUserName: refreshUser,
      refreshUser,
      getUserName,
    };

    const handleUserChanged = (event: Event) => {
      const user = (event as CustomEvent).detail;
      refreshUser(user?.firstName || user?.name || user?.displayName || user?.username);
    };
    const handleStartMovie = (event: Event) => {
      const { source } = (event as CustomEvent).detail || {};
      (window as any).MochiLoader.showMovie(undefined, source);
    };

    window.addEventListener("mochi:user-changed", handleUserChanged);
    window.addEventListener("mochi:load-movie", handleStartMovie);
    window.addEventListener("mochi:movie-ready", hide);
    return () => {
      window.removeEventListener("mochi:user-changed", handleUserChanged);
      window.removeEventListener("mochi:load-movie", handleStartMovie);
      window.removeEventListener("mochi:movie-ready", hide);
      if (stopRef.current) clearTimeout(stopRef.current);
    };
  }, [hide, refreshUser, show]);

  if (removed) return null;

  return (
    <div id="mochiLoading" className={visible ? "" : "hidden"} role="status" aria-live="polite">
      <div className="mochi-loading-grid" />
      <div className="mochi-loading-glow" />
      <main className="mochi-loading-card">
        <div className="mochi-loading-brand">
          <span className="mochi-loading-brand-mark" aria-hidden="true">
            ▶
          </span>
          <strong>
            Mochi <span>Film</span>
          </strong>
        </div>
        <div className="mochi-loading-pet-stage">
          <canvas
            ref={canvasRef}
            id="petCanvas"
            width={384}
            height={416}
            aria-label="Mochi đang chờ"
          />
        </div>
        <h1 className="mochi-loading-title">{title}</h1>
        <p className="mochi-loading-desc">{status}</p>

        <div className="mochi-loading-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="mochi-loading-track" aria-hidden="true">
          <span />
        </div>
        <div className="mochi-loading-tip">Good movies, better days · Mochi Film</div>
      </main>
    </div>
  );
};
