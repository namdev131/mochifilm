import React, { useEffect, useRef, useState, useCallback } from "react";
import "@/styles/mochi-loading.css";

const CELL_W = 192;
const CELL_H = 208;
const SCALE = 2;
const SPRITESHEET_URL = "/assets/mochi/pet-spritesheet.png";

interface StateDef {
  row: number;
  frames: number;
  fps: number;
}

const states: Record<string, StateDef> = {
  idle: { row: 0, frames: 6, fps: 4.2 },
  runningRight: { row: 1, frames: 8, fps: 8.2 },
  runningLeft: { row: 2, frames: 8, fps: 8.2 },
  waving: { row: 3, frames: 4, fps: 5.2 },
  jumping: { row: 4, frames: 5, fps: 6.2 },
  failed: { row: 5, frames: 8, fps: 5.4 },
  waiting: { row: 6, frames: 6, fps: 4.4 },
  working: { row: 7, frames: 6, fps: 7.2 },
  review: { row: 8, frames: 6, fps: 4.8 },
};

// Chuỗi giai đoạn chào mừng khi mới vào web
const initialPhases = [
  {
    max: 14,
    state: "waving",
    title: "Mochi đang chào {name}",
    desc: "Bé Mochi vừa tới rạp và đang chào {name} nè.",
    bubble: "Mochi tới rồi nè, {name} ♡",
  },
  {
    max: 38,
    state: "runningRight",
    title: "Đang chạy đi chuẩn bị",
    desc: "Mochi đang lon ton mở các khu vực của website.",
    bubble: "Chạy nhanh nào~",
  },
  {
    max: 74,
    state: "working",
    title: "Đang chuẩn bị phim",
    desc: "Đang tải dữ liệu, giao diện và nội dung cần thiết.",
    bubble: "Mochi làm việc đây ✦",
  },
  {
    max: 92,
    state: "waiting",
    title: "Đợi thêm một chút",
    desc: "Một vài dữ liệu cuối đang được đồng bộ.",
    bubble: "Sắp xong rồi, {name}!",
  },
  {
    max: 101,
    state: "review",
    title: "Kiểm tra lần cuối",
    desc: "Mochi đang rà lại mọi thứ trước khi mở màn.",
    bubble: "Check lần cuối ✓",
  },
];

// Chuỗi giai đoạn khi nhấn vào phim (thay vì chỉ hiện text lấy dữ liệu máy chủ)
const moviePhases = [
  {
    max: 35,
    state: "runningRight",
    title: "Mochi đang mở kho phim cho {name}",
    desc: "Đang kết nối máy chủ và lấy thông tin phim...",
    bubble: "Lấy phim ngay đây~",
  },
  {
    max: 75,
    state: "working",
    title: "Đang chuẩn bị phim",
    desc: "Đang nạp tập phim, luồng phát và thông tin chi tiết.",
    bubble: "Mochi chuẩn bị nè ✦",
  },
  {
    max: 92,
    state: "waiting",
    title: "Đợi thêm một chút",
    desc: "Một vài dữ liệu cuối đang được nạp từ máy chủ.",
    bubble: "Sắp xong rồi, {name}!",
  },
  {
    max: 101,
    state: "review",
    title: "Kiểm tra lần cuối",
    desc: "Mochi đang hoàn tất luồng phát trước khi chiếu.",
    bubble: "Check lần cuối ✓",
  },
];

function getLoggedInUserName(): string {
  if (typeof window === "undefined") return "bạn";
  try {
    const user =
      (window as any).MochiAuth?.getCurrentUser?.() ||
      (window as any).MochiAuth?.currentUser ||
      (window as any).currentUser ||
      null;
    if (user?.name || user?.displayName || user?.username) {
      return user.name || user.displayName || user.username;
    }
    const rawUser = localStorage.getItem("mochi_user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.name || parsed?.username) return parsed.name || parsed.username;
    }
    const sbToken = localStorage.getItem("sb-emowxegcupqhhoyitxel-auth-token");
    if (sbToken) {
      const parsed = JSON.parse(sbToken);
      const email = parsed?.user?.email;
      if (email) return email.split("@")[0];
    }
  } catch {
    // fallback
  }
  return "bạn";
}

