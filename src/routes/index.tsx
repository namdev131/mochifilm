import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef, type RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppAuth } from "@/lib/auth-data-provider";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VipNoticeModal } from "@/components/home/VipNoticeModal";
import { SourceSelectorModal } from "@/components/home/SourceSelectorModal";
import { MoviePreviewModal } from "@/components/home/MoviePreviewModal";
import { FavoritesTab } from "@/components/home/FavoritesTab";
import { HistoryTab } from "@/components/home/HistoryTab";
import {
  Play,
  Plus,
  Check,
  Search,
  Bell,
  Film,
  Tv,
  Sparkles,
  Heart,
  Clock,
  Server,
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
  X,
  Menu,
  Crown,
  Trash2,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Info,
  Swords,
  Smile,
  Landmark,
  Brain,
  Ghost,
  Rocket,
  Shield,
  Gamepad2,
  Home,
  Flag,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Layers,
  Globe,
  RefreshCw,
  LogIn,
  LogOut,
} from "lucide-react";
import type { MovieCard, MovieDetail, SourceId, SourceFilter, EpisodeServer } from "../lib/types";
import {
  SOURCES,
  SEARCH_SOURCES,
  fetchLatest,
  fetchLatestMerged,
  fetchDetail,
  pingSource,
  searchMoviesMerged,
  searchMovies,
  mergeMovies,
  sortByNewest,
} from "../lib/api";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface HomeSearchParams {
  nav?: string;
  tab?: string;
  genre?: string;
  country?: string;
  source?: SourceFilter;
  q?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearchParams => {
    const rawSource = search.source;
    const validSource: SourceFilter | undefined =
      rawSource === "all" || rawSource === "kkphim" || rawSource === "nguonc"
        ? (rawSource as SourceFilter)
        : undefined;

    return {
      nav: typeof search.nav === "string" ? search.nav : undefined,
      tab: typeof search.tab === "string" ? search.tab : undefined,
      genre: typeof search.genre === "string" ? search.genre : undefined,
      country: typeof search.country === "string" ? search.country : undefined,
      source: validSource,
      q: typeof search.q === "string" ? search.q : undefined,
    };
  },
  component: HomePage,
});

export interface FavoriteMovie {
  slug: string;
  name: string;
  origin_name?: string;
  poster: string;
  thumb: string;
  source: SourceId;
  year?: number | string;
  quality?: string;
  lang?: string;
  episode_current?: string;
  addedAt: number;
}

export interface RealNotification {
  id: string;
  title: string;
  body: string | null;
  slug: string | null;
  source: string | null;
  poster: string | null;
  read: boolean;
  created_at: string;
}

export interface ContinueWatchItem {
  slug: string;
  name: string;
  origin_name?: string;
  thumb: string;
  poster?: string;
  episode_name: string;
  progressPercent: number;
  durationLeft: string;
  source: SourceId;
  positionSeconds?: number;
  durationSeconds?: number;
  epIndex?: number;
  srvIndex?: number;
  updatedAt?: number;
}

const GENRE_CHIPS = [
  "Tất cả",
  "Hành Động",
  "Tình Cảm",
  "Cổ Trang",
  "Hoạt Hình",
  "Viễn Tưởng",
  "Kinh Dị",
  "Hài Hước",
  "Tâm Lý",
  "Võ Thuật",
  "Phiêu Lưu",
  "Học Đường",
];

// Danh mục 15 thể loại phim chuẩn theo ảnh tham khảo (ref2) và yêu cầu
const NAVBAR_GENRES = [
  { name: "Hành Động", icon: Swords },
  { name: "Tình Cảm", icon: Heart },
  { name: "Hài Hước", icon: Smile },
  { name: "Cổ Trang", icon: Landmark },
  { name: "Tâm Lý", icon: Brain },
  { name: "Kinh Dị", icon: Ghost },
  { name: "Viễn Tưởng", icon: Rocket },
  { name: "Phiêu Lưu", icon: Compass },
  { name: "Chiến Tranh", icon: Shield },
  { name: "Hình Sự", icon: Search },
  { name: "Hoạt Hình", icon: Gamepad2 },
  { name: "Gia Đình", icon: Home },
  { name: "Anime", icon: Sparkles },
  { name: "Mỹ Nam", icon: Heart },
  { name: "Việt Nam", icon: Flag },
];

// Danh mục 10 quốc gia chuẩn theo ảnh tham khảo (ref3)
const NAVBAR_COUNTRIES = [
  { code: "VN", name: "Việt Nam" },
  { code: "KR", name: "Hàn Quốc" },
  { code: "CN", name: "Trung Quốc" },
  { code: "JP", name: "Nhật Bản" },
  { code: "US", name: "Âu Mỹ" },
  { code: "TH", name: "Thái Lan" },
  { code: "HK", name: "Hồng Kông" },
  { code: "TW", name: "Đài Loan" },
  { code: "IN", name: "Ấn Độ" },
  { code: "GB", name: "Anh" },
];

// Mảng tĩnh tránh render lại không cần thiết
const EMPTY_MOVIES: MovieCard[] = [];

// Helper chuyển đổi tiếng Việt có dấu sang slug chuẩn của API phim
const toApiSlug = (str: string) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Tải danh sách phim thật 100% từ API theo chuyên mục / thể loại / quốc gia (No mock data)
async function fetchCategoryMoviesFromApi(
  type: "danh-sach" | "the-loai" | "quoc-gia",
  slug: string,
  searchKeyword: string,
  source: SourceFilter,
): Promise<MovieCard[]> {
  let kkList: MovieCard[] = [];
  if (source === "kkphim" || source === "all") {
    try {
      const endpoint = `https://phimapi.com/v1/api/${type}/${slug}?page=1&limit=24`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const j = await res.json();
        const items = j?.data?.items || [];
        const cdn = j?.data?.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com";
        kkList = items.map((m: any): MovieCard => {
          const poster = m.poster_url?.startsWith("http")
            ? m.poster_url
            : `${cdn}/${m.poster_url || ""}`;
          const thumb = m.thumb_url?.startsWith("http")
            ? m.thumb_url
            : `${cdn}/${m.thumb_url || ""}`;
          const categoryList = (m.category || []).map((c: any) =>
            typeof c === "string" ? c : c.name || c.slug,
          );
          const countryList = (m.country || []).map((c: any) =>
            typeof c === "string" ? c : c.name || c.slug,
          );
          const isCinema = Boolean(
            m.chieurap === true ||
            m.chieu_rap === true ||
            slug === "phim-chieu-rap" ||
            categoryList.some(
              (c: string) =>
                c.toLowerCase().includes("chiếu rạp") || c.toLowerCase().includes("chieu rap"),
            ),
          );
          const itemType =
            m.type ||
            (slug === "phim-bo"
              ? "series"
              : slug === "phim-le"
                ? "single"
                : slug === "hoat-hinh"
                  ? "hoathinh"
                  : undefined);
          return {
            slug: m.slug,
            name: m.name,
            origin_name: m.origin_name,
            poster,
            thumb,
            year: m.year,
            quality: m.quality,
            lang: m.lang,
            episode_current: m.episode_current,
            source: "kkphim",
            type: itemType,
            category: categoryList,
            country: countryList,
            chieu_rap: isCinema,
            status: m.status,
            modified: m.modified?.time || m.modified,
          };
        });
      }
    } catch {
      // fallback
    }
  }

  let nguonCList: MovieCard[] = [];
  if (source === "nguonc" || source === "all") {
    try {
      let ncEndpoint = "";
      if (type === "danh-sach") {
        if (slug === "phim-moi-cap-nhat") {
          ncEndpoint = "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1";
        } else if (slug !== "phim-chieu-rap") {
          ncEndpoint = `https://phim.nguonc.com/api/films/danh-sach/${slug}?page=1`;
        }
      } else if (type === "the-loai") {
        ncEndpoint = `https://phim.nguonc.com/api/films/the-loai/${slug}?page=1`;
      } else if (type === "quoc-gia") {
        ncEndpoint = `https://phim.nguonc.com/api/films/quoc-gia/${slug}?page=1`;
      }

      if (ncEndpoint) {
        const ncRes = await fetch(ncEndpoint);
        if (ncRes.ok) {
          const ncData = await ncRes.json();
          if (ncData?.status === "success" && Array.isArray(ncData.items)) {
            nguonCList = ncData.items.map((m: any): MovieCard => {
              const totalEp =
                typeof m.total_episodes === "number"
                  ? m.total_episodes
                  : parseInt(m.total_episodes, 10);
              const inferredType =
                slug === "phim-bo"
                  ? "series"
                  : slug === "phim-le"
                    ? "single"
                    : slug === "hoat-hinh"
                      ? "hoathinh"
                      : totalEp === 1
                        ? "single"
                        : totalEp > 1
                          ? "series"
                          : undefined;
              return {
                slug: m.slug,
                name: m.name,
                origin_name: m.original_name,
                poster: m.poster_url || m.thumb_url,
                thumb: m.thumb_url || m.poster_url,
                year: m.year,
                quality: m.quality,
                lang: m.language,
                episode_current: m.current_episode,
                source: "nguonc",
                type: inferredType,
                category: [],
                country: [],
                chieu_rap: slug === "phim-chieu-rap",
                status: m.status,
                modified: m.modified || m.created,
              };
            });
          }
        }
      }

      if (nguonCList.length === 0 && searchKeyword) {
        nguonCList = await searchMovies(searchKeyword, "nguonc").catch(() => []);
      }
    } catch {
      // fallback
    }
  }

  if (source === "kkphim") return kkList;
  if (source === "nguonc") return nguonCList;
  return mergeMovies([kkList, nguonCList]);
}

// Tất cả dữ liệu phim được nạp thật 100% từ API, không sử dụng dữ liệu ảo (No mockdata)

