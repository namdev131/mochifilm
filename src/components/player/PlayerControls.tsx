import React, { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import Hls from "hls.js";
import {
  Heart, Users, ListPlus, Download, Share2, Lightbulb, Flag,
  Film, Server
} from "lucide-react";
import type { MovieDetail, EpisodeServerItem, EpisodeServer, SourceId } from "@/lib/types";
import { PlayerControlsChrome } from "./PlayerControlsChrome";
import { PlayerInDrawer } from "./PlayerInDrawer";
import { detectServerLang } from "./PlayerRightbar";
import type { PlayerQualityOption, PlayerSubtitleOption } from "./PlayerSettingsMenu";
import { usePlayerControlsVisibility } from "./hooks/usePlayerControlsVisibility";

export type StreamType = "hls" | "mp4" | "embed" | "none";

/**
 * Kiểm tra xem URL có phải luồng HLS (.m3u8) hay không
 */
export function isHlsUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.m3u8($|\?|#)/i.test(url) || url.toLowerCase().includes(".m3u8");
}

/**
 * Kiểm tra xem URL có phải tệp video trực tiếp (.mp4, .webm, .mkv, .mov, etc.) hay không
 */
export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mkv|mov|m4v|ogv)($|\?|#)/i.test(url);
}

/**
 * Trích xuất URL media trực tiếp nếu bị bọc trong query parameter của player embed
 * Ví dụ: https://player.phimapi.com/player/?url=https%3A%2F%2F...%2Findex.m3u8
 */