// Cờ ghi nhận trạng thái vào web: hasShownInitialWebLoading
export const MochiLoadingScreen: React.FC = () => {
  const [loadingMode, setLoadingMode] = useState<"initial" | "movie" | "none">("initial");
  const [isVisible, setIsVisible] = useState(true);
  const [isRemoved, setIsRemoved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentState, setCurrentState] = useState<string>("waving");
  const [titleText, setTitleText] = useState("Mochi đang chào bạn");
  const [descText, setDescText] = useState("Bé Mochi vừa tới rạp và đang chào bạn nè.");
  const [bubbleText, setBubbleText] = useState("Mochi tới rồi nè ♡");
  const [userName, setUserName] = useState("bạn");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const movieStartTimeRef = useRef<number>(0);

  const stateRef = useRef(currentState);
  stateRef.current = currentState;

  const frameIndexRef = useRef(0);
  const lastFrameAtRef = useRef(performance.now());
  const imageReadyRef = useRef(false);

  const userText = useCallback((val: string, name: string) => {
    return String(val || "").replaceAll("{name}", name || "bạn");
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageReadyRef.current || !sheetRef.current) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const s = states[stateRef.current] || states.idle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      sheetRef.current,
      frameIndexRef.current * CELL_W,
      s.row * CELL_H,
      CELL_W,
      CELL_H,
      0,
      0,
      CELL_W * SCALE,
      CELL_H * SCALE,
    );
  }, []);

  const handleFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setCurrentState("jumping");
    stateRef.current = "jumping";
    frameIndexRef.current = 0;
    const name = getLoggedInUserName();
    setTitleText(userText("Phim đã sẵn sàng {name}!", name));
    setDescText("Mochi Film đã nạp xong dữ liệu. Mở màn thôi ♡");
    setBubbleText(userText("Đi xem phim nào, {name}! ✦", name));

    finishTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIsRemoved(true);
        setLoadingMode("none");
      }, 550);
    }, 650);
  }, [userText]);

  // Bắt đầu chế độ movie loading khi nhấn vào phim
  const startMovieLoading = useCallback(
    (movieNameOrSlug?: string, sourceName?: string) => {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);

      movieStartTimeRef.current = Date.now();
      const name = getLoggedInUserName();
      setUserName(name);

      const cleanMovieName = movieNameOrSlug ? movieNameOrSlug.replace(/-/g, " ") : "";
      const sourceLabel = sourceName ? `máy chủ ${sourceName}` : "máy chủ";

      setLoadingMode("movie");
      setIsRemoved(false);
      setIsVisible(true);
      setProgress(15);
      setCurrentState("runningRight");
      stateRef.current = "runningRight";
      frameIndexRef.current = 0;
      lastFrameAtRef.current = performance.now();

      setTitleText(userText("Mochi đang nạp phim cho {name}", name));
      setDescText(
        cleanMovieName
          ? `Đang lấy dữ liệu "${cleanMovieName}" từ ${sourceLabel}...`
          : `Đang lấy dữ liệu chi tiết phim từ ${sourceLabel}...`,
      );
      setBubbleText(userText("Lấy phim ngay đây, {name}~", name));

      let currentProg = 15;
      timerRef.current = setInterval(() => {
        const delta =
          currentProg < 40 ? 3.5 : currentProg < 75 ? 2.0 : currentProg < 92 ? 1.0 : 0.4;
        currentProg = Math.min(96, currentProg + delta + Math.random() * 0.5);
        setProgress(currentProg);

        const pIdx = moviePhases.findIndex((p) => currentProg < p.max);
        const p = pIdx !== -1 ? moviePhases[pIdx] : moviePhases[moviePhases.length - 1];

        if (stateRef.current !== p.state) {
          stateRef.current = p.state;
          setCurrentState(p.state);
          frameIndexRef.current = 0;
          lastFrameAtRef.current = performance.now();
          draw();
        }

        setTitleText(userText(p.title, name));
        setBubbleText(userText(p.bubble, name));
      }, 60);
    },
    [draw, userText],
  );

  const finishMovieLoading = useCallback(() => {
    const elapsed = Date.now() - movieStartTimeRef.current;
    const minShowTime = 500; // Cho xem ít nhất 500ms để chuyển cảnh mượt mà
    if (elapsed < minShowTime) {
      setTimeout(() => {
        handleFinish();
      }, minShowTime - elapsed);
    } else {
      handleFinish();
    }
  }, [handleFinish]);

  const startInitialLoading = useCallback(() => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const name = getLoggedInUserName();
    setLoadingMode("initial");
    setIsRemoved(false);
    setIsVisible(true);
    setProgress(0);
    setUserName(name);
    setTitleText(userText("Mochi đang chào {name}", name));
    setDescText(userText("Bé Mochi vừa tới rạp và đang chào {name} nè.", name));
    setBubbleText(userText("Mochi tới rồi nè, {name} ♡", name));
    stateRef.current = "waving";
    setCurrentState("waving");
    frameIndexRef.current = 0;
    lastFrameAtRef.current = performance.now();

    let currentProg = 0;
    timerRef.current = setInterval(() => {
      const delta = currentProg < 20 ? 3.4 : currentProg < 65 ? 2.5 : currentProg < 90 ? 1.5 : 0.8;
      currentProg = Math.min(100, currentProg + delta + Math.random() * 0.6);
      setProgress(currentProg);

      const pIdx = initialPhases.findIndex((p) => currentProg < p.max);
      const p = pIdx !== -1 ? initialPhases[pIdx] : initialPhases[initialPhases.length - 1];

      if (stateRef.current !== p.state) {
        stateRef.current = p.state;
        setCurrentState(p.state);
        frameIndexRef.current = 0;
        lastFrameAtRef.current = performance.now();
        draw();
      }

      setTitleText(userText(p.title, name));
      setDescText(userText(p.desc, name));
      setBubbleText(userText(p.bubble, name));

      if (currentProg >= 100) handleFinish();
    }, 60);
  }, [draw, handleFinish, userText]);

  useEffect(() => {
    startInitialLoading();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) startInitialLoading();
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [startInitialLoading]);

  // Window API & Event listeners
  useEffect(() => {
    (window as any).MochiLoader = {
      show: () => {
        setIsRemoved(false);
        setIsVisible(true);
      },
      showMovie: (movieName?: string, sourceName?: string) => {
        startMovieLoading(movieName, sourceName);
      },
      hide: () => {
        setIsVisible(false);
        setTimeout(() => setIsRemoved(true), 550);
      },
      finish: handleFinish,
      finishMovie: finishMovieLoading,
      setUserName: (n: string) => {
        setUserName(n);
      },
      getUserName: () => getLoggedInUserName(),
    };

    const handleUserChanged = (e: any) => {
      const u = e?.detail;
      const n = u?.name || u?.displayName || u?.username || getLoggedInUserName();
      setUserName(n);
    };

    const handleStartMovie = (e: any) => {
      const { name, source } = e?.detail || {};
      startMovieLoading(name, source);
    };

    const handleFinishMovie = () => {
      finishMovieLoading();
    };

    window.addEventListener("mochi:user-changed", handleUserChanged);
    window.addEventListener("mochi:load-movie", handleStartMovie);
    window.addEventListener("mochi:movie-ready", handleFinishMovie);

    return () => {
      window.removeEventListener("mochi:user-changed", handleUserChanged);
      window.removeEventListener("mochi:load-movie", handleStartMovie);
      window.removeEventListener("mochi:movie-ready", handleFinishMovie);
    };
  }, [startMovieLoading, finishMovieLoading, handleFinish]);

  // Sprite image loading & animation frame
  useEffect(() => {
    if (isRemoved) return;

    if (!sheetRef.current) {
      const sheet = new Image();
      sheetRef.current = sheet;
      sheet.decoding = "async";
      sheet.onload = () => {
        imageReadyRef.current = true;
        draw();
      };
      sheet.src = SPRITESHEET_URL;
    }

    const animate = (now: number) => {
      if (imageReadyRef.current) {
        const s = states[stateRef.current] || states.idle;
        const d = 1000 / s.fps;
        if (now - lastFrameAtRef.current >= d) {
          frameIndexRef.current = (frameIndexRef.current + 1) % s.frames;
          lastFrameAtRef.current = now;
          draw();
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRemoved, draw]);

  if (isRemoved) {
    return null;
  }

  const currentPhases = loadingMode === "movie" ? moviePhases : initialPhases;
  const activeDotIndex = currentPhases.findIndex((p) => progress < p.max);
  const currentDotIdx = activeDotIndex !== -1 ? activeDotIndex : currentPhases.length - 1;

  return (
    <div id="mochiLoading" className={isVisible ? "" : "hidden"} role="status" aria-live="polite">
      <div className="mochi-loading-ambient" />
      <div className="mochi-loading-orbit" />
      <div className="mochi-loading-sparkles">
        <i />
        <i />
        <i />
        <i />
      </div>

      <section className="mochi-loading-card">
        <div className="mochi-loading-brand">
          <span className="mochi-loading-brand-dot" />
          Mochi Film
        </div>

        <div className="mochi-loading-pet-stage">
          <div className="mochi-loading-pet-glow" />
          <div className="mochi-loading-pet-shadow" />
          <canvas
            ref={canvasRef}
            id="petCanvas"
            width={384}
            height={416}
            aria-label="Mochi đang tải rạp chiếu phim"
          />
          <div className="mochi-loading-bubble">{bubbleText}</div>
        </div>

        <h1 className="mochi-loading-title">{titleText}</h1>
        <p className="mochi-loading-desc">{descText}</p>

        <div className="mochi-loading-progress-row">
          <div className="mochi-loading-track">
            <div className="mochi-loading-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="mochi-loading-percent">{Math.round(progress)}%</span>
        </div>

        <div className="mochi-loading-steps">
          {currentPhases.map((_, i) => (
            <i key={i} className={i <= currentDotIdx ? "active" : ""} />
          ))}
        </div>

        <div
          className="mochi-loading-skip-hint"
          onClick={handleFinish}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleFinish();
          }}
        >
          Nhấn để vào rạp ngay ›
        </div>
      </section>
    </div>
  );
};
