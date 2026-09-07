import React, { useState, useEffect } from "react";
import { X, Server, Film, Database, Check, Mic, Languages, Volume2 } from "lucide-react";
import type { EpisodeServer, SourceId } from "@/lib/types";
import { SOURCES } from "@/lib/api";
import { detectServerLang } from "./PlayerRightbar";

interface PlayerInDrawerProps {
  open: "episodes" | "servers" | null;
  onClose: () => void;
  movieLang?: string;
  servers?: EpisodeServer[];
  activeServerIndex?: number;
  activeEpisodeIndex?: number;
  onSelectEpisode?: (serverIndex: number, episodeIndex: number) => void;
  providerId?: SourceId;
  onChangeProvider?: (provider: SourceId) => void;
}

export const PlayerInDrawer: React.FC<PlayerInDrawerProps> = ({
  open,
  onClose,
  movieLang,
  servers,
  activeServerIndex = 0,
  activeEpisodeIndex = 0,
  onSelectEpisode,
  providerId,
  onChangeProvider,
}) => {
  const [activeTab, setActiveTab] = useState<"episodes" | "servers">(open || "episodes");
  const [selectedServerTab, setSelectedServerTab] = useState<number>(activeServerIndex);
  const [activeLangFilter, setActiveLangFilter] = useState<
    "all" | "vietsub" | "thuyetminh" | "longtieng"
  >("all");

  useEffect(() => {
    if (open) {
      setActiveTab(open);
    }
  }, [open]);

  useEffect(() => {
    setSelectedServerTab(activeServerIndex);
  }, [activeServerIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const currentServer = servers?.[selectedServerTab] || servers?.[0] || null;
  const currentEpItems = currentServer?.items || [];
  const totalEpisodes = currentEpItems.length;

  const hasVietsub = servers?.some(
    (s) => detectServerLang(s.server_name || "", movieLang) === "vietsub",
  );
  const hasThuyetMinh = servers?.some(
    (s) => detectServerLang(s.server_name || "", movieLang) === "thuyetminh",
  );
  const hasLongTieng = servers?.some(
    (s) => detectServerLang(s.server_name || "", movieLang) === "longtieng",
  );

  return (
    <div className="player-in-drawer-backdrop" onClick={onClose} aria-label="Đóng bảng điều khiển">
      <div
        className="player-in-drawer-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header với Tabs chuyển đổi */}
        <div className="player-drawer-header">
          <div className="player-drawer-tabs">
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === "episodes" ? "active" : ""}`}
              onClick={() => setActiveTab("episodes")}
            >
              <Film className="tab-icon" />
              <span>Tập phim {totalEpisodes > 0 ? `(${totalEpisodes})` : ""}</span>
            </button>
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === "servers" ? "active" : ""}`}
              onClick={() => setActiveTab("servers")}
            >
              <Server className="tab-icon" />
              <span>Máy chủ {servers && servers.length > 0 ? `(${servers.length})` : ""}</span>
            </button>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng"
          >
            <X />
          </button>
        </div>

        {/* Tab 1: Danh sách tập phim */}
        {activeTab === "episodes" && (
          <div className="player-drawer-body">
            {/* Thanh chọn nhanh bản phim (Vietsub / Thuyết minh / Lồng tiếng) */}
            {(hasThuyetMinh || hasLongTieng) && (
              <div className="drawer-lang-pills">
                <button
                  type="button"
                  className={`drawer-lang-chip ${activeLangFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveLangFilter("all")}
                >
                  Tất cả
                </button>
                {hasVietsub && (
                  <button
                    type="button"
                    className={`drawer-lang-chip ${activeLangFilter === "vietsub" ? "active" : ""}`}
                    onClick={() => {
                      setActiveLangFilter("vietsub");
                      const fIdx = servers?.findIndex(
                        (s) => detectServerLang(s.server_name || "", movieLang) === "vietsub",
                      );
                      if (fIdx !== undefined && fIdx >= 0) {
                        setSelectedServerTab(fIdx);
                        const targetEp = Math.min(
                          activeEpisodeIndex,
                          (servers?.[fIdx]?.items?.length || 1) - 1,
                        );
                        onSelectEpisode?.(fIdx, Math.max(0, targetEp));
                      }
                    }}
                  >
                    <Languages style={{ width: 12, height: 12, marginRight: 4 }} />
                    Vietsub
                  </button>
                )}
                {hasThuyetMinh && (
                  <button
                    type="button"
                    className={`drawer-lang-chip ${activeLangFilter === "thuyetminh" ? "active" : ""}`}
                    onClick={() => {
                      setActiveLangFilter("thuyetminh");
                      const fIdx = servers?.findIndex(
                        (s) => detectServerLang(s.server_name || "", movieLang) === "thuyetminh",
                      );
                      if (fIdx !== undefined && fIdx >= 0) {
                        setSelectedServerTab(fIdx);
                        const targetEp = Math.min(
                          activeEpisodeIndex,
                          (servers?.[fIdx]?.items?.length || 1) - 1,
                        );
                        onSelectEpisode?.(fIdx, Math.max(0, targetEp));
                      }
                    }}
                  >
                    <Mic style={{ width: 12, height: 12, marginRight: 4 }} />
                    Thuyết Minh
                  </button>
                )}
                {hasLongTieng && (
                  <button
                    type="button"
                    className={`drawer-lang-chip ${activeLangFilter === "longtieng" ? "active" : ""}`}
                    onClick={() => {
                      setActiveLangFilter("longtieng");
                      const fIdx = servers?.findIndex(
                        (s) => detectServerLang(s.server_name || "", movieLang) === "longtieng",
                      );
                      if (fIdx !== undefined && fIdx >= 0) {
                        setSelectedServerTab(fIdx);
                        const targetEp = Math.min(
                          activeEpisodeIndex,
                          (servers?.[fIdx]?.items?.length || 1) - 1,
                        );
                        onSelectEpisode?.(fIdx, Math.max(0, targetEp));
                      }
                    }}
                  >
                    <Volume2 style={{ width: 12, height: 12, marginRight: 4 }} />
                    Lồng Tiếng
                  </button>
                )}
              </div>
            )}

            {/* Hàng chọn máy chủ */}
            {servers && servers.length > 1 && (
              <div className="drawer-server-pills">
                {servers.map((srv, sIdx) => {
                  const isTabActive = selectedServerTab === sIdx;
                  const lang = detectServerLang(srv.server_name || "", movieLang);
                  const langBadge =
                    lang === "thuyetminh" ? "🎙️" : lang === "longtieng" ? "🗣️" : "🇻🇳";
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      className={`server-pill-btn ${isTabActive ? "active" : ""}`}
                      onClick={() => {
                        setSelectedServerTab(sIdx);
                        const targetEp = Math.min(activeEpisodeIndex, (srv.items?.length || 1) - 1);
                        onSelectEpisode?.(sIdx, Math.max(0, targetEp));
                      }}
                    >
                      <span style={{ marginRight: 4 }}>{langBadge}</span>
                      <span>{srv.server_name || `Server ${sIdx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentEpItems.length > 0 ? (
              <div className="drawer-episodes-grid">
                {currentEpItems.map((epItem, epIdx) => {
                  const isEpActive =
                    activeServerIndex === selectedServerTab && activeEpisodeIndex === epIdx;
                  return (
                    <button
                      key={epItem.slug || epIdx}
                      type="button"
                      className={`drawer-ep-badge ${isEpActive ? "active" : ""}`}
                      onClick={() => {
                        onSelectEpisode?.(selectedServerTab, epIdx);
                        onClose();
                      }}
                      title={epItem.name}
                      aria-label={`Chọn ${epItem.name}`}
                    >
                      {isEpActive && <span className="playing-pulse" />}
                      <span className="ep-name">{epItem.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="drawer-empty-state">Chưa có danh sách tập từ máy chủ này.</div>
            )}
          </div>
        )}

        {/* Tab 2: Danh sách máy chủ */}
        {activeTab === "servers" && (
          <div className="player-drawer-body">
            <div className="drawer-section-title">Máy chủ phát của tập hiện tại</div>
            <div className="drawer-servers-list">
              {servers && servers.length > 0 ? (
                servers.map((srv, sIdx) => {
                  const isServerActive = activeServerIndex === sIdx;
                  const lang = detectServerLang(srv.server_name || "", movieLang);
                  const langBadge =
                    lang === "thuyetminh"
                      ? "🎙️ Thuyết Minh"
                      : lang === "longtieng"
                        ? "🗣️ Lồng Tiếng"
                        : "🇻🇳 Vietsub";
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      className={`drawer-server-item ${isServerActive ? "active" : ""}`}
                      onClick={() => {
                        const targetEpIdx = Math.min(
                          activeEpisodeIndex,
                          (srv.items?.length || 1) - 1,
                        );
                        onSelectEpisode?.(sIdx, targetEpIdx >= 0 ? targetEpIdx : 0);
                        onClose();
                      }}
                    >
                      <div className="server-item-left">
                        <div className={`server-item-icon ${isServerActive ? "active" : ""}`}>
                          <Server />
                        </div>
                        <div className="server-item-info">
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong>{srv.server_name || `Máy chủ ${sIdx + 1}`}</strong>
                            <span className="drawer-item-lang-tag">{langBadge}</span>
                          </div>
                          <span>{srv.items?.length || 0} tập phim sẵn sàng</span>
                        </div>
                      </div>
                      {isServerActive ? (
                        <span className="server-active-pill">
                          <Check className="check-icon" /> Đang phát
                        </span>
                      ) : (
                        <span className="server-switch-arrow">Chọn →</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="drawer-empty-state">Chỉ có 1 máy chủ mặc định.</div>
              )}
            </div>

            {/* Mục đổi kho dữ liệu phim (KKPhim, OPhim, NguonC) nếu có callback */}
            {onChangeProvider && (
              <div className="drawer-provider-section">
                <div className="drawer-section-title">
                  <Database className="section-icon" /> Kho dữ liệu phim
                </div>
                <div className="drawer-providers-grid">
                  {SOURCES.map((s) => {
                    const isSelected = providerId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`provider-chip ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          onChangeProvider(s.id);
                          onClose();
                        }}
                      >
                        <span className="provider-name">{s.label}</span>
                        {isSelected && <span className="provider-selected-tag">Hiện tại</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