export function HomePage() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user, signOut } = useAppAuth();
  const syncUser = useMutation(api.users.syncCurrent);
  const convexHistory = useConvexQuery(api.watchHistory.list, user ? {} : "skip");
  const convexNotifications = useConvexQuery(api.notifications.list, user ? {} : "skip");
  const removeHistory = useMutation(api.watchHistory.remove);
  const clearHistory = useMutation(api.watchHistory.clear);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Navigation & filtering state
  const [selectedNav, setSelectedNav] = useState<string>("trang-chu");
  const [selectedSource, setSelectedSource] = useState<SourceFilter>("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("Tất cả");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const genreButtonRef = useRef<HTMLButtonElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const currentUser = user
    ? {
        email: user.email,
        name: user.user_metadata.full_name || user.email?.split("@")[0] || "Thành viên Mochi",
      }
    : null;

  // Real Hero Detail from API
  const [heroDetail, setHeroDetail] = useState<{
    synopsis?: string;
    genres?: string[];
    backdrop?: string;
  } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.q || "");
  const [searchResults, setSearchResults] = useState<MovieCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(() =>
    Boolean(searchParams.q && searchParams.q.trim().length > 0),
  );

  // Lắng nghe và đồng bộ khi URL query params thay đổi (hỗ trợ refresh & back/forward của trình duyệt)
  useEffect(() => {
    const currentNav = searchParams.nav || searchParams.tab || "trang-chu";
    const currentGenre = searchParams.genre || "Tất cả";
    const currentCountry = searchParams.country || null;
    const currentSource = searchParams.source || "all";
    const currentQ = searchParams.q || "";

    if (
      currentSource &&
      (currentSource === "all" || currentSource === "kkphim" || currentSource === "nguonc")
    ) {
      setSelectedSource(currentSource);
    } else if (!currentSource) {
      setSelectedSource("all");
    }

    if (!searchParams.nav && !searchParams.tab) {
      setSelectedNav("trang-chu");
      setSelectedGenre(currentGenre);
      setSelectedCountry(currentCountry);
    } else {
      setSelectedNav(currentNav);
      setSelectedGenre(currentGenre);
      setSelectedCountry(currentCountry);
    }

    if (currentQ !== searchQuery) {
      setSearchQuery(currentQ);
      if (currentQ.trim().length > 0) {
        setShowSearchDropdown(true);
      }
    }
  }, [
    searchParams.nav,
    searchParams.tab,
    searchParams.genre,
    searchParams.country,
    searchParams.source,
    searchParams.q,
  ]);

  // Đồng bộ ô tìm kiếm 'q' vào URL query parameters
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQ = searchQuery.trim();
      const currentParamQ = (searchParams.q || "").trim();

      if (trimmedQ !== currentParamQ) {
        navigate({
          search: (prev) => ({
            ...prev,
            q: trimmedQ || undefined,
          }),
          replace: true,
        }).catch(() => {});

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (trimmedQ) {
            params.set("q", trimmedQ);
          } else {
            params.delete("q");
          }
          const queryString = params.toString();
          const newPath = queryString
            ? `${window.location.pathname}?${queryString}`
            : window.location.pathname;
          if (`${window.location.pathname}${window.location.search}` !== newPath) {
            window.history.replaceState(window.history.state, "", newPath);
          }
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modals & Drawers state
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showVipNoticeModal, setShowVipNoticeModal] = useState(false);

  // Movie preview & player modal state
  const [selectedMoviePreview, setSelectedMoviePreview] = useState<MovieCard | null>(null);
  const [previewDetail, setPreviewDetail] = useState<MovieDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [activeEpisodeName, setActiveEpisodeName] = useState<string>("");

  const openMovieDetail = (movie: { slug: string; source?: SourceId; name?: string }) => {
    const movieSource =
      movie.source || (selectedSource !== "all" ? (selectedSource as SourceId) : "kkphim");
    if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
      (window as any).MochiLoader.showMovie(movie.name || movie.slug, movieSource);
    }
    navigate({
      to: "/movie/$slug",
      params: { slug: movie.slug },
      search: { source: movieSource },
    });
  };

  // Live API data via TanStack Query (Realtime 60s refetchInterval, refetchOnWindowFocus)
  const {
    data: latestMovies = EMPTY_MOVIES,
    isLoading: isLoadingMovies,
    isError: isMoviesError,
    refetch: refetchMovies,
  } = useQuery<MovieCard[]>({
    queryKey: ["latestMovies", selectedSource],
    queryFn: () => fetchLatestMerged(selectedSource, 1),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const trendingMovies = useMemo(() => latestMovies.slice(0, 10), [latestMovies]);
  const [sourcePings, setSourcePings] = useState<Record<string, number>>({});

  // Convex realtime data
  const [realNotifications, setRealNotifications] = useState<RealNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  // Real User Data (No Fake Progress / No Fake Favorites)
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [continueList, setContinueList] = useState<ContinueWatchItem[]>([]);

  // Lọc đồng bộ Bộ sưu tập Yêu thích & Lịch sử theo Bộ lọc Nguồn (all / kkphim / nguonc)
  const displayedFavorites = useMemo(() => {
    if (selectedSource === "all") return favorites;
    return favorites.filter((f) => f.source === selectedSource);
  }, [favorites, selectedSource]);

  const displayedContinueList = useMemo(() => {
    if (selectedSource === "all") return continueList;
    return continueList.filter((item) => item.source === selectedSource);
  }, [continueList, selectedSource]);

  // Confirmation Dialog State for Delete Actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const trendingRailRef = useRef<HTMLDivElement>(null);
  const latestRailRef = useRef<HTMLDivElement>(null);
  const categorySectionRef = useRef<HTMLElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------
  // Load Real Data from localStorage & /api/watch-history
  // -------------------------------------------------------------
  const reloadRealUserData = async () => {
    if (typeof window === "undefined") return;

    // 1. Load Real Favorites (Strictly real stored data)
    try {
      const rawFav =
        localStorage.getItem("mochi_favorites") || localStorage.getItem("lv-favorites");
      if (rawFav) {
        const parsed = JSON.parse(rawFav);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((f) => f && f.slug));
        }
      } else {
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    }

    // 2. Load Real Watch History from session or localStorage
    let loadedHistory: ContinueWatchItem[] = [];

    if (convexHistory?.length) {
      loadedHistory = convexHistory.map((row) => {
        const pos = row.positionSeconds;
        const dur = row.durationSeconds || 1;
        return {
          slug: row.slug,
          name: row.name,
          thumb: row.poster || "",
          poster: row.poster || "",
          episode_name: row.episodeName || `Tập ${row.epIndex + 1}`,
          progressPercent: Math.min(100, Math.round((pos / dur) * 100)),
          durationLeft:
            dur > pos ? `Còn ${Math.max(1, Math.round((dur - pos) / 60))} phút` : "Đã xong",
          source: row.source as SourceId,
          positionSeconds: pos,
          durationSeconds: dur,
          epIndex: row.epIndex,
          srvIndex: row.srvIndex,
          updatedAt: row.watchedAt,
        };
      });
    }

    // Fallback: Read real local progress from "lv-progress", "mochi_watch_history", or "lv-watch-history"
    if (loadedHistory.length === 0) {
      try {
        const rawProgress =
          localStorage.getItem("lv-progress") ||
          localStorage.getItem("mochi_watch_history") ||
          localStorage.getItem("lv-watch-history");
        if (rawProgress) {
          const map = JSON.parse(rawProgress);
          const entries = (Array.isArray(map) ? map : Object.values(map)) as any[];
          if (entries.length > 0) {
            const seenSlugs = new Set<string>();
            loadedHistory = entries
              .filter((e) => e && e.slug)
              .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
              .filter((e) => {
                if (seenSlugs.has(e.slug)) return false;
                seenSlugs.add(e.slug);
                return true;
              })
              .slice(0, 30)
              .map((e) => {
                const pos = Number(e.position || e.position_seconds) || 0;
                const dur = Number(e.duration || e.duration_seconds) || 1;
                const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
                return {
                  slug: e.slug,
                  name: e.name || e.slug.replace(/-/g, " "),
                  origin_name: e.origin_name,
                  thumb: e.thumb || e.poster || "",
                  poster: e.poster || e.thumb || "",
                  episode_name:
                    e.episode_name || (e.ep !== undefined ? `Tập ${e.ep + 1}` : "Đang xem"),
                  progressPercent: pct,
                  durationLeft:
                    dur > pos ? `Còn ${Math.max(1, Math.round((dur - pos) / 60))} phút` : "Đã xong",
                  source: (e.source as SourceId) || "kkphim",
                  positionSeconds: pos,
                  durationSeconds: dur,
                  epIndex: e.ep ?? e.epIndex ?? 0,
                  srvIndex: e.srv ?? e.srvIndex ?? 0,
                  updatedAt: e.updatedAt,
                };
              });
          }
        }
      } catch {
        // ignore
      }
    }

    // If still empty: set to empty array (NO fake progress)
    setContinueList(loadedHistory);
  };

  useEffect(() => {
    reloadRealUserData();
    const handleSync = () => reloadRealUserData();
    window.addEventListener("lv-history-sync", handleSync);
    window.addEventListener("lv-favorites-sync", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("lv-history-sync", handleSync);
      window.removeEventListener("lv-favorites-sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [convexHistory]);

  // Keyboard Escape listener for confirmDialog
  useEffect(() => {
    if (!confirmDialog?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmDialog(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDialog]);

  useEffect(() => {
    if (user) void syncUser();
  }, [user?.id]);

  // -------------------------------------------------------------
  // Ping sources for latency health (60s polling & cleanup)
  // -------------------------------------------------------------
  useEffect(() => {
    const updatePings = () => {
      SOURCES.forEach((s) => {
        pingSource(s.id).then((ms) => {
          setSourcePings((prev) => ({ ...prev, [s.id]: ms }));
        });
      });
    };
    updatePings();
    const interval = setInterval(updatePings, 60_000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------
  // Supabase Realtime Subscription & cleanup
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = supabase
      .channel("watch_history_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "watch_history" }, () => {
        reloadRealUserData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // -------------------------------------------------------------
  // Realtime User Notifications (Supabase postgres_changes)
  // -------------------------------------------------------------
  const loadUserNotifications = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setRealNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,slug,source,poster,read,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        setRealNotifications(data as RealNotification[]);
        setUnreadNotificationCount(data.filter((n: any) => !n.read).length);
      } else if (convexNotifications && convexNotifications.length > 0) {
        const rows = convexNotifications;
        setRealNotifications(
          rows.map((row) => ({
            id: row._id,
            title: row.title,
            body: row.body ?? null,
            slug: row.slug ?? null,
            source: row.source ?? null,
            poster: row.poster ?? null,
            read: row.read,
            created_at: new Date(row.createdAt).toISOString(),
          })),
        );
        setUnreadNotificationCount(rows.filter((row) => !row.read).length);
      } else {
        setRealNotifications([]);
        setUnreadNotificationCount(0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    let activeNotifChannel: ReturnType<typeof supabase.channel> | null = null;

    const uid = user?.id;
    if (uid) {
      loadUserNotifications(uid);
      activeNotifChannel = supabase
        .channel(`user_notifs_${uid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          () => {
            loadUserNotifications(uid);
          },
        )
        .subscribe();
    } else {
      setRealNotifications([]);
      setUnreadNotificationCount(0);
    }

    return () => {
      if (activeNotifChannel) {
        supabase.removeChannel(activeNotifChannel);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (convexNotifications && convexNotifications.length > 0 && realNotifications.length === 0) {
      const rows = convexNotifications;
      setRealNotifications(
        rows.map((row) => ({
          id: row._id,
          title: row.title,
          body: row.body ?? null,
          slug: row.slug ?? null,
          source: row.source ?? null,
          poster: row.poster ?? null,
          read: row.read,
          created_at: new Date(row.createdAt).toISOString(),
        })),
      );
      setUnreadNotificationCount(rows.filter((row) => !row.read).length);
    }
  }, [convexNotifications, realNotifications.length]);

  const markNotificationRead = async (notif: RealNotification) => {
    if (!user || notif.read) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true } as never)
        .eq("id", notif.id);
      setRealNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      );
      setUnreadNotificationCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
    try {
      await markRead({ id: notif.id as never });
    } catch {
      // ignore
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true } as never)
        .eq("user_id", user.id);
      setRealNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotificationCount(0);
    } catch {
      // ignore
    }
    try {
      await markAllRead();
    } catch {
      // ignore
    }
  };

  // Ping sources for latency health
  useEffect(() => {
    SOURCES.forEach((s) => {
      pingSource(s.id).then((ms) => {
        setSourcePings((prev) => ({ ...prev, [s.id]: ms }));
      });
    });
  }, []);

  // Search Live Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults((prev) => (prev.length === 0 ? prev : []));
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      searchMoviesMerged(searchQuery, selectedSource)
        .then((res) => {
          setSearchResults(res.slice(0, 6));
        })
        .catch(() => {
          const localHits = latestMovies.filter(
            (m) =>
              m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (m.origin_name && m.origin_name.toLowerCase().includes(searchQuery.toLowerCase())),
          );
          setSearchResults(localHits.slice(0, 6));
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedSource]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setShowGenreDropdown(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showGenreDropdown) {
          setShowGenreDropdown(false);
          genreButtonRef.current?.focus();
        }
        if (showCountryDropdown) {
          setShowCountryDropdown(false);
          countryButtonRef.current?.focus();
        }
        setShowSearchDropdown(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showGenreDropdown, showCountryDropdown]);

  // -------------------------------------------------------------
  // Fetch Real Detail & Server Links when a movie is selected
  // -------------------------------------------------------------
  useEffect(() => {
    if (!selectedMoviePreview) {
      setPreviewDetail(null);
      setActiveStreamUrl(null);
      setActiveEpisodeName("");
      return;
    }

    let isCancelled = false;
    setIsLoadingDetail(true);
    setActiveStreamUrl(null);
    setActiveEpisodeName("");

    fetchDetail(selectedMoviePreview.slug, selectedMoviePreview.source)
      .then((detail) => {
        if (!isCancelled) {
          setPreviewDetail(detail);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải chi tiết phim từ máy chủ nguồn:", err);
        if (!isCancelled) setPreviewDetail(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingDetail(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedMoviePreview]);

  // Play real episode and record real watch history
  const handleSelectEpisode = (
    ep: { name: string; slug: string; m3u8?: string; embed?: string },
    srvIndex: number,
    epIndex: number,
  ) => {
    if (!selectedMoviePreview) return;
    const stream = ep.embed || ep.m3u8;
    if (!stream) return;

    setActiveStreamUrl(stream);
    setActiveEpisodeName(ep.name);

    // Save REAL progress into "lv-progress"
    try {
      const raw = localStorage.getItem("lv-progress") || "{}";
      const map = JSON.parse(raw);
      const key = `${selectedMoviePreview.source}:${selectedMoviePreview.slug}:${srvIndex}:${epIndex}`;
      const existing = map[key];
      const pos = typeof existing?.position === "number" ? existing.position : 0;
      const dur = typeof existing?.duration === "number" ? existing.duration : 0;
      map[key] = {
        slug: selectedMoviePreview.slug,
        name: selectedMoviePreview.name,
        origin_name: selectedMoviePreview.origin_name,
        thumb: selectedMoviePreview.thumb || selectedMoviePreview.poster,
        poster: selectedMoviePreview.poster || selectedMoviePreview.thumb,
        source: selectedMoviePreview.source,
        ep: epIndex,
        srv: srvIndex,
        episode_name: ep.name,
        position: pos,
        duration: dur,
        updatedAt: Date.now(),
      };
      localStorage.setItem("lv-progress", JSON.stringify(map));
      reloadRealUserData();
      window.dispatchEvent(new CustomEvent("lv-history-sync"));
    } catch {
      // ignore
    }
  };

  // Remove single movie from favorites
  const removeFavorite = (slug: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.slug !== slug);
      try {
        localStorage.setItem("mochi_favorites", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    window.dispatchEvent(new CustomEvent("lv-favorites-sync"));
  };

  // Clear all favorites
  const clearAllFavorites = () => {
    setFavorites([]);
    try {
      localStorage.removeItem("mochi_favorites");
      localStorage.removeItem("lv-favorites");
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("lv-favorites-sync"));
  };

  // Confirm delete single favorite
  const confirmDeleteFavorite = (movie: { slug: string; name: string }) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa khỏi danh sách yêu thích?",
      message: `Bạn có chắc muốn xóa phim "${movie.name}" khỏi danh sách phim yêu thích của mình?`,
      confirmText: "Xóa phim",
      onConfirm: () => removeFavorite(movie.slug),
    });
  };

  // Confirm clear all favorites
  const confirmClearAllFavorites = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa tất cả phim yêu thích?",
      message: `Bạn có chắc muốn xóa tất cả ${favorites.length} phim trong danh sách yêu thích? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa tất cả",
      onConfirm: () => clearAllFavorites(),
    });
  };

  // Toggle Favorite: if already in favorites, require confirmation before deleting!
  const toggleFavorite = (movie: MovieCard) => {
    const exists = favorites.some((f) => f.slug === movie.slug);
    if (exists) {
      confirmDeleteFavorite(movie);
      return;
    }
    const next: FavoriteMovie[] = [
      {
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        poster: movie.poster,
        thumb: movie.thumb,
        source: movie.source,
        year: movie.year,
        quality: movie.quality,
        lang: movie.lang,
        episode_current: movie.episode_current,
        addedAt: Date.now(),
      },
      ...favorites,
    ];
    setFavorites(next);
    try {
      localStorage.setItem("mochi_favorites", JSON.stringify(next));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("lv-favorites-sync"));
  };

  // Delete single movie from watch history
  const deleteHistoryItem = (slug: string) => {
    try {
      const raw = localStorage.getItem("lv-progress");
      if (raw) {
        const map = JSON.parse(raw);
        let changed = false;
        for (const key of Object.keys(map)) {
          if (map[key]?.slug === slug) {
            delete map[key];
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem("lv-progress", JSON.stringify(map));
        }
      }
      const rawMochi = localStorage.getItem("mochi_watch_history");
      if (rawMochi) {
        try {
          const parsed = JSON.parse(rawMochi);
          if (Array.isArray(parsed)) {
            localStorage.setItem(
              "mochi_watch_history",
              JSON.stringify(parsed.filter((p: any) => p?.slug !== slug)),
            );
          } else if (typeof parsed === "object") {
            for (const k of Object.keys(parsed)) {
              if (parsed[k]?.slug === slug) delete parsed[k];
            }
            localStorage.setItem("mochi_watch_history", JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    if (user) void removeHistory({ slug });

    setContinueList((prev) => prev.filter((item) => item.slug !== slug));
    window.dispatchEvent(new CustomEvent("lv-history-sync"));
  };

  // Confirm delete single movie from history
  const confirmDeleteHistoryItem = (item: { slug: string; name: string }) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa khỏi lịch sử xem?",
      message: `Bạn có chắc muốn xóa phim "${item.name}" khỏi lịch sử xem phim?`,
      confirmText: "Xóa phim",
      onConfirm: () => deleteHistoryItem(item.slug),
    });
  };

  // Clear all real history
  const clearRealHistory = () => {
    try {
      localStorage.removeItem("lv-progress");
      localStorage.removeItem("mochi_watch_history");
      localStorage.removeItem("lv-watch-history");
    } catch {
      // ignore
    }
    if (user) void clearHistory();
    setContinueList([]);
    window.dispatchEvent(new CustomEvent("lv-history-sync"));
  };

  // Confirm clear all history
  const confirmClearAllHistory = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa toàn bộ lịch sử xem?",
      message:
        "Bạn có chắc muốn xóa toàn bộ lịch sử xem phim? Tiến độ xem của các tập phim sẽ bị xóa và không thể khôi phục.",
      confirmText: "Xóa lịch sử",
      onConfirm: () => clearRealHistory(),
    });
  };

  // Filter movies for current display (100% real API data)
  const currentHeroList = useMemo(() => {
    if (latestMovies.length > 0) {
      return latestMovies.slice(0, 5).map((m) => ({
        ...m,
        desc: m.origin_name ? `${m.name} (${m.origin_name})` : m.name,
        duration: m.episode_current || "Đầy đủ tập",
        backdrop: m.thumb || m.poster,
      }));
    }
    return [];
  }, [latestMovies]);

  const currentHero = currentHeroList[activeHeroIndex] || currentHeroList[0] || null;
  const isCurrentHeroFavorite = currentHero
    ? favorites.some((f) => f.slug === currentHero.slug)
    : false;

  // Real Hero Detail enrichment via API
  useEffect(() => {
    if (!currentHero) {
      setHeroDetail(null);
      return;
    }

    let isCancelled = false;
    fetchDetail(currentHero.slug, currentHero.source)
      .then((detail) => {
        if (!isCancelled && detail) {
          setHeroDetail({
            synopsis: detail.content ? detail.content.replace(/<[^>]*>?/gm, "").trim() : undefined,
            genres: detail.category || currentHero.category,
            backdrop: detail.thumb || detail.poster || currentHero.thumb,
          });
        }
      })
      .catch(() => {
        // keep fallback
      });

    return () => {
      isCancelled = true;
    };
  }, [currentHero?.slug, currentHero?.source]);

  // Dynamic Genre Chips extracted from real movies
  const dynamicGenreChips = useMemo(() => {
    const genres = new Set<string>();
    latestMovies.forEach((m) => {
      if (m.category && Array.isArray(m.category)) {
        m.category.forEach((c) => {
          if (c) genres.add(c.trim());
        });
      }
    });
    if (genres.size >= 4) {
      return ["Tất cả", ...Array.from(genres).slice(0, 14)];
    }
    return GENRE_CHIPS;
  }, [latestMovies]);

  // Live Query cho thể loại phim đã chọn (100% Dữ liệu thật từ API)
  const {
    data: genreQueryMovies = EMPTY_MOVIES,
    isLoading: isLoadingGenreQuery,
    isError: isGenreError,
    refetch: refetchGenre,
  } = useQuery<MovieCard[]>({
    queryKey: ["genreQuery", selectedGenre, selectedSource],
    queryFn: () =>
      fetchCategoryMoviesFromApi(
        "the-loai",
        toApiSlug(selectedGenre),
        selectedGenre,
        selectedSource,
      ),
    enabled: selectedGenre !== "Tất cả",
    staleTime: 1000 * 60 * 5,
  });

  // Live Query cho quốc gia đã chọn (100% Dữ liệu thật từ API)
  const {
    data: countryQueryMovies = EMPTY_MOVIES,
    isLoading: isLoadingCountryQuery,
    isError: isCountryError,
    refetch: refetchCountry,
  } = useQuery<MovieCard[]>({
    queryKey: ["countryQuery", selectedCountry, selectedSource],
    queryFn: () =>
      fetchCategoryMoviesFromApi(
        "quoc-gia",
        toApiSlug(selectedCountry || ""),
        selectedCountry || "",
        selectedSource,
      ),
    enabled: Boolean(selectedCountry),
    staleTime: 1000 * 60 * 5,
  });

  // Chuyên mục trên Menu chính (Phim mới, Phim bộ, Phim lẻ, Hoạt hình, Chiếu rạp) - 100% Dữ liệu thật từ API
  const navCategoryConfig = useMemo(() => {
    switch (selectedNav) {
      case "phim-moi":
        return { slug: "phim-moi-cap-nhat", keyword: "phim mới" };
      case "phim-bo":
        return { slug: "phim-bo", keyword: "phim bộ" };
      case "phim-le":
        return { slug: "phim-le", keyword: "phim lẻ" };
      case "hoat-hinh":
        return { slug: "hoat-hinh", keyword: "hoạt hình" };
      case "chieu-rap":
        return { slug: "phim-chieu-rap", keyword: "chiếu rạp" };
      default:
        return null;
    }
  }, [selectedNav]);

  const {
    data: navQueryMovies = EMPTY_MOVIES,
    isLoading: isLoadingNavQuery,
    isError: isNavError,
    refetch: refetchNav,
  } = useQuery<MovieCard[]>({
    queryKey: ["navCategoryQuery", selectedNav, navCategoryConfig?.slug, selectedSource],
    queryFn: () =>
      navCategoryConfig
        ? fetchCategoryMoviesFromApi(
            "danh-sach",
            navCategoryConfig.slug,
            navCategoryConfig.keyword,
            selectedSource,
          )
        : Promise.resolve(EMPTY_MOVIES),
    enabled: Boolean(navCategoryConfig) && selectedGenre === "Tất cả" && !selectedCountry,
    staleTime: 1000 * 60 * 5,
  });

  const isCategoryLoading =
    (selectedGenre !== "Tất cả" && isLoadingGenreQuery) ||
    (Boolean(selectedCountry) && isLoadingCountryQuery) ||
    (Boolean(navCategoryConfig) && isLoadingNavQuery) ||
    (selectedNav === "phim-moi" && isLoadingMovies) ||
    (selectedNav === "trang-chu" && isLoadingMovies);

  const isCategoryError =
    (selectedGenre !== "Tất cả" && isGenreError) ||
    (Boolean(selectedCountry) && isCountryError) ||
    (Boolean(navCategoryConfig) && isNavError) ||
    ((selectedNav === "phim-moi" || selectedNav === "trang-chu") && isMoviesError);

  const refetchCurrentFilter = () => {
    if (selectedGenre !== "Tất cả") refetchGenre();
    else if (selectedCountry) refetchCountry();
    else if (navCategoryConfig) refetchNav();
    else refetchMovies();
  };

  const filterEmptyState = useMemo(() => {
    if (selectedCountry) {
      return {
        title: `Không tìm thấy phim từ ${selectedCountry}`,
        message: `Hiện chưa có phim nào thuộc quốc gia ${selectedCountry} trên nguồn ${selectedSource === "all" ? "tất cả máy chủ" : selectedSource}. Bạn có thể đổi nguồn hoặc đặt lại bộ lọc.`,
        actionLabel: "Đặt lại bộ lọc",
      };
    }
    if (selectedGenre !== "Tất cả") {
      return {
        title: `Không tìm thấy phim thể loại ${selectedGenre}`,
        message: `Hiện chưa có phim nào thuộc thể loại ${selectedGenre} trên nguồn ${selectedSource === "all" ? "tất cả máy chủ" : selectedSource}. Bạn có thể chọn thể loại khác hoặc xem tất cả.`,
        actionLabel: "Xem tất cả thể loại",
      };
    }
    switch (selectedNav) {
      case "chieu-rap":
        return {
          title: "Chưa có phim chiếu rạp phù hợp",
          message: `Hiện chưa có phim chiếu rạp nào trên nguồn ${selectedSource === "all" ? "tất cả máy chủ" : selectedSource}. Thử chuyển đổi nguồn phát mở khác.`,
          actionLabel: "Về trang chủ",
        };
      case "hoat-hinh":
        return {
          title: "Chưa có phim hoạt hình & anime phù hợp",
          message: `Hiện chưa có phim hoạt hình nào trên nguồn ${selectedSource === "all" ? "tất cả máy chủ" : selectedSource}.`,
          actionLabel: "Về trang chủ",
        };
      case "phim-le":
        return {
          title: "Chưa có phim lẻ phù hợp",
          message: `Hiện chưa có phim lẻ nào trên nguồn ${selectedSource === "all" ? "tất cả máy chủ" : selectedSource}.`,
          actionLabel: "Về trang chủ",
        };
      case "phim-bo":
        return {
          title: "Chưa có phim bộ phù hợp",
          message: `Hiện chưa có phim bộ nào trên nguồn ${selectedSource === "all" ? "tất cả máy chủ" : selectedSource}.`,
          actionLabel: "Về trang chủ",
        };
      default:
        return {
          title: "Không tìm thấy phim phù hợp",
          message: `Không có phim nào khả dụng trên nguồn ${selectedSource === "all" ? "tất cả máy chủ" : selectedSource}.`,
          actionLabel: "Xem tất cả thể loại",
        };
    }
  }, [selectedCountry, selectedGenre, selectedNav, selectedSource]);

  // Filter movies by nav, genre and country (100% Real API Data)
  const displayedMovies = useMemo(() => {
    const rawMovies = (() => {
      // 1. Lọc theo Quốc Gia nếu có
      if (selectedCountry) {
        if (isLoadingCountryQuery) return EMPTY_MOVIES;
        if (countryQueryMovies.length > 0) return countryQueryMovies;
        if (isCountryError) return EMPTY_MOVIES;
        const cLower = selectedCountry.toLowerCase();
        return latestMovies.filter((m) => {
          const cList = (m as any).country;
          if (cList && Array.isArray(cList)) {
            return cList.some((c: string) => c.toLowerCase().includes(cLower));
          }
          return (
            (m.name && m.name.toLowerCase().includes(cLower)) ||
            (m.origin_name && m.origin_name.toLowerCase().includes(cLower))
          );
        });
      }

      // 2. Lọc theo Thể Loại nếu có
      if (selectedGenre !== "Tất cả") {
        if (isLoadingGenreQuery) return EMPTY_MOVIES;
        if (genreQueryMovies.length > 0) return genreQueryMovies;
        if (isGenreError) return EMPTY_MOVIES;
        return latestMovies.filter((m) => {
          const catList = (m as any).category;
          if (catList && Array.isArray(catList)) {
            return catList.some((c: string) =>
              c.toLowerCase().includes(selectedGenre.toLowerCase()),
            );
          }
          return (
            (m.name && m.name.toLowerCase().includes(selectedGenre.toLowerCase())) ||
            (m.origin_name && m.origin_name.toLowerCase().includes(selectedGenre.toLowerCase()))
          );
        });
      }

      // 3. Menu điều hướng chính: Phim mới, Phim lẻ, Phim bộ, Hoạt hình, Chiếu rạp
      if (selectedNav === "phim-moi") {
        if (isLoadingNavQuery && navQueryMovies.length === 0) return EMPTY_MOVIES;
        if (navQueryMovies.length > 0) {
          return sortByNewest(mergeMovies([navQueryMovies, latestMovies]));
        }
        if (isLoadingMovies) return EMPTY_MOVIES;
        return sortByNewest(latestMovies);
      }

      if (selectedNav === "phim-bo") {
        if (isLoadingNavQuery) return EMPTY_MOVIES;
        if (isNavError && navQueryMovies.length === 0) return EMPTY_MOVIES;
        const isSeries = (m: MovieCard) => {
          if (m.type === "series") return true;
          if (m.type === "single" || m.type === "hoathinh") return false;
          if (
            m.category &&
            m.category.some((c) => {
              const lc = c.toLowerCase();
              return lc.includes("phim bộ") || lc === "phim-bo";
            })
          )
            return true;
          return Boolean(m.episode_current && m.episode_current.includes("Tập"));
        };
        const inLatest = latestMovies.filter(isSeries);
        if (navQueryMovies.length > 0) {
          return mergeMovies([navQueryMovies, inLatest]);
        }
        return inLatest;
      }

      if (selectedNav === "phim-le") {
        if (isLoadingNavQuery) return EMPTY_MOVIES;
        if (isNavError && navQueryMovies.length === 0) return EMPTY_MOVIES;
        const isSingle = (m: MovieCard) => {
          if (m.type === "single") return true;
          if (m.type === "series" || m.type === "hoathinh") return false;
          if (
            m.category &&
            m.category.some((c) => {
              const lc = c.toLowerCase();
              return lc.includes("phim lẻ") || lc === "phim-le";
            })
          )
            return true;
          return Boolean(
            m.quality?.includes("Bản Rạp") ||
            (m.episode_current &&
              (m.episode_current.includes("Full") || m.episode_current.includes("Hoàn tất"))),
          );
        };
        const inLatest = latestMovies.filter(isSingle);
        if (navQueryMovies.length > 0) {
          return mergeMovies([navQueryMovies, inLatest]);
        }
        return inLatest;
      }

      if (selectedNav === "hoat-hinh") {
        if (isLoadingNavQuery) return EMPTY_MOVIES;
        if (isNavError && navQueryMovies.length === 0) return EMPTY_MOVIES;
        const isAnime = (m: MovieCard) => {
          if (m.type === "hoathinh") return true;
          if (
            m.category &&
            m.category.some((c) => {
              const lc = c.toLowerCase();
              return lc.includes("hoạt hình") || lc.includes("anime") || lc === "hoat-hinh";
            })
          )
            return true;
          return false;
        };
        const inLatest = latestMovies.filter(isAnime);
        if (navQueryMovies.length > 0) {
          return mergeMovies([navQueryMovies, inLatest]);
        }
        return inLatest;
      }

      if (selectedNav === "chieu-rap") {
        if (isLoadingNavQuery) return EMPTY_MOVIES;
        if (isNavError && navQueryMovies.length === 0) return EMPTY_MOVIES;
        const isCinema = (m: MovieCard) => {
          if (m.chieu_rap === true) return true;
          if (
            m.category &&
            m.category.some((c) => {
              const lc = c.toLowerCase();
              return (
                lc.includes("chiếu rạp") || lc.includes("chieu rap") || lc === "phim-chieu-rap"
              );
            })
          )
            return true;
          if (
            m.quality &&
            (m.quality.toLowerCase().includes("rạp") || m.quality.toLowerCase().includes("cam"))
          )
            return true;
          return false;
        };
        const inLatest = latestMovies.filter(isCinema);
        if (navQueryMovies.length > 0) {
          return mergeMovies([navQueryMovies, inLatest]);
        }
        return inLatest;
      }

      return latestMovies;
    })();

    // Đồng bộ tuyệt đối theo Bộ lọc Nguồn cho mọi mục
    if (selectedSource === "all") return rawMovies;
    return rawMovies.filter((m) => m.source === selectedSource);
  }, [
    latestMovies,
    selectedNav,
    selectedGenre,
    selectedCountry,
    selectedSource,
    genreQueryMovies,
    countryQueryMovies,
    navQueryMovies,
    isLoadingGenreQuery,
    isLoadingCountryQuery,
    isLoadingNavQuery,
    isLoadingMovies,
    isGenreError,
    isCountryError,
    isNavError,
  ]);

  const currentNavMeta = useMemo(() => {
    if (selectedCountry) {
      return {
        title: `Phim Quốc Gia: ${selectedCountry}`,
        desc: `Tuyển tập các tác phẩm điện ảnh xuất sắc từ ${selectedCountry}, cập nhật trực tiếp 100% từ API máy chủ thật.`,
        icon: Globe,
      };
    }
    if (selectedGenre !== "Tất cả") {
      return {
        title: `Phim Thể Loại: ${selectedGenre}`,
        desc: `Danh sách phim thể loại ${selectedGenre} tuyển chọn trực tiếp 100% từ API máy chủ thật.`,
        icon: Layers,
      };
    }
    switch (selectedNav) {
      case "phim-moi":
        return {
          title: "Phim Mới Cập Nhật",
          desc: "Tất cả các bộ phim mới nhất vừa được phát hành trên hệ thống các máy chủ API mở.",
          icon: Flame,
        };
      case "phim-le":
        return {
          title: "Phim Lẻ Chọn Lọc",
          desc: "Kho phim điện ảnh, phim lẻ đặc sắc trọn vẹn bản đẹp chất lượng cao từ máy chủ API.",
          icon: Film,
        };
      case "phim-bo":
        return {
          title: "Phim Bộ Đặc Sắc",
          desc: "Các bộ phim truyền hình nhiều tập hấp dẫn, theo dõi tiến độ từng tập phim từ máy chủ API.",
          icon: Tv,
        };
      case "chieu-rap":
        return {
          title: "Phim Chiếu Rạp Bom Tấn",
          desc: "Phim chiếu rạp đình đám, bom tấn phòng vé với chất lượng hình ảnh cao từ máy chủ API.",
          icon: Clapperboard,
        };
      case "hoat-hinh":
        return {
          title: "Phim Hoạt Hình & Anime",
          desc: "Tổng hợp phim hoạt hình 3D, Anime Nhật Bản và phim gia đình đặc sắc từ máy chủ API.",
          icon: Sparkles,
        };
      case "the-loai":
        return {
          title: "Khám Phá Thể Loại Phim",
          desc: "Bộ sưu tập phim theo thể loại phong phú, cập nhật trực tiếp từ máy chủ API.",
          icon: Layers,
        };
      case "quoc-gia":
        return {
          title: "Khám Phá Phim Theo Quốc Gia",
          desc: "Điện ảnh thế giới từ nhiều quốc gia và nền điện ảnh lớn, cập nhật từ máy chủ API.",
          icon: Globe,
        };
      case "yeu-thich":
        return {
          title: "Phim Yêu Thích Của Tôi",
          desc: "Bộ sưu tập phim yêu thích được lưu thật trên trình duyệt của bạn.",
          icon: Heart,
        };
      case "lich-su":
        return {
          title: "Lịch Sử Xem Phim Thật",
          desc: "Ghi nhận trực tiếp từ các tập phim bạn đang xem dở trên trình phát.",
          icon: Clock,
        };
      default:
        return {
          title: "Trang Chủ Mochi Film",
          desc: "Kho phim trực tuyến chất lượng cao từ nhiều nguồn mở.",
          icon: Film,
        };
    }
  }, [selectedCountry, selectedGenre, selectedNav]);

  const currentNavTitle = currentNavMeta.title;
  const NavIcon = currentNavMeta.icon;
  const isHomeView = selectedNav === "trang-chu" && selectedGenre === "Tất cả" && !selectedCountry;

  const scrollRail = (ref: RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -550 : 550;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Bộ lọc Nguồn đồng bộ toàn diện: cập nhật state & đồng bộ URL query parameter
  const handleSelectSource = (newSource: SourceFilter) => {
    setSelectedSource(newSource);
    setShowSourceModal(false);

    // Đồng bộ trực tiếp với TanStack Router
    navigate({
      search: (prev) => ({
        ...prev,
        source: newSource !== "all" ? newSource : undefined,
      }),
      replace: false,
    }).catch(() => {});

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (newSource === "all") {
        params.delete("source");
      } else {
        params.set("source", newSource);
      }
      const queryString = params.toString();
      const newPath = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;
      if (`${window.location.pathname}${window.location.search}` !== newPath) {
        window.history.pushState(window.history.state, "", newPath);
      }
    }
  };

  const navigateToCategory = (
    nav: string,
    genre = "Tất cả",
    country: string | null = null,
    shouldPushHistory = true,
  ) => {
    // 1. Đóng menu mobile và tất cả dropdowns
    setIsSidebarOpenMobile(false);
    setShowGenreDropdown(false);
    setShowCountryDropdown(false);
    setShowSearchDropdown(false);
    setShowNotifications(false);
    setShowUserMenu(false);

    // 2. Cuộn main lên đầu trang
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      mainContentRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
    }

    // 3. Cập nhật state nội bộ
    if (nav === "trang-chu") {
      setSelectedNav("trang-chu");
      setSelectedGenre("Tất cả");
      setSelectedCountry(null);
      setSearchQuery("");
      setSearchResults([]);
    } else {
      setSelectedNav(nav);
      setSelectedGenre(genre);
      setSelectedCountry(country);
    }

    // 4. Đồng bộ URL query parameters để refresh / back-forward giữ nguyên trạng thái
    if (shouldPushHistory) {
      const nextSearch: HomeSearchParams = {};

      if (nav !== "trang-chu") {
        nextSearch.nav = nav;
        if (genre && genre !== "Tất cả") {
          nextSearch.genre = genre;
        }
        if (country) {
          nextSearch.country = country;
        }
      }

      // Giữ nguyên nguồn phim đang chọn (Đồng bộ bộ lọc Nguồn cho mọi mục)
      if (selectedSource && selectedSource !== "all") {
        nextSearch.source = selectedSource;
      }

      // Giữ nguyên q nếu đang tìm kiếm và không phải về trang chủ
      if (nav !== "trang-chu" && searchQuery.trim()) {
        nextSearch.q = searchQuery.trim();
      }

      // Cập nhật router state và URL bằng TanStack Router
      navigate({
        search: nextSearch,
        replace: false,
      }).catch(() => {});

      if (typeof window !== "undefined") {
        const params = new URLSearchParams();

        if (nav !== "trang-chu") {
          params.set("nav", nav);
          if (genre && genre !== "Tất cả") {
            params.set("genre", genre);
          }
          if (country) {
            params.set("country", country);
          }
        }

        // Giữ nguyên nguồn phim đang chọn (Đồng bộ bộ lọc Nguồn cho mọi mục)
        if (selectedSource && selectedSource !== "all") {
          params.set("source", selectedSource);
        }

        if (nav !== "trang-chu" && searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }

        const queryString = params.toString();
        const newPath = queryString
          ? `${window.location.pathname}?${queryString}`
          : window.location.pathname;

        if (`${window.location.pathname}${window.location.search}` !== newPath) {
          window.history.pushState(
            { nav, genre, country, source: selectedSource, q: nextSearch.q },
            "",
            newPath,
          );
        }
      }
    }
  };

  // Đồng bộ URL query khi tải lại trang (refresh) và khi bấm nút Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStateFromUrl = (shouldScroll = false) => {
      const params = new URLSearchParams(window.location.search);
      const navParam = params.get("nav") || params.get("tab");
      const genreParam = params.get("genre");
      const countryParam = params.get("country");
      const sourceParam = params.get("source") as SourceFilter | null;
      const qParam = params.get("q");

      if (
        sourceParam &&
        (sourceParam === "all" || sourceParam === "kkphim" || sourceParam === "nguonc")
      ) {
        setSelectedSource(sourceParam);
      }

      if (!navParam || navParam === "trang-chu") {
        setSelectedNav("trang-chu");
        setSelectedGenre("Tất cả");
        setSelectedCountry(null);
      } else {
        setSelectedNav(navParam);
        setSelectedGenre(genreParam || "Tất cả");
        setSelectedCountry(countryParam || null);
      }

      if (qParam !== null) {
        setSearchQuery(qParam);
        if (qParam.trim().length > 0) {
          setShowSearchDropdown(true);
        }
      }

      setIsSidebarOpenMobile(false);
      setShowGenreDropdown(false);
      setShowCountryDropdown(false);
      setShowSearchDropdown(false);
      setShowNotifications(false);
      setShowUserMenu(false);

      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        mainContentRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
      }
    };

    // Khởi tạo trạng thái từ URL khi tải trang / refresh
    syncStateFromUrl(false);

    // Lắng nghe sự kiện popstate (Back/Forward trên trình duyệt)
    const handlePopState = () => {
      syncStateFromUrl(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#09090d] text-zinc-100 font-sans antialiased selection:bg-pink-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR TRÁI 268px                                            */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[268px] min-w-[268px] max-w-[268px] flex flex-col justify-between bg-[#0e0e14]/95 backdrop-blur-2xl border-r border-white/[0.06] transition-transform duration-300 ease-in-out ${
          isSidebarOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        {/* Logo Wordmark Chính Thức */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3.5 border-b border-white/[0.04]">
          <div
            role="button"
            tabIndex={0}
            aria-label="Về trang chủ Mochi Film"
            onClick={() => {
              navigateToCategory("trang-chu");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigateToCategory("trang-chu");
              }
            }}
            className="flex items-center justify-center cursor-pointer group flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-xl"
          >
            <div className="flex items-center justify-center h-[60px] lg:h-[82px] w-full">
              <img
                src="/assets/mochi/wordmark.webp"
                alt="Mochi Film"
                className="w-[72px] h-[58px] lg:w-[205px] lg:h-[78px] max-w-full object-contain drop-shadow-[0_8px_16px_rgba(255,79,131,0.16)] group-hover:drop-shadow-[0_10px_20px_rgba(255,79,131,0.24)] group-hover:scale-[1.015] transition-all duration-200"
              />
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpenMobile(false)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-4 no-scrollbar">
          {/* MENU CHÍNH (Hệ thống điều hướng duy nhất) */}
          <div>
            <p className="px-3 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Menu chính
            </p>
            <nav className="space-y-1">
              {/* 1. Trang chủ */}
              <button
                onClick={() => {
                  navigateToCategory("trang-chu");
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer ${
                  selectedNav === "trang-chu" && selectedGenre === "Tất cả" && !selectedCountry
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Compass
                  className={`w-4 h-4 transition duration-200 ${
                    selectedNav === "trang-chu" && selectedGenre === "Tất cả" && !selectedCountry
                      ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      : "text-zinc-400 group-hover:text-pink-400"
                  }`}
                />
                <span>Trang chủ</span>
                {selectedNav === "trang-chu" && selectedGenre === "Tất cả" && !selectedCountry && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                )}
              </button>

              {/* 2. Phim mới */}
              <button
                onClick={() => {
                  navigateToCategory("phim-moi");
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer ${
                  selectedNav === "phim-moi"
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Flame
                  className={`w-4 h-4 transition duration-200 ${
                    selectedNav === "phim-moi"
                      ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      : "text-zinc-400 group-hover:text-pink-400"
                  }`}
                />
                <span>Phim mới</span>
                {selectedNav === "phim-moi" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                )}
              </button>

              {/* 3. Phim lẻ */}
              <button
                onClick={() => {
                  navigateToCategory("phim-le");
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer ${
                  selectedNav === "phim-le"
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Film
                  className={`w-4 h-4 transition duration-200 ${
                    selectedNav === "phim-le"
                      ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      : "text-zinc-400 group-hover:text-pink-400"
                  }`}
                />
                <span>Phim lẻ</span>
                {selectedNav === "phim-le" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                )}
              </button>

              {/* 4. Phim bộ */}
              <button
                onClick={() => {
                  navigateToCategory("phim-bo");
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer ${
                  selectedNav === "phim-bo"
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Tv
                  className={`w-4 h-4 transition duration-200 ${
                    selectedNav === "phim-bo"
                      ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      : "text-zinc-400 group-hover:text-pink-400"
                  }`}
                />
                <span>Phim bộ</span>
                {selectedNav === "phim-bo" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                )}
              </button>

              {/* 5. Chiếu rạp */}
              <button
                onClick={() => {
                  navigateToCategory("chieu-rap");
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer ${
                  selectedNav === "chieu-rap"
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Clapperboard
                  className={`w-4 h-4 transition duration-200 ${
                    selectedNav === "chieu-rap"
                      ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      : "text-zinc-400 group-hover:text-pink-400"
                  }`}
                />
                <span>Chiếu rạp</span>
                {selectedNav === "chieu-rap" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                )}
              </button>

              {/* 6. Hoạt hình */}
              <button
                onClick={() => {
                  navigateToCategory("hoat-hinh");
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer ${
                  selectedNav === "hoat-hinh"
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Sparkles
                  className={`w-4 h-4 transition duration-200 ${
                    selectedNav === "hoat-hinh"
                      ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      : "text-zinc-400 group-hover:text-pink-400"
                  }`}
                />
                <span>Hoạt hình</span>
                {selectedNav === "hoat-hinh" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                )}
              </button>

              {/* 7. Thể Loại */}
              <div ref={genreDropdownRef} className="relative">
                <button
                  ref={genreButtonRef}
                  id="genre-dropdown-trigger"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={showGenreDropdown}
                  aria-controls="genre-dropdown-menu"
                  onClick={() => {
                    setShowGenreDropdown(!showGenreDropdown);
                    setShowCountryDropdown(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && !showGenreDropdown) {
                      e.preventDefault();
                      setShowGenreDropdown(true);
                      setShowCountryDropdown(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    showGenreDropdown || selectedGenre !== "Tất cả" || selectedNav === "the-loai"
                      ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Layers
                      className={`w-4 h-4 transition duration-200 shrink-0 ${
                        showGenreDropdown ||
                        selectedGenre !== "Tất cả" ||
                        selectedNav === "the-loai"
                          ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                          : "text-zinc-400 group-hover:text-pink-400"
                      }`}
                    />
                    <span className="truncate">
                      {selectedGenre !== "Tất cả" ? selectedGenre : "Thể loại"}
                    </span>
                  </div>
                  {showGenreDropdown ? (
                    <ChevronUp className="w-4 h-4 text-zinc-300 shrink-0 ml-1" />
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {(selectedGenre !== "Tất cả" || selectedNav === "the-loai") && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                      )}
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </button>

                {/* Dropdown Thể Loại */}
                {showGenreDropdown && (
                  <div
                    id="genre-dropdown-menu"
                    role="region"
                    aria-labelledby="genre-dropdown-trigger"
                    tabIndex={-1}
                    className="mt-2 p-3 rounded-2xl bg-[#12131b]/98 border border-white/[0.08] shadow-xl shadow-black/80 animate-in fade-in duration-150"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pb-2 mb-2 border-b border-white/[0.06] flex items-center justify-between">
                      <span>THỂ LOẠI PHIM</span>
                      {(selectedGenre !== "Tất cả" || selectedNav === "the-loai") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToCategory("trang-chu");
                          }}
                          aria-label="Đặt lại thể loại, phục hồi danh sách"
                          className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold cursor-pointer flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded px-1.5 py-0.5 bg-pink-500/10 hover:bg-pink-500/20 transition"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Đặt lại</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5" role="menu">
                      {NAVBAR_GENRES.map((g) => {
                        const Icon = g.icon;
                        const isSelected = selectedGenre === g.name;
                        return (
                          <button
                            key={g.name}
                            type="button"
                            role="menuitem"
                            aria-current={isSelected ? "true" : undefined}
                            onClick={() => {
                              navigateToCategory("the-loai", g.name);
                            }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                              isSelected
                                ? "bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30"
                                : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-300 group-hover:scale-110 transition-transform shrink-0" />
                            <span className="text-xs truncate">{g.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 8. Quốc Gia */}
              <div ref={countryDropdownRef} className="relative">
                <button
                  ref={countryButtonRef}
                  id="country-dropdown-trigger"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={showCountryDropdown}
                  aria-controls="country-dropdown-menu"
                  onClick={() => {
                    setShowCountryDropdown(!showCountryDropdown);
                    setShowGenreDropdown(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && !showCountryDropdown) {
                      e.preventDefault();
                      setShowCountryDropdown(true);
                      setShowGenreDropdown(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    showCountryDropdown || Boolean(selectedCountry) || selectedNav === "quoc-gia"
                      ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe
                      className={`w-4 h-4 transition duration-200 shrink-0 ${
                        showCountryDropdown ||
                        Boolean(selectedCountry) ||
                        selectedNav === "quoc-gia"
                          ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                          : "text-zinc-400 group-hover:text-pink-400"
                      }`}
                    />
                    <span className="truncate">
                      {selectedCountry ? selectedCountry : "Quốc gia"}
                    </span>
                  </div>
                  {showCountryDropdown ? (
                    <ChevronUp className="w-4 h-4 text-zinc-300 shrink-0 ml-1" />
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {(Boolean(selectedCountry) || selectedNav === "quoc-gia") && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
                      )}
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </button>

                {/* Dropdown Quốc Gia */}
                {showCountryDropdown && (
                  <div
                    id="country-dropdown-menu"
                    role="region"
                    aria-labelledby="country-dropdown-trigger"
                    tabIndex={-1}
                    className="mt-2 p-3 rounded-2xl bg-[#12131b]/98 border border-white/[0.08] shadow-xl shadow-black/80 animate-in fade-in duration-150"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pb-2 mb-2 border-b border-white/[0.06] flex items-center justify-between">
                      <span>PHIM THEO QUỐC GIA</span>
                      {(Boolean(selectedCountry) || selectedNav === "quoc-gia") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToCategory("trang-chu");
                          }}
                          aria-label="Đặt lại quốc gia, phục hồi danh sách"
                          className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold cursor-pointer flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded px-1.5 py-0.5 bg-pink-500/10 hover:bg-pink-500/20 transition"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Đặt lại</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5" role="menu">
                      {NAVBAR_COUNTRIES.map((c) => {
                        const isSelected = selectedCountry === c.name;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            role="menuitem"
                            aria-current={isSelected ? "true" : undefined}
                            onClick={() => {
                              navigateToCategory("quoc-gia", "Tất cả", c.name);
                            }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                              isSelected
                                ? "bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30"
                                : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                            }`}
                          >
                            <span
                              className={`text-xs font-bold tracking-wider w-6 shrink-0 ${
                                isSelected
                                  ? "text-rose-400"
                                  : "text-zinc-400 group-hover:text-zinc-200"
                              }`}
                            >
                              {c.code}
                            </span>
                            <span
                              className={`text-xs truncate ${
                                isSelected
                                  ? "text-rose-200 font-semibold"
                                  : "text-zinc-200 group-hover:text-white"
                              }`}
                            >
                              {c.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* BỘ SƯU TẬP */}
          <div>
            <p className="px-3 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Bộ sưu tập
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  navigateToCategory("yeu-thich");
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 group ${
                  selectedNav === "yeu-thich"
                    ? "text-white bg-gradient-to-r from-pink-500/20 to-transparent border-l-[3px] border-pink-500"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart
                    className={`w-4 h-4 ${
                      selectedNav === "yeu-thich"
                        ? "text-pink-400"
                        : "text-zinc-400 group-hover:text-pink-400"
                    }`}
                  />
                  <span>Yêu thích</span>
                </div>
                {favorites.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    {favorites.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  navigateToCategory("lich-su");
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 group ${
                  selectedNav === "lich-su"
                    ? "text-white bg-gradient-to-r from-pink-500/20 to-transparent border-l-[3px] border-pink-500"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock
                    className={`w-4 h-4 ${
                      selectedNav === "lich-su"
                        ? "text-pink-400"
                        : "text-zinc-400 group-hover:text-pink-400"
                    }`}
                  />
                  <span>Lịch sử xem</span>
                </div>
                {continueList.length > 0 && (
                  <span className="text-[11px] text-zinc-400">{continueList.length} phim</span>
                )}
              </button>
            </nav>
          </div>

          {/* HỆ THỐNG */}
          <div>
            <p className="px-3 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Hệ thống
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setShowSourceModal(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-zinc-400 group-hover:text-pink-400" />
                  <span>Nguồn phim</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-mono text-emerald-400 uppercase">
                    {selectedSource === "all" ? "Tất cả" : selectedSource}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Phần Mascot + Mua VIP cố định ở chân sidebar (Luôn hiển thị trên mọi độ phân giải) */}
        <div className="shrink-0 px-3 pb-3 pt-0.5 border-t border-white/[0.04] bg-[#0c0c12]/95 backdrop-blur-md">
          {/* Mascot Ghế (Mochi ngồi ghế cầm bắp rang) ngay phía trên panel Premium */}
          <div className="relative flex items-end justify-center -mb-2 z-10 pointer-events-none select-none">
            <img
              src="/assets/mochi/mascot-chair.webp"
              alt="Mochi ngồi ghế cầm bắp rang"
              className="w-[110px] lg:w-[220px] max-h-[85px] sm:max-h-[95px] lg:max-h-[105px] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.44)] mascot-floaty motion-reduce:animate-none"
            />
          </div>

          {/* Mascot / Premium Panel (Honest status: Chưa kết nối backend) */}
          <div className="relative p-3 rounded-2xl bg-gradient-to-b from-pink-950/40 via-zinc-900/70 to-zinc-950/90 border border-pink-500/25 overflow-hidden shadow-lg shadow-pink-950/20 text-left">
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-pink-400" />
                  <span className="font-extrabold text-xs text-white tracking-wide">Mochi VIP</span>
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Chưa nối backend
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                Xem phim miễn phí từ các nguồn mở. Gói VIP và máy chủ 4K riêng đang phát triển.
              </p>

              <button
                onClick={() => setShowVipNoticeModal(true)}
                className="mt-1 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>Mua VIP / Chi tiết tính năng VIP</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpenMobile && (
        <div
          onClick={() => setIsSidebarOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden cursor-pointer"
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEW AREA                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 min-w-0 lg:ml-[268px] flex flex-col min-h-screen">
        {/* TOPBAR (Thanh công cụ duy nhất, không tạo nav ngang riêng) */}
        <header className="sticky top-0 z-40 h-20 px-4 sm:px-8 flex items-center justify-between bg-[#09090d]/85 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Live Search Input */}
            <div ref={searchContainerRef} className="relative w-full">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowSearchDropdown(true);
                      const trimmedQ = searchQuery.trim();
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          q: trimmedQ || undefined,
                        }),
                        replace: false,
                      }).catch(() => {});
                    }
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Tìm kiếm phim bom tấn, anime, diễn viên..."
                  className="w-full h-11 pl-10 pr-12 rounded-xl bg-[#13131b] border border-white/[0.07] text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition shadow-inner"
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          q: undefined,
                        }),
                        replace: false,
                      }).catch(() => {});
                    }}
                    className="absolute right-3.5 p-0.5 rounded-full text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Ctrl K
                    </kbd>
                  </div>
                )}
              </div>

              {/* Instant Search Dropdown */}
              {showSearchDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-[#12121a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 z-50 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-zinc-400 flex items-center justify-between border-b border-white/[0.04]">
                    <span>Kết quả tìm kiếm cho "{searchQuery}"</span>
                    {isSearching && (
                      <span className="text-pink-400 animate-pulse text-[11px]">Đang tìm...</span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.03]">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <div
                          key={item.slug}
                          role="button"
                          tabIndex={0}
                          aria-label={`Xem thông tin phim ${item.name}`}
                          onClick={() => {
                            openMovieDetail(item);
                            setShowSearchDropdown(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openMovieDetail(item);
                              setShowSearchDropdown(false);
                            }
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer transition group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                        >
                          <img
                            src={item.poster || item.thumb}
                            alt={item.name}
                            className="w-11 h-14 object-cover rounded-lg bg-zinc-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-pink-400 transition truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-zinc-400 truncate">
                              {item.origin_name || item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                {item.year || "2026"}
                              </span>
                              <span className="text-[10px] text-pink-400 font-semibold uppercase">
                                {item.source}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSearchDropdown(false);
                              navigate({
                                to: "/watch/$slug",
                                params: { slug: item.slug },
                                search: {
                                  source:
                                    item.source ||
                                    (selectedSource !== "all"
                                      ? (selectedSource as SourceId)
                                      : "kkphim"),
                                },
                              });
                            }}
                            className="w-8 h-8 rounded-lg bg-pink-500/15 hover:bg-pink-500 text-pink-400 hover:text-white flex items-center justify-center shrink-0 transition"
                            title="Xem ngay"
                            aria-label={`Xem ngay phim ${item.name}`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        {isSearching
                          ? "Đang quét các máy chủ phim..."
                          : "Không tìm thấy phim phù hợp"}
                      </div>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        const trimmedQ = searchQuery.trim();
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            q: trimmedQ || undefined,
                          }),
                          replace: false,
                        }).catch(() => {});
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setShowSearchDropdown(false);
                          const trimmedQ = searchQuery.trim();
                          navigate({
                            search: (prev) => ({
                              ...prev,
                              q: trimmedQ || undefined,
                            }),
                            replace: false,
                          }).catch(() => {});
                        }
                      }}
                      className="px-3 py-2 text-center text-xs font-semibold text-pink-400 hover:text-pink-300 hover:bg-white/[0.04] border-t border-white/[0.04] cursor-pointer transition"
                    >
                      Xem tất cả kết quả cho "{searchQuery.trim()}" ›
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Topbar Tools */}
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={() => setShowSourceModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#13131b] hover:bg-[#181822] border border-white/[0.08] text-xs font-semibold text-zinc-200 transition group shadow-sm cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="hidden sm:inline text-zinc-400">Nguồn:</span>
              <span className="text-pink-400 font-bold uppercase">
                {selectedSource === "all" ? "Tất cả" : selectedSource}
              </span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 ml-0.5" />
            </button>

            {/* Notification Bell (Real Supabase Notifications) */}
            <div ref={notificationDropdownRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-[#13131b] hover:bg-[#181822] border border-white/[0.08] text-zinc-300 hover:text-white transition cursor-pointer"
                aria-label={
                  unreadNotificationCount > 0
                    ? `Thông báo (${unreadNotificationCount} chưa đọc)`
                    : "Thông báo"
                }
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-pink-600 text-white text-[10px] font-bold shadow-md shadow-pink-600/40">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#12121a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-3.5 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                        Thông báo
                      </span>
                      {unreadNotificationCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold">
                          {unreadNotificationCount} mới
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-pink-400 hover:text-pink-300 font-semibold cursor-pointer"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                    {!user ? (
                      <div className="py-8 px-4 text-center space-y-2">
                        <Bell className="w-8 h-8 mx-auto text-zinc-600 stroke-[1.5]" />
                        <p className="text-xs font-bold text-zinc-300">Chưa đăng nhập</p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[240px] mx-auto">
                          Đăng nhập để nhận thông báo tự động khi các bộ phim bạn theo dõi có tập
                          mới.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            navigate({ to: "/auth" });
                          }}
                          className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-pink-500/25 transition cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Đăng nhập ngay</span>
                        </button>
                      </div>
                    ) : realNotifications.length === 0 ? (
                      <div className="py-8 px-4 text-center space-y-2">
                        <Bell className="w-8 h-8 mx-auto text-zinc-600 stroke-[1.5]" />
                        <p className="text-xs font-bold text-zinc-300">Không có thông báo nào</p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[240px] mx-auto">
                          Hệ thống sẽ gửi thông báo đến bạn khi có tập phim mới từ máy chủ.
                        </p>
                      </div>
                    ) : (
                      realNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n);
                            if (n.slug) {
                              openMovieDetail({
                                slug: n.slug,
                                source: (n.source as SourceId) || "kkphim",
                              });
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl transition cursor-pointer flex gap-3 items-start ${
                            n.read
                              ? "bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400"
                              : "bg-pink-600/10 hover:bg-pink-600/15 border border-pink-500/20 text-zinc-200"
                          }`}
                        >
                          {n.poster ? (
                            <img
                              src={n.poster}
                              alt=""
                              className="w-10 h-13 object-cover rounded-lg bg-zinc-800 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                              <Bell className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold truncate text-zinc-100">
                                {n.title}
                              </h4>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 shadow-[0_0_6px_#ec4899]" />
                              )}
                            </div>
                            {n.body && (
                              <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                                {n.body}
                              </p>
                            )}
                            <span className="text-[10px] text-zinc-400 mt-1 block">
                              {new Date(n.created_at).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Topbar User Avatar & Account Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative w-[42px] h-[42px] min-w-[42px] min-h-[42px] rounded-full border-2 border-[#ff6b95]/50 hover:border-[#ff6b95] bg-[#24161f] overflow-hidden shadow-sm shadow-pink-500/20 transition duration-300 cursor-pointer shrink-0 flex items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                title={currentUser?.name || currentUser?.email || "Tài khoản Mochi"}
                aria-label="Tài khoản Mochi"
              >
                <img
                  src="/assets/mochi/mascot-mini.png"
                  alt="Mochi Mascot Avatar"
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#09090d]" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#12121a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in duration-150 p-2 space-y-1">
                  <div className="p-3 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-pink-500/40 bg-pink-950/40 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src="/assets/mochi/mascot-mini.png"
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">
                        {currentUser?.name || currentUser?.email || "Chưa đăng nhập"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${currentUser ? "bg-emerald-400" : "bg-zinc-500"}`}
                        />
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {currentUser ? "Đã đăng nhập (Nguồn mở)" : "Khách truy cập"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!currentUser && (
                    <div className="p-1.5 border-b border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate({ to: "/auth" });
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff5c8a] to-[#ff3b6f] hover:from-[#ff4d7e] hover:to-[#f52b61] shadow-md shadow-pink-500/25 transition cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Đăng nhập / Đăng ký</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigateToCategory("yeu-thich");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-3.5 h-3.5 text-pink-400" />
                        <span>Phim yêu thích</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold">
                        {favorites.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigateToCategory("lich-su");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-pink-400" />
                        <span>Lịch sử xem phim</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{continueList.length} phim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSourceModal(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cấu hình nguồn phim</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 uppercase font-mono">
                        {selectedSource === "all" ? "Tất cả" : selectedSource}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowVipNoticeModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-pink-400" />
                      <span>Thông tin Mochi VIP</span>
                    </button>

                    {currentUser && (
                      <div className="pt-1 mt-1 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={async () => {
                            setShowUserMenu(false);
                            await signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-400" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* BODY CONTENT BY NAVIGATION TAB                                */}
        {/* ------------------------------------------------------------- */}
        <main ref={mainContentRef} className="flex-1 px-4 sm:px-8 py-6 space-y-10">
          {/* TAB 1: YÊU THÍCH (Favorites) */}
          {selectedNav === "yeu-thich" && (
            <FavoritesTab
              favorites={favorites}
              displayedFavorites={displayedFavorites}
              selectedSource={selectedSource}
              onSelectSource={handleSelectSource}
              onOpenMovieDetail={openMovieDetail}
              onConfirmDeleteFavorite={confirmDeleteFavorite}
              onConfirmClearAllFavorites={confirmClearAllFavorites}
              onNavigateHome={() => navigateToCategory("trang-chu")}
            />
          )}

          {/* TAB 2: LỊCH SỬ XEM (History) */}
          {selectedNav === "lich-su" && (
            <HistoryTab
              continueList={continueList}
              displayedContinueList={displayedContinueList}
              selectedSource={selectedSource}
              onSelectSource={handleSelectSource}
              onOpenMovieDetail={openMovieDetail}
              onConfirmDeleteHistoryItem={confirmDeleteHistoryItem}
              onConfirmClearAllHistory={confirmClearAllHistory}
              onNavigateHome={() => navigateToCategory("trang-chu")}
            />
          )}

          {/* TAB 3: TRANG CHỦ & PHIM LẺ / PHIM BỘ / HOẠT HÌNH */}
          {selectedNav !== "yeu-thich" && selectedNav !== "lich-su" && (
            <>
              {/* ERROR RETRY STATE */}
              {isMoviesError && latestMovies.length === 0 && (
                <div className="py-16 px-6 text-center space-y-4 bg-[#12121a]/60 rounded-3xl border border-rose-500/20 max-w-lg mx-auto my-6">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">
                      Không thể kết nối máy chủ phim
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Đã xảy ra lỗi khi tải danh sách phim từ máy chủ. Vui lòng thử lại.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => refetchMovies()}
                      className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition cursor-pointer min-h-[44px] flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Thử lại ngay</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* PHẦN 1: GIAO DIỆN TRANG CHỦ (Chỉ hiển thị khi đang ở Trang Chủ)  */}
              {/* ============================================================= */}
              {isHomeView && (
                <div className="space-y-10">
                  {/* HERO BANNER (Dữ liệu thật từ API) */}
                  {currentHero ? (
                    <section className="relative w-full rounded-3xl overflow-hidden border border-white/[0.07] bg-[#111118] min-h-[460px] md:min-h-[520px] flex items-end shadow-2xl">
                      <div className="absolute inset-0 z-0">
                        <img
                          src={
                            heroDetail?.backdrop ||
                            currentHero.backdrop ||
                            currentHero.thumb ||
                            currentHero.poster
                          }
                          alt={currentHero.name}
                          className="w-full h-full object-cover object-center filter brightness-90 transition-all duration-700 transform scale-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-[#09090d]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#09090d] via-[#09090d]/70 to-transparent" />
                      </div>

                      <div className="relative z-10 p-6 sm:p-10 md:p-12 max-w-3xl space-y-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-600/30">
                            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                            #1 Thịnh Hành Hôm Nay
                          </span>
                          {currentHero.vote_average !== undefined &&
                            currentHero.vote_average > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {currentHero.vote_average}
                              </span>
                            )}
                          <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold">
                            {currentHero.year || "2026"}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
                            {currentHero.quality || "4K Ultra HD"}
                          </span>
                          {(heroDetail?.genres || currentHero.category || [])
                            .slice(0, 3)
                            .map((g) => (
                              <span
                                key={g}
                                className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold"
                              >
                                {g}
                              </span>
                            ))}
                        </div>

                        <div className="space-y-1">
                          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                            {currentHero.name}
                          </h1>
                          {currentHero.origin_name && (
                            <p className="text-sm md:text-base font-medium text-pink-300/80 italic">
                              {currentHero.origin_name}
                            </p>
                          )}
                        </div>

                        <p className="text-sm md:text-base text-zinc-300 line-clamp-3 max-w-2xl leading-relaxed">
                          {heroDetail?.synopsis || currentHero.desc}
                        </p>

                        <div className="flex flex-wrap items-center gap-3.5 pt-3">
                          <button
                            onClick={() => openMovieDetail(currentHero)}
                            className="px-7 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm shadow-xl shadow-pink-600/40 pink-glow-sm flex items-center gap-2.5 transition duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                            <span>Xem ngay</span>
                          </button>

                          <button
                            onClick={() => toggleFavorite(currentHero)}
                            className={`px-5 py-3 rounded-2xl border font-semibold text-sm backdrop-blur-xl flex items-center gap-2 transition duration-200 cursor-pointer ${
                              isCurrentHeroFavorite
                                ? "bg-pink-600/20 border-pink-500 text-pink-300"
                                : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                            }`}
                          >
                            {isCurrentHeroFavorite ? (
                              <>
                                <Check className="w-4 h-4 text-pink-400" />
                                <span>Đã lưu</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Danh sách của tôi</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Hero switchers */}
                      {currentHeroList.length > 1 && (
                        <div className="absolute right-4 bottom-4 md:right-52 md:bottom-6 hidden md:flex items-center gap-2 z-20 bg-black/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                          {currentHeroList.map((hero, idx) => (
                            <button
                              key={hero.slug}
                              onClick={() => setActiveHeroIndex(idx)}
                              className={`relative w-12 h-8 rounded-xl overflow-hidden transition-all duration-300 border-2 cursor-pointer ${
                                activeHeroIndex === idx
                                  ? "border-pink-500 scale-105 shadow-md shadow-pink-500/50"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={hero.thumb || hero.poster}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mascot bóng tim Hero (Desktop ~175px, Mobile ~100px) */}
                      <div className="absolute right-2 sm:right-6 md:right-10 bottom-0 md:-bottom-2 z-10 pointer-events-none select-none flex items-end">
                        <img
                          src="/assets/mochi/mascot-balloon.webp"
                          alt="Mochi bay cùng bóng tim"
                          className="w-[100px] md:w-[175px] h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
                        />
                      </div>
                    </section>
                  ) : (
                    <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.07] bg-[#111118] min-h-[460px] md:min-h-[520px] flex items-end p-8 animate-pulse">
                      <div className="space-y-4 max-w-xl w-full">
                        <div className="h-6 w-32 rounded-full bg-zinc-800" />
                        <div className="h-10 w-3/4 rounded-xl bg-zinc-800" />
                        <div className="h-4 w-1/2 rounded bg-zinc-800" />
                        <div className="h-14 w-full rounded-xl bg-zinc-800/60" />
                        <div className="flex gap-3 pt-2">
                          <div className="h-12 w-32 rounded-2xl bg-zinc-800" />
                          <div className="h-12 w-36 rounded-2xl bg-zinc-800" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CHIP THỂ LOẠI */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <span>Khám phá thể loại</span>
                      </h3>
                      <span className="text-xs text-zinc-400">Chọn để lọc nhanh</span>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                      {dynamicGenreChips.map((genre) => {
                        const isSelected = selectedGenre === genre;
                        return (
                          <button
                            key={genre}
                            onClick={() => {
                              if (genre === "Tất cả") {
                                navigateToCategory("trang-chu");
                              } else {
                                navigateToCategory("the-loai", genre);
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white pink-glow-sm shadow-pink-500/30 font-bold"
                                : "bg-[#13131b] hover:bg-[#1c1c27] text-zinc-400 hover:text-zinc-100 border border-white/[0.06]"
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* RAIL 1: PHIM ĐANG THỊNH HÀNH */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-pink-500 to-rose-600" />
                        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-pink-400" />
                          <span>Phim Đang Thịnh Hành</span>
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-bold hidden sm:inline">
                          Top 10 Hôm Nay
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => scrollRail(trendingRailRef, "left")}
                          className="p-2 rounded-xl bg-[#13131b] hover:bg-[#1a1a24] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
                          aria-label="Cuộn trái"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollRail(trendingRailRef, "right")}
                          className="p-2 rounded-xl bg-[#13131b] hover:bg-[#1a1a24] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
                          aria-label="Cuộn phải"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isLoadingMovies && trendingMovies.length === 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-none w-[200px] sm:w-[220px] space-y-3 animate-pulse"
                          >
                            <div className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/[0.04]" />
                            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
                            <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        ref={trendingRailRef}
                        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
                      >
                        {trendingMovies.map((movie, index) => {
                          const rankNumber = String(index + 1).padStart(2, "0");
                          return (
                            <div
                              key={`${movie.source}-${movie.slug}`}
                              onClick={() => openMovieDetail(movie)}
                              className="relative flex-none w-[200px] sm:w-[220px] group cursor-pointer"
                            >
                              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.07] group-hover:border-pink-500/60 transition-all duration-300 shadow-lg group-hover:shadow-2xl group-hover:shadow-pink-900/20 group-hover:-translate-y-1.5">
                                <img
                                  src={movie.poster || movie.thumb}
                                  alt={movie.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                  {movie.vote_average !== undefined && movie.vote_average > 0 ? (
                                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-current" />
                                      {movie.vote_average}
                                    </span>
                                  ) : (
                                    <span />
                                  )}
                                  {movie.quality && (
                                    <span className="px-2 py-0.5 rounded-md bg-pink-600/80 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                                      {movie.quality}
                                    </span>
                                  )}
                                </div>

                                <div className="absolute -bottom-3 -left-1 z-10 pointer-events-none select-none">
                                  <span className="text-6xl sm:text-7xl font-black italic tracking-tighter text-stroke-rank drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                                    {rankNumber}
                                  </span>
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white flex items-center justify-center pink-glow shadow-xl shadow-pink-600/50 transform scale-75 group-hover:scale-100 transition duration-300">
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 space-y-1 pl-1">
                                <h4 className="text-sm font-bold text-zinc-100 group-hover:text-pink-400 transition truncate">
                                  {movie.name}
                                </h4>
                                <div className="flex items-center justify-between text-xs text-zinc-400">
                                  <span className="truncate">{movie.year || "2026"}</span>
                                  <span className="text-[11px] text-pink-400/90 font-medium">
                                    {movie.episode_current || "Full HD"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* RAIL 2: XEM TIẾP (CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU THẬT - ẨN NẾU RỖNG) */}
                  {displayedContinueList.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-pink-500 to-rose-600" />
                          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            <Clock className="w-5 h-5 text-pink-400" />
                            <span>Xem Tiếp (Lịch Sử Thật)</span>
                          </h2>
                          <span className="text-xs text-zinc-400 hidden sm:inline">
                            Tiếp tục trải nghiệm
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateToCategory("lich-su")}
                          className="text-xs text-pink-400 hover:text-pink-300 font-semibold cursor-pointer"
                        >
                          Xem tất cả ({continueList.length})
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {displayedContinueList.slice(0, 4).map((item) => (
                          <div
                            key={item.slug}
                            onClick={() => openMovieDetail(item)}
                            className="group relative rounded-2xl overflow-hidden bg-[#12121a] border border-white/[0.06] hover:border-pink-500/50 transition duration-300 cursor-pointer shadow-md"
                          >
                            <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                              <img
                                src={item.thumb}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                                <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center pink-glow-sm">
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                </div>
                              </div>
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-300 uppercase">
                                  {item.source}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                                  {item.episode_name}
                                </span>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800/80">
                                <div
                                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-r-full"
                                  style={{ width: `${item.progressPercent}%` }}
                                />
                              </div>
                            </div>

                            <div className="p-3.5 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-zinc-100 group-hover:text-pink-400 transition truncate flex-1">
                                  {item.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteHistoryItem(item);
                                  }}
                                  className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
                                  title="Xóa khỏi lịch sử"
                                  aria-label={`Xóa ${item.name} khỏi lịch sử`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span>{item.durationLeft}</span>
                                <span className="text-[11px] font-semibold text-pink-400">
                                  {item.progressPercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* RAIL 3: PHIM MỚI CẬP NHẬT TRÊN TRANG CHỦ */}
                  <section ref={categorySectionRef} className="space-y-4 scroll-mt-24">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-pink-500 to-rose-600 shrink-0" />
                        <div>
                          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            <Flame className="w-5 h-5 text-pink-400 shrink-0" />
                            <span>Phim Mới Cập Nhật</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold hidden sm:inline ml-2">
                              {displayedMovies.length} Phim
                            </span>
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Bộ chọn nguồn máy chủ nhanh ngay trên Trang Chủ */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                            Nguồn:
                          </span>
                          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08]">
                            {(["all", "kkphim", "nguonc"] as SourceFilter[]).map((srcId) => {
                              const active = selectedSource === srcId;
                              return (
                                <button
                                  key={srcId}
                                  type="button"
                                  onClick={() => handleSelectSource(srcId)}
                                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    active
                                      ? "bg-pink-600 text-white shadow-sm"
                                      : "text-zinc-400 hover:text-zinc-200"
                                  }`}
                                >
                                  {srcId === "all"
                                    ? "Tất cả"
                                    : srcId === "kkphim"
                                      ? "KKPhim"
                                      : "NguonC"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => scrollRail(latestRailRef, "left")}
                            className="p-2 sm:p-2.5 rounded-xl bg-[#13131b] hover:bg-[#1a1a24] border border-white/[0.08] text-zinc-400 hover:text-white transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                            aria-label="Cuộn trái danh sách phim mới"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollRail(latestRailRef, "right")}
                            className="p-2 sm:p-2.5 rounded-xl bg-[#13131b] hover:bg-[#1a1a24] border border-white/[0.08] text-zinc-400 hover:text-white transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                            aria-label="Cuộn phải danh sách phim mới"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={latestRailRef}
                      className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
                    >
                      {displayedMovies.slice(0, 15).map((movie) => (
                        <div
                          key={`home-rail-${movie.source}-${movie.slug}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`Xem thông tin phim ${movie.name}`}
                          onClick={() => openMovieDetail(movie)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openMovieDetail(movie);
                            }
                          }}
                          className="relative flex-none w-[170px] sm:w-[190px] group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-2xl"
                        >
                          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] group-hover:border-pink-500/50 transition-all duration-300 shadow-md group-hover:shadow-xl group-hover:shadow-pink-950/30 group-hover:-translate-y-1">
                            <img
                              src={movie.poster || movie.thumb}
                              alt={movie.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                            <div className="absolute top-2.5 left-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-pink-600/90 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                                {movie.episode_current || "Full HD"}
                              </span>
                            </div>

                            <div className="absolute top-2.5 right-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-zinc-300 uppercase">
                                {movie.source}
                              </span>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                              <div className="w-11 h-11 rounded-full bg-pink-600 text-white flex items-center justify-center pink-glow">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 space-y-0.5 pl-1">
                            <h4 className="text-sm font-bold text-zinc-100 group-hover:text-pink-400 transition truncate">
                              {movie.name}
                            </h4>
                            <p className="text-xs text-zinc-400 truncate">
                              {movie.origin_name || movie.name}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                              <span>{movie.year || "2026"}</span>
                              <span className="text-pink-400 font-medium">
                                {movie.lang || "Vietsub"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* LƯỚI KHÁM PHÁ THÊM TRÊN TRANG CHỦ */}
                  {displayedMovies.length > 0 && (
                    <div className="pt-6 border-t border-white/[0.04] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-zinc-200">
                          Khám Phá Thêm Phim Mới
                        </h3>
                        <span className="text-xs text-zinc-400">{displayedMovies.length} phim</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {displayedMovies.map((movie) => (
                          <div
                            key={`home-grid-${movie.source}-${movie.slug}`}
                            role="button"
                            tabIndex={0}
                            aria-label={`Xem thông tin phim ${movie.name}`}
                            onClick={() => openMovieDetail(movie)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openMovieDetail(movie);
                              }
                            }}
                            className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] hover:border-pink-500/50 transition duration-300 shadow-md hover:shadow-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                          >
                            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                              <img
                                src={movie.poster || movie.thumb}
                                alt={movie.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <div className="absolute top-2 left-2">
                                <span className="px-2 py-0.5 rounded-md bg-pink-600/90 text-[10px] font-bold text-white uppercase">
                                  {movie.episode_current || "Full HD"}
                                </span>
                              </div>
                              <div className="absolute top-2 right-2">
                                <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-300 uppercase">
                                  {movie.source}
                                </span>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                                <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center pink-glow">
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="p-2.5 space-y-0.5">
                              <h4 className="text-xs font-bold text-zinc-100 group-hover:text-pink-400 truncate">
                                {movie.name}
                              </h4>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {movie.origin_name || movie.name}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                                <span>{movie.year || "2026"}</span>
                                <span className="text-pink-400 font-medium">
                                  {movie.lang || "Vietsub"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* PHẦN 2: GIAO DIỆN CHUYÊN MỤC DEDICATED (Khi chọn Phim mới,     */}
              {/* Phim lẻ, Phim bộ, Chiếu rạp, Hoạt hình, Thể loại, Quốc gia)   */}
              {/* ============================================================= */}
              {!isHomeView && (
                <section ref={categorySectionRef} className="space-y-8 scroll-mt-24">
                  {/* Spotlight Banner cho phim đầu bảng của chuyên mục */}
                  {displayedMovies.length > 0 && (
                    <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-[#111118] min-h-[340px] sm:min-h-[380px] flex items-end shadow-2xl">
                      <div className="absolute inset-0 z-0">
                        <img
                          src={displayedMovies[0].thumb || displayedMovies[0].poster}
                          alt={displayedMovies[0].name}
                          className="w-full h-full object-cover object-center filter brightness-90 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-[#09090d]/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#09090d] via-[#09090d]/80 to-transparent" />
                      </div>

                      <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-pink-600/30">
                            <NavIcon className="w-3.5 h-3.5" />
                            <span>{currentNavTitle} Nổi Bật</span>
                          </span>
                          {displayedMovies[0].year && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold">
                              {displayedMovies[0].year}
                            </span>
                          )}
                          {displayedMovies[0].quality && (
                            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
                              {displayedMovies[0].quality}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-zinc-300 uppercase">
                            Nguồn: {displayedMovies[0].source}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                            {displayedMovies[0].name}
                          </h1>
                          {displayedMovies[0].origin_name && (
                            <p className="text-sm font-medium text-pink-300/80 italic">
                              {displayedMovies[0].origin_name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => openMovieDetail(displayedMovies[0])}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-xs shadow-xl shadow-pink-600/40 pink-glow-sm flex items-center gap-2 transition duration-200 cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                            <span>Xem ngay</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(displayedMovies[0])}
                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold backdrop-blur-xl flex items-center gap-2 transition duration-200 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Lưu phim</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category Header Bar & Quick Source Selector */}
                  <div className="p-6 rounded-3xl bg-[#12121a]/80 border border-white/[0.06] backdrop-blur-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-600/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-md shadow-pink-950/30 shrink-0">
                          <NavIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {currentNavTitle}
                            </h2>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-bold">
                              {displayedMovies.length} Phim
                            </span>
                            {(selectedGenre !== "Tất cả" || Boolean(selectedCountry)) && (
                              <button
                                type="button"
                                onClick={() => navigateToCategory("trang-chu")}
                                aria-label="Đặt lại bộ lọc, phục hồi toàn bộ danh sách"
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 shadow-sm"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Đặt lại</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                            {currentNavMeta.desc}
                          </p>
                        </div>
                      </div>

                      {/* Bộ chọn nguồn máy chủ nhanh trong chuyên mục */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <span className="text-xs text-zinc-400 font-medium">Nguồn:</span>
                        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08]">
                          {(["all", "kkphim", "nguonc"] as SourceFilter[]).map((srcId) => {
                            const active = selectedSource === srcId;
                            return (
                              <button
                                key={srcId}
                                type="button"
                                onClick={() => handleSelectSource(srcId)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                  active
                                    ? "bg-pink-600 text-white shadow-sm"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                {srcId === "all"
                                  ? "Tất cả"
                                  : srcId === "kkphim"
                                    ? "KKPhim"
                                    : "NguonC"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LOADING SKELETON */}
                  {isCategoryLoading && displayedMovies.length === 0 ? (
                    <div
                      role="status"
                      aria-live="polite"
                      aria-label={`Đang tải danh sách ${currentNavTitle}`}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    >
                      <span className="sr-only">Đang tải danh sách phim...</span>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="space-y-3 animate-pulse motion-reduce:animate-none">
                          <div className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/[0.04]" />
                          <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
                          <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
                        </div>
                      ))}
                    </div>
                  ) : isCategoryError && displayedMovies.length === 0 ? (
                    /* ERROR STATE */
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="py-16 px-6 text-center space-y-4 bg-[#12121a]/60 rounded-3xl border border-rose-500/20 max-w-lg mx-auto"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">
                          Không thể kết nối máy chủ phim
                        </h3>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                          Không thể tải danh sách phim cho <b>{currentNavTitle}</b> từ nguồn{" "}
                          {selectedSource === "all" ? "tất cả máy chủ" : selectedSource}.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={refetchCurrentFilter}
                          className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition cursor-pointer min-h-[44px] flex items-center gap-2"
                        >
                          <span>Thử lại ngay</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateToCategory("trang-chu")}
                          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs border border-white/10 transition cursor-pointer min-h-[44px]"
                        >
                          Về trang chủ
                        </button>
                      </div>
                    </div>
                  ) : displayedMovies.length === 0 ? (
                    /* EMPTY STATE */
                    <div
                      role="status"
                      className="py-20 px-6 text-center space-y-3 bg-[#12121a]/50 rounded-3xl border border-white/[0.04]"
                    >
                      <Film className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
                      <h3 className="text-base font-bold text-zinc-300">
                        {filterEmptyState.title}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                        {filterEmptyState.message}
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigateToCategory("trang-chu")}
                          className="px-5 py-2.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition cursor-pointer min-h-[44px]"
                        >
                          {filterEmptyState.actionLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSourceModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] text-xs font-semibold transition cursor-pointer min-h-[44px]"
                        >
                          Đổi nguồn máy chủ
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CATEGORY GRID VIEW */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {displayedMovies.map((movie) => (
                        <div
                          key={`category-grid-${movie.source}-${movie.slug}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`Xem thông tin phim ${movie.name}`}
                          onClick={() => openMovieDetail(movie)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openMovieDetail(movie);
                            }
                          }}
                          className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] hover:border-pink-500/50 transition duration-300 shadow-md hover:shadow-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                        >
                          <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                            <img
                              src={movie.poster || movie.thumb}
                              alt={movie.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-0.5 rounded-md bg-pink-600/90 text-[10px] font-bold text-white uppercase">
                                {movie.episode_current || "Full HD"}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-300 uppercase">
                                {movie.source}
                              </span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                              <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center pink-glow">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="p-2.5 space-y-0.5">
                            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-pink-400 truncate">
                              {movie.name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {movie.origin_name || movie.name}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                              <span>{movie.year || "2026"}</span>
                              <span className="text-pink-400 font-medium">
                                {movie.lang || "Vietsub"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: VIP FEATURE NOTICE (Honest State, No Fake Success)    */}
      {/* ------------------------------------------------------------- */}
      <VipNoticeModal isOpen={showVipNoticeModal} onClose={() => setShowVipNoticeModal(false)} />

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CONFIRMATION DIALOG FOR DELETE ACTIONS                 */}
      {/* ------------------------------------------------------------- */}
      {confirmDialog && confirmDialog.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDialog(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="w-full max-w-md p-6 rounded-3xl bg-[#13131b] border border-white/10 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="confirm-dialog-title" className="text-base font-extrabold text-white">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Xác nhận thao tác xóa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
                aria-label="Đóng hộp thoại"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.05]">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  action();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDialog.confirmText || "Xóa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: SOURCE HEALTH PING & SELECTOR                        */}
      {/* ------------------------------------------------------------- */}
      <SourceSelectorModal
        isOpen={showSourceModal}
        onClose={() => setShowSourceModal(false)}
        selectedSource={selectedSource}
        onSelectSource={handleSelectSource}
        sourcePings={sourcePings}
      />

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: MOVIE REAL STREAM & EPISODE PLAYER                   */}
      {/* ------------------------------------------------------------- */}
      <MoviePreviewModal
        movie={selectedMoviePreview}
        activeStreamUrl={activeStreamUrl}
        activeEpisodeName={activeEpisodeName}
        previewDetail={previewDetail}
        isLoadingDetail={isLoadingDetail}
        favorites={favorites}
        onClose={() => {
          setSelectedMoviePreview(null);
          setActiveStreamUrl(null);
        }}
        onSelectEpisode={handleSelectEpisode}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