export function extractNestedMediaUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const urlObj = new URL(rawUrl);
    const searchParams = urlObj.searchParams;
    for (const key of ["url", "src", "link", "file", "stream", "source"]) {
      const val = searchParams.get(key);
      if (val) {
        let decoded = val;
        try {
          decoded = decodeURIComponent(val);
        } catch {
          // ignore
        }
        if (isHlsUrl(decoded) || isDirectVideoUrl(decoded)) {
          return decoded;
        }
      }
    }
  } catch {
    const match = rawUrl.match(/[?&](?:url|src|link|file|stream|source)=([^&]+)/i);
    if (match && match[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        if (isHlsUrl(decoded) || isDirectVideoUrl(decoded)) {
          return decoded;
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

/**
 * Kiểm tra xem URL có thực sự là trang nhúng iframe của bên thứ 3 hay không
 */
export function isEmbedUrl(url?: string | null): boolean {
  if (!url) return false;
  if (isHlsUrl(url) || isDirectVideoUrl(url)) return false;
  return (
    /\/embed\//i.test(url) ||
    /\/player(?:\.html|\/|\?)/i.test(url) ||
    /\/iframe\//i.test(url) ||
    /youtube\.com|youtu\.be/i.test(url) ||
    /short\.ink/i.test(url) ||
    /vidsrc/i.test(url) ||
    /dailymotion\.com/i.test(url) ||
    /streamtape\.com/i.test(url) ||
    /dood\./i.test(url) ||
    /ok\.ru/i.test(url) ||
    /mixdrop\./i.test(url)
  );
}

export interface ResolvedStream {
  streamType: StreamType;
  activePlayUrl: string | null;
  fallbackEmbedUrl: string | null;
  isEmbed: boolean;
  hasHls: boolean;
  hasEmbed: boolean;
}

/**
 * Phân loại chính xác nguồn phát thành HLS (.m3u8), video trực tiếp (.mp4/.webm),
 * hoặc iframe embed của bên thứ 3.
 */
export function resolveStreamSource(
  activeEpisode: EpisodeServerItem | null,
  activeStreamUrl: string | null,
  useEmbedFallback: boolean
): ResolvedStream {
  const epM3u8 = activeEpisode?.m3u8 || null;
  const epEmbed = activeEpisode?.embed || null;
  const provided = activeStreamUrl || null;

  // Ứng viên HLS (.m3u8)
  const directM3u8 =
    (isHlsUrl(epM3u8) ? epM3u8 : null) ||
    (isHlsUrl(provided) ? provided : null) ||
    (epEmbed ? extractNestedMediaUrl(epEmbed) : null) ||
    (provided ? extractNestedMediaUrl(provided) : null);

  // Ứng viên video trực tiếp (.mp4, .webm, etc.)
  const directMp4 =
    (isDirectVideoUrl(provided) ? provided : null) ||
    (isDirectVideoUrl(epM3u8) ? epM3u8 : null) ||
    (isDirectVideoUrl(epEmbed) ? epEmbed : null);

  // Ứng viên iframe embed (chỉ nhận khi không phải m3u8 hoặc mp4)
  const candidateEmbed =
    (isEmbedUrl(epEmbed) ? epEmbed : null) ||
    (isEmbedUrl(provided) ? provided : null) ||
    (epEmbed && !isHlsUrl(epEmbed) && !isDirectVideoUrl(epEmbed) ? epEmbed : null) ||
    (provided && !isHlsUrl(provided) && !isDirectVideoUrl(provided) ? provided : null);

  const fallbackEmbedUrl = candidateEmbed || null;
  const hasHls = Boolean(directM3u8 || directMp4);
  const hasEmbed = Boolean(candidateEmbed);

  if (useEmbedFallback && fallbackEmbedUrl) {
    return {
      streamType: "embed",
      activePlayUrl: fallbackEmbedUrl,
      fallbackEmbedUrl,
      isEmbed: true,
      hasHls,
      hasEmbed,
    };
  }

  if (directM3u8) {
    return {
      streamType: "hls",
      activePlayUrl: directM3u8,
      fallbackEmbedUrl,
      isEmbed: false,
      hasHls,
      hasEmbed,
    };
  }

  if (directMp4) {
    return {
      streamType: "mp4",
      activePlayUrl: directMp4,
      fallbackEmbedUrl,
      isEmbed: false,
      hasHls,
      hasEmbed,
    };
  }

  if (candidateEmbed) {
    return {
      streamType: "embed",
      activePlayUrl: candidateEmbed,
      fallbackEmbedUrl,
      isEmbed: true,
      hasHls,
      hasEmbed,
    };
  }

  return {
    streamType: "none",
    activePlayUrl: null,
    fallbackEmbedUrl: null,
    isEmbed: false,
    hasHls,
    hasEmbed,
  };
}

interface PlayerControlsProps {
  movie: MovieDetail;
  activeEpisode: EpisodeServerItem | null;
  activeStreamUrl: string | null;
  servers?: EpisodeServer[];
  activeServerIndex?: number;
  activeEpisodeIndex?: number;
  onSelectEpisode?: (serverIndex: number, episodeIndex: number) => void;
  providerId?: SourceId;
  onChangeProvider?: (provider: SourceId) => void;
  isFavorite: boolean;
  isLightsOut: boolean;
  isTheater: boolean;
  onToggleFavorite: () => void;
  onToggleLights: () => void;
  onToggleTheater: () => void;
  onShowToast: (msg: string) => void;
  onTimeProgress?: (currSec: number, totalSec: number) => void;
  initialPosition?: number;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  movie,
  activeEpisode,
  activeStreamUrl,
  servers,
  activeServerIndex = 0,
  activeEpisodeIndex = 0,
  onSelectEpisode,
  providerId,
  onChangeProvider,
  isFavorite,
  isLightsOut,
  isTheater,
  onToggleFavorite,
  onToggleLights,
  onToggleTheater,
  onShowToast,
  onTimeProgress,
  initialPosition,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [useEmbedFallback, setUseEmbedFallback] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<"episodes" | "servers" | null>(null);
  const [qualities, setQualities] = useState<PlayerQualityOption[]>([]);
  const [qualityLevel, setQualityLevel] = useState(-1);
  const [subtitles, setSubtitles] = useState<PlayerSubtitleOption[]>([]);
  const [subtitleTrack, setSubtitleTrack] = useState(-1);
  const isBusy = isSeeking || settingsOpen || Boolean(drawerOpen);
  const {
    controlsLocked,
    controlsVisible,
    handlePlayerMouseMove,
    handlePlayerMouseLeave,
    handlePlayerPointerUp,
    toggleControlsLock,
  } = usePlayerControlsVisibility(isPlaying && !isBusy);

  useEffect(() => {
    const savedVolume = Number(localStorage.getItem("mochi-player-volume"));
    const savedSpeed = Number(localStorage.getItem("mochi-player-speed"));
    if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) setVolume(savedVolume);
    if (Number.isFinite(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 2) setPlaybackSpeed(String(savedSpeed));
  }, []);

  // Phân loại chính xác nguồn phát
  const { streamType, activePlayUrl, fallbackEmbedUrl, isEmbed, hasHls, hasEmbed } = resolveStreamSource(
    activeEpisode,
    activeStreamUrl,
    useEmbedFallback
  );

  const toggleStreamMode = () => {
    if (isEmbed) {
      if (!hasHls) {
        onShowToast("Tập phim này không có luồng HLS trực tiếp");
        return;
      }
      setUseEmbedFallback(false);
      onShowToast("Đã chuyển sang chế độ phát HLS (Gốc)");
    } else {
      if (!hasEmbed) {
        onShowToast("Tập phim này không có luồng Embed");
        return;
      }
      setUseEmbedFallback(true);
      onShowToast("Đã chuyển sang chế độ phát Embed (Nhúng)");
    }
  };

  const currentServerName = servers?.[activeServerIndex]?.server_name || "Máy chủ";

  // Khôi phục trạng thái fallback khi đổi tập hoặc URL
  useEffect(() => {
    setUseEmbedFallback(false);
  }, [activeEpisode?.slug, activeEpisode?.name, activeStreamUrl]);

  // Quản lý vòng đời phát video: HLS (hls.js / native HLS) hoặc MP4 trực tiếp
  useEffect(() => {
    const video = videoRef.current;

    // Nếu là embed hoặc không có nguồn, hủy Hls instance và làm sạch video
    if (streamType === "embed" || streamType === "none" || !activePlayUrl || typeof window === "undefined") {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      return;
    }

    if (!video) return;

    if (streamType === "mp4") {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = activePlayUrl;
      video.load();
      return;
    }

    if (streamType === "hls") {
      let hls: Hls | null = null;

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        hls = new Hls({
          enableWorker: true,
          startLevel: -1,
          capLevelToPlayerSize: true,
          backBufferLength: 30,
          maxBufferLength: 25,
          maxMaxBufferLength: 60,
        });
        hlsRef.current = hls;
        hls.loadSource(activePlayUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setQualities(hls!.levels.map((item, level) => ({
            level,
            label: item.height ? `${item.height}p` : `${Math.round(item.bitrate / 1000)} kbps`,
          })).filter((item, index, items) => items.findIndex((candidate) => candidate.label === item.label) === index));
          setSubtitles(hls!.subtitleTracks.map((item, track) => ({ track, label: item.name || item.lang || `Phụ đề ${track + 1}` })));
          setQualityLevel(hls!.currentLevel);
          setSubtitleTrack(hls!.subtitleTrack);
          if (initialPosition && initialPosition > 5) {
            video.currentTime = initialPosition;
            setCurrentTime(initialPosition);
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => setQualityLevel(data.level));
        hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_event, data) => setSubtitleTrack(data.id));

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.warn("[HLS Error]", data.type, data.details);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                hlsRef.current = null;
                if (fallbackEmbedUrl) {
                  setUseEmbedFallback(true);
                }
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS cho Safari / iOS WebKit
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        video.src = activePlayUrl;
        video.load();
        const handleMeta = () => {
          if (initialPosition && initialPosition > 5) {
            video.currentTime = initialPosition;
            setCurrentTime(initialPosition);
          }
        };
        video.addEventListener("loadedmetadata", handleMeta, { once: true });
        const handleError = () => {
          if (fallbackEmbedUrl) {
            setUseEmbedFallback(true);
          }
        };
        video.addEventListener("error", handleError, { once: true });
      } else if (fallbackEmbedUrl) {
        setUseEmbedFallback(true);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamType, activePlayUrl, fallbackEmbedUrl, initialPosition]);

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const hasRestoredPositionRef = useRef<boolean>(false);

  useEffect(() => {
    hasRestoredPositionRef.current = false;
  }, [movie.slug, activeEpisode?.name, activeStreamUrl]);

  const togglePlay = () => {
    if (streamType === "none" || !activePlayUrl) {
      onShowToast("Tập phim chưa có nguồn phát");
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const cur = video.currentTime;
    setCurrentTime(cur);
    const dur = video.duration && !isNaN(video.duration) && isFinite(video.duration) ? video.duration : 0;
    if (dur > 0) {
      setDuration(dur);
    }
    onTimeProgress?.(cur, dur);
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (!video || !video.duration || !video.buffered.length) return setBufferedPercent(0);
    setBufferedPercent(Math.min(100, (video.buffered.end(video.buffered.length - 1) / video.duration) * 100));
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration && !isNaN(video.duration) && isFinite(video.duration) ? video.duration : 0;
    if (dur > 0) {
      setDuration(dur);
    }
    if (
      !hasRestoredPositionRef.current &&
      initialPosition &&
      initialPosition > 3 &&
      (dur === 0 || initialPosition < dur - 5)
    ) {
      hasRestoredPositionRef.current = true;
      try {
        video.currentTime = initialPosition;
        setCurrentTime(initialPosition);
        onShowToast(`Tiếp tục xem từ ${formatTime(initialPosition)}`);
      } catch {
        // ignore
      }
      onTimeProgress?.(initialPosition, dur);
    } else {
      onTimeProgress?.(video.currentTime || 0, dur);
    }
  };

  const handleReport = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      onShowToast("Đã sao chép liên kết tập phim");
    } catch {
      // ignore
    }
  };

  const seekFromClientX = (clientX: number, element: HTMLDivElement) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = element.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = pct * duration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    onTimeProgress?.(targetTime, duration);
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const video = videoRef.current;
    if (!video || !duration) return;
    const targetTime = e.key === "Home"
      ? 0
      : e.key === "End"
        ? duration
        : Math.max(0, Math.min(duration, video.currentTime + (e.key === "ArrowLeft" ? -5 : 5)));
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    onTimeProgress?.(targetTime, duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
    }
    setIsMuted(val === 0);
    localStorage.setItem("mochi-player-volume", String(val));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      video.volume = 0.6;
      setVolume(0.6);
    }
  };

  const skipBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(e.target.value);
  };

  const setSpeed = (value: string) => {
    const spd = parseFloat(value);
    setPlaybackSpeed(value);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    localStorage.setItem("mochi-player-speed", value);
    onShowToast(`Tốc độ ${value}x`);
  };

  const setQuality = (level: number) => {
    const hls = hlsRef.current;
    if (!hls) return onShowToast("Nguồn này không hỗ trợ đổi chất lượng");
    hls.currentLevel = level;
    setQualityLevel(level);
    onShowToast(level === -1 ? "Chất lượng tự động" : `Chất lượng ${qualities.find((item) => item.level === level)?.label || "đã đổi"}`);
  };

  const setSubtitle = (track: number) => {
    const hls = hlsRef.current;
    if (hls) hls.subtitleTrack = track;
    const video = videoRef.current;
    if (video) Array.from(video.textTracks).forEach((item, index) => { item.mode = index === track ? "showing" : "disabled"; });
    setSubtitleTrack(track);
  };

  const toggleSubtitles = () => setSubtitle(subtitleTrack >= 0 ? -1 : (subtitles[0]?.track ?? 0));

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isPlayerFullscreen = document.fullscreenElement === playerRef.current;
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: "landscape") => Promise<void>;
        unlock?: () => void;
      };

      if (isPlayerFullscreen && window.matchMedia("(hover: none), (pointer: coarse)").matches) {
        orientation.lock?.("landscape").catch(() => {});
      } else {
        orientation.unlock?.();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void };
      orientation.unlock?.();
    };
  }, []);

  const toggleFullscreen = () => {
    const target = playerRef.current;
    if (!target) return;
    const doc = document as any;
    const el = target as any;
    const isFull = Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isFull) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  const [isWatchlist, setIsWatchlist] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lv-watchlist") || "[]";
      const list = JSON.parse(raw);
      setIsWatchlist(list.some((item: any) => item.slug === movie.slug));
    } catch {
      // ignore
    }
  }, [movie.slug]);

  const toggleWatchlist = () => {
    try {
      const raw = localStorage.getItem("lv-watchlist") || "[]";
      let list = JSON.parse(raw);
      const exists = list.some((item: any) => item.slug === movie.slug);
      if (exists) {
        list = list.filter((item: any) => item.slug !== movie.slug);
        setIsWatchlist(false);
        onShowToast("Đã xóa khỏi danh sách xem sau");
      } else {
        list.push({
          slug: movie.slug,
          name: movie.name,
          poster: movie.poster,
          thumb: movie.thumb,
          year: movie.year,
        });
        setIsWatchlist(true);
        onShowToast("Đã thêm vào danh sách xem sau");
      }
      localStorage.setItem("lv-watchlist", JSON.stringify(list));
    } catch {
      onShowToast("Không thể cập nhật danh sách xem sau");
    }
  };

  const handleDownload = () => {
    if (activePlayUrl) {
      try {
        navigator.clipboard.writeText(activePlayUrl);
        onShowToast("Đã sao chép liên kết nguồn phát video");
      } catch {
        window.open(activePlayUrl, "_blank");
      }
    } else {
      onShowToast("Chưa có luồng phát để tải");
    }
  };

  const handleShare = () => {
    try {
      const curSec = Math.floor(videoRef.current?.currentTime || currentTime || 0);
      const shareUrl = new URL(window.location.href);
      if (curSec > 10) {
        shareUrl.searchParams.set("t", String(curSec));
      }
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        navigator.share({ title: movie.name, url: shareUrl.toString() }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl.toString());
        onShowToast(curSec > 10 ? `Đã sao chép liên kết tại ${formatTime(curSec)}` : "Đã sao chép liên kết xem phim");
      }
    } catch {
      onShowToast("Đã sao chép liên kết phim");
    }
  };

  // Keyboard controls theo đặc tả videoplayer.md:
  // Space / K -> Play/Pause, ← / J -> -10s, → / L -> +10s, M -> Mute, F -> Fullscreen, T -> Theater, C -> Subtitle, ↑/↓ -> Volume, [/] -> Speed, 0-9 -> Seek %
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toUpperCase();
      if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) return;

      const key = e.key.toLowerCase();

      if (e.code === "Space" || key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (key === "t") {
        e.preventDefault();
        onToggleTheater();
      } else if (key === "c") {
        e.preventDefault();
        toggleSubtitles();
      } else if (e.key === "ArrowRight" || key === "l") {
        e.preventDefault();
        if (videoRef.current && activePlayUrl && streamType !== "none") {
          videoRef.current.currentTime = Math.min(videoRef.current.duration || Infinity, videoRef.current.currentTime + 10);
        }
      } else if (e.key === "ArrowLeft" || key === "j") {
        e.preventDefault();
        if (videoRef.current && activePlayUrl && streamType !== "none") {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const nextVol = Math.min(1, volume + 0.05);
        setVolume(nextVol);
        if (videoRef.current) {
          videoRef.current.volume = nextVol;
          videoRef.current.muted = false;
        }
        setIsMuted(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextVol = Math.max(0, volume - 0.05);
        setVolume(nextVol);
        if (videoRef.current) {
          videoRef.current.volume = nextVol;
          videoRef.current.muted = nextVol === 0;
        }
        setIsMuted(nextVol === 0);
      } else if (e.key === "[") {
        e.preventDefault();
        const currentSpeedNum = parseFloat(playbackSpeed);
        const prevSpeed = Math.max(0.5, Math.round((currentSpeedNum - 0.25) * 100) / 100);
        setSpeed(String(prevSpeed));
      } else if (e.key === "]") {
        e.preventDefault();
        const currentSpeedNum = parseFloat(playbackSpeed);
        const nextSpeed = Math.min(2.0, Math.round((currentSpeedNum + 0.25) * 100) / 100);
        setSpeed(String(nextSpeed));
      } else if (/^[0-9]$/.test(e.key) && duration > 0) {
        e.preventDefault();
        const fraction = Number(e.key) / 10;
        const targetTime = fraction * duration;
        if (videoRef.current) {
          videoRef.current.currentTime = targetTime;
          setCurrentTime(targetTime);
          onTimeProgress?.(targetTime, duration);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (videoRef.current && videoRef.current.currentTime > 0) {
        onTimeProgress?.(videoRef.current.currentTime, videoRef.current.duration || 0);
      }
    };
  }, [isMuted, volume, duration, playbackSpeed, onTimeProgress, onToggleTheater]);

  const ratingValue =
    (movie as any).vote_average !== undefined && Number((movie as any).vote_average) > 0
      ? Number((movie as any).vote_average).toFixed(1)
      : null;

  return (
    <section className="player-shell">
      <div
        className={`player ${controlsVisible ? "controls-visible" : "controls-hidden"} ${controlsLocked ? "controls-locked" : ""}`}
        id="player"
        ref={playerRef}
        onMouseEnter={handlePlayerMouseMove}
        onMouseMove={handlePlayerMouseMove}
        onMouseLeave={handlePlayerMouseLeave}
        onPointerUp={handlePlayerPointerUp}
      >
        {isEmbed ? (
          <>
            <iframe
              className="player-iframe"
              src={activePlayUrl || fallbackEmbedUrl!}
              title={movie.name}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
            <video id="video" style={{ display: "none" }}>
              <source id="videoSource" src={activePlayUrl || fallbackEmbedUrl || ""} type="video/mp4" />
            </video>
          </>
        ) : (
          <video
            id="video"
            ref={videoRef}
            preload="metadata"
            playsInline
            poster={movie.thumb || movie.poster}
            onPlay={() => setIsPlaying(true)}
            onPause={() => {
              setIsPlaying(false);
              if (videoRef.current) {
                const cur = videoRef.current.currentTime || 0;
                const dur = videoRef.current.duration || 0;
                onTimeProgress?.(cur, dur);
              }
            }}
            onSeeked={() => {
              if (videoRef.current) {
                const cur = videoRef.current.currentTime || 0;
                const dur = videoRef.current.duration || 0;
                onTimeProgress?.(cur, dur);
              }
            }}
            onTimeUpdate={handleTimeUpdate}
            onProgress={handleProgress}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              onShowToast("Phim đã phát hết");
              if (videoRef.current) {
                const dur = videoRef.current.duration || 0;
                onTimeProgress?.(dur, dur);
              }
            }}
            style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
          >
            <source
              id="videoSource"
              src={activePlayUrl || ""}
              type={streamType === "hls" ? "application/x-mpegURL" : "video/mp4"}
            />
          </video>
        )}

        <div className="player-overlay" />

        {(streamType === "none" || !activePlayUrl) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10, 7, 10, 0.88)",
              zIndex: 10,
              padding: 20,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 700, margin: 0 }}>
              Tập phim chưa có nguồn phát
            </p>
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4, maxWidth: 400 }}>
              Vui lòng chọn tập khác hoặc đổi nguồn phim ở bảng bên phải để tìm máy chủ có sẵn.
            </p>
          </div>
        )}

        <div className="player-top">
          <Link to="/movie/$slug" params={{ slug: movie.slug }} className="player-title">
            ← {movie.name} {activeEpisode ? `· ${activeEpisode.name}` : "· Phim"}
          </Link>

          <div className="player-top-actions">
            {/* Nút đổi chế độ phát giữa HLS và Embed */}
            <button
              type="button"
              className={`player-top-btn stream-mode-btn ${isEmbed ? "is-embed" : "is-hls"}`}
              onClick={toggleStreamMode}
              title={`Đang phát ${isEmbed ? "Embed" : "HLS"}. Bấm để đổi sang ${isEmbed ? "HLS" : "Embed"}`}
              aria-label={`Đổi chế độ phát giữa HLS và Embed (hiện tại: ${isEmbed ? "Embed" : "HLS"})`}
            >
              <span className="mode-dot" />
              <b>{isEmbed ? "Embed" : "HLS"}</b>
            </button>

            {/* Nút chọn tập phim */}
            <button
              type="button"
              className={`player-top-btn ${drawerOpen === "episodes" ? "active" : ""}`}
              onClick={() => setDrawerOpen((prev) => (prev === "episodes" ? null : "episodes"))}
              title="Danh sách tập phim"
              aria-label="Danh sách tập phim"
            >
              <Film className="top-btn-icon" />
              <span>{activeEpisode?.name || "Tập phim"}</span>
            </button>

            {/* Nút đổi máy chủ */}
            <button
              type="button"
              className={`player-top-btn ${drawerOpen === "servers" ? "active" : ""}`}
              onClick={() => setDrawerOpen((prev) => (prev === "servers" ? null : "servers"))}
              title="Đổi máy chủ / server"
              aria-label="Đổi máy chủ phát"
            >
              <Server className="top-btn-icon" />
              <span>{currentServerName}</span>
            </button>
          </div>
        </div>

        {/* Drawer chọn tập và máy chủ ngay trên Player */}
        <PlayerInDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(null)}
          movieLang={movie.lang}
          servers={servers}
          activeServerIndex={activeServerIndex}
          activeEpisodeIndex={activeEpisodeIndex}
          onSelectEpisode={onSelectEpisode}
          providerId={providerId}
          onChangeProvider={onChangeProvider}
        />

        {!isEmbed && streamType !== "none" && activePlayUrl && (
          <PlayerControlsChrome
            visible={controlsVisible}
            controlsLocked={controlsLocked}
            isPlaying={isPlaying}
            isSeeking={isSeeking}
            isMuted={isMuted}
            isTheater={isTheater}
            currentTime={currentTime}
            duration={duration}
            bufferedPercent={bufferedPercent}
            volume={volume}
            playbackSpeed={playbackSpeed}
            quality={movie.quality || "HD"}
            settingsOpen={settingsOpen}
            subtitlesEnabled={subtitleTrack >= 0}
            qualities={qualities}
            qualityLevel={qualityLevel}
            subtitles={subtitles}
            subtitleTrack={subtitleTrack}
            posterUrl={movie.thumb || movie.poster}
            isEmbed={isEmbed}
            hasHls={hasHls}
            hasEmbed={hasEmbed}
            formatTime={formatTime}
            onTogglePlay={togglePlay}
            onToggleLock={toggleControlsLock}
            onSkip={skipBy}
            onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            onSpeedValueChange={setSpeed}
            onToggleSubtitles={toggleSubtitles}
            onToggleSettings={() => setSettingsOpen((open) => !open)}
            onQualityChange={setQuality}
            onSubtitleChange={setSubtitle}
            onToggleTheater={onToggleTheater}
            onToggleFullscreen={toggleFullscreen}
            onToggleStreamMode={toggleStreamMode}
            onOpenEpisodes={() => setDrawerOpen("episodes")}
            onOpenServers={() => setDrawerOpen("servers")}
            onSeekingChange={setIsSeeking}
            onSeek={seekFromClientX}
            onProgressKeyDown={handleProgressKeyDown}
          />
        )}
      </div>

      <div className="movie-bar">
        <div className="movie-info-block">
          <h1>{movie.name}</h1>
          <p>
            {[movie.year, movie.time, ...(movie.category?.slice(0, 3) || [])]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="movie-meta">
            {ratingValue && <span className="tag">★ {ratingValue}</span>}
            <span className="tag">{movie.quality || "Full HD"}</span>
            <span className="tag">16+</span>
            <span className="tag">{movie.lang || "Phụ đề Việt"}</span>
            {servers && servers[activeServerIndex] && (
              <span className="tag active-server-tag">
                {detectServerLang(servers[activeServerIndex].server_name || "", movie.lang) === "thuyetminh"
                  ? "🎙️ Thuyết Minh"
                  : detectServerLang(servers[activeServerIndex].server_name || "", movie.lang) === "longtieng"
                  ? "🗣️ Lồng Tiếng"
                  : "🇻🇳 Vietsub"}
                {" · "}
                {servers[activeServerIndex].server_name || `Máy chủ ${activeServerIndex + 1}`}
              </span>
            )}
          </div>

          {/* Thanh chuyển nhanh Máy chủ & Bản phim ngay dưới thông tin */}
          {servers && servers.length > 1 && (
            <div className="movie-quick-servers">
              <div className="quick-servers-label">
                <Server className="quick-icon" />
                <span>Máy chủ & Bản phim:</span>
              </div>
              <div className="quick-servers-list">
                {servers.map((srv, sIdx) => {
                  const isServerActive = activeServerIndex === sIdx;
                  const lang = detectServerLang(srv.server_name || "", movie.lang);
                  const langLabel =
                    lang === "thuyetminh"
                      ? "🎙️ Thuyết Minh"
                      : lang === "longtieng"
                      ? "🗣️ Lồng Tiếng"
                      : "🇻🇳 Vietsub";
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      className={`quick-server-btn ${isServerActive ? "active" : ""}`}
                      onClick={() => {
                        const targetEp = Math.min(
                          activeEpisodeIndex,
                          (srv.items?.length || 1) - 1
                        );
                        onSelectEpisode?.(sIdx, Math.max(0, targetEp));
                        onShowToast(`Đã chuyển sang ${srv.server_name || `Máy chủ ${sIdx + 1}`}`);
                      }}
                      title={`Đổi sang ${srv.server_name || `Máy chủ ${sIdx + 1}`}`}
                    >
                      <span className="quick-lang-tag">{langLabel}</span>
                      <span className="quick-server-name">
                        {srv.server_name || `Máy chủ ${sIdx + 1}`}
                      </span>
                      {isServerActive && <span className="quick-active-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Hàng 7 nút mở rộng chuẩn thiết kế Mochi Film */}
        <div className="movie-actions">
          {/* 1. Yêu thích */}
          <button
            type="button"
            className={`btn movie-action-btn ${isFavorite ? "active" : ""}`}
            id="favoriteBtn"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
            title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart className={isFavorite ? "fill-current" : ""} />
            <span>{isFavorite ? "Đã yêu thích" : "Yêu thích"}</span>
          </button>

          {/* 2. Watch Party */}
          <button
            type="button"
            className="btn movie-action-btn"
            id="partyBtn"
            onClick={() => {
              const el = document.getElementById("joinPartyBtn");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
            aria-label="Tạo phòng Watch Party"
            title="Xem phim cùng bạn bè"
          >
            <Users />
            <span>Watch Party</span>
          </button>

          {/* 3. Thêm vào danh sách */}
          <button
            type="button"
            className={`btn movie-action-btn ${isWatchlist ? "active" : ""}`}
            onClick={toggleWatchlist}
            aria-label={isWatchlist ? "Đã thêm vào danh sách" : "Thêm vào danh sách"}
            title="Lưu vào danh sách xem sau"
          >
            <ListPlus />
            <span>{isWatchlist ? "Đã thêm" : "Thêm vào danh sách"}</span>
          </button>

          {/* 4. Tải về */}
          <button
            type="button"
            className="btn movie-action-btn"
            onClick={handleDownload}
            aria-label="Tải về"
            title="Tải tập phim hoặc sao chép liên kết"
          >
            <Download />
            <span>Tải về</span>
          </button>

          {/* 5. Chia sẻ */}
          <button
            type="button"
            className="btn movie-action-btn"
            onClick={handleShare}
            aria-label="Chia sẻ"
            title="Chia sẻ phim kèm thời gian đang xem"
          >
            <Share2 />
            <span>Chia sẻ</span>
          </button>

          {/* 6. Tắt đèn */}
          <button
            type="button"
            className={`btn movie-action-btn ${isLightsOut ? "active" : ""}`}
            id="lightsBtn"
            onClick={onToggleLights}
            aria-label={isLightsOut ? "Bật đèn" : "Tắt đèn"}
            title="Bật / tắt chế độ xem tối"
          >
            <Lightbulb />
            <span>{isLightsOut ? "Bật đèn" : "Tắt đèn"}</span>
          </button>

          {/* 7. Báo lỗi */}
          <button
            type="button"
            className="btn movie-action-btn"
            id="reportBtn"
            onClick={handleReport}
            aria-label="Báo lỗi nguồn phát"
            title="Báo cáo lỗi phim hoặc tập này"
          >
            <Flag />
            <span>Báo lỗi</span>
          </button>
        </div>
      </div>
    </section>
  );
};

