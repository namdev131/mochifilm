import React, { useState, useEffect, useMemo } from "react";
import { Copy, Mic, Languages, Volume2, Server, Database, Lock, Unlock } from "lucide-react";
import type { EpisodeServer, SourceId } from "@/lib/types";
import { SOURCES } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface PlayerRightbarProps {
  movieName: string;
  movieSlug: string;
  moviePoster?: string;
  movieLang?: string;
  servers?: EpisodeServer[];
  activeServerIndex?: number;
  activeEpisodeIndex?: number;
  onSelectEpisode?: (srvIdx: number, epIdx: number) => void;
  providerId?: SourceId;
  onChangeProvider?: (provider: SourceId) => void;
  onShowToast: (msg: string) => void;
  partyCode?: string;
  onPartyJoined?: (code: string) => void;
}

export function detectServerLang(
  name: string,
  fallbackLang?: string,
): "vietsub" | "thuyetminh" | "longtieng" | "other" {
  const n = (name || "").toLowerCase();
  if (n.includes("lồng") || n.includes("long tieng") || n.includes("dub") || n.includes("lt"))
    return "longtieng";
  if (
    n.includes("thuyết") ||
    n.includes("thuyet") ||
    n.includes("tm") ||
    n.includes("voiceover") ||
    n.includes("thuyetminh")
  )
    return "thuyetminh";
  if (
    n.includes("vietsub") ||
    n.includes("vsub") ||
    n.includes("phụ đề") ||
    n.includes("sub") ||
    n.includes("viet sub")
  )
    return "vietsub";

  if (fallbackLang) {
    const f = fallbackLang.toLowerCase();
    if (f.includes("lồng") || f.includes("long tieng") || f.includes("dub")) return "longtieng";
    if (f.includes("thuyết") || f.includes("thuyet") || f.includes("tm")) return "thuyetminh";
  }
  return "vietsub";
}

export const PlayerRightbar: React.FC<PlayerRightbarProps> = ({
  movieName,
  movieSlug,
  moviePoster,
  movieLang,
  servers,
  activeServerIndex = 0,
  activeEpisodeIndex = 0,
  onSelectEpisode,
  providerId,
  onChangeProvider,
  onShowToast,
  partyCode,
  onPartyJoined,
}) => {
  const [selectedServerTab, setSelectedServerTab] = useState<number>(activeServerIndex);
  const [joinCode, setJoinCode] = useState("");
  const [partyPassword, setPartyPassword] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [partyBusy, setPartyBusy] = useState(false);
  const [currentParty, setCurrentParty] = useState<{
    id: string;
    join_locked: boolean;
    is_host: boolean;
  } | null>(null);

  const authRequest = async (body: Record<string, unknown>) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error("Đăng nhập để dùng Watch Party");
    const response = await fetch("/api/watch-party", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Watch Party gặp lỗi");
    return result;
  };

  const partyRequest = async (action: "create" | "join") => {
    const code =
      action === "create"
        ? Array.from(
            crypto.getRandomValues(new Uint8Array(6)),
            (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 32],
          ).join("")
        : joinCode.trim().toUpperCase();
    if (code.length !== 6) return onShowToast("Mã phòng phải có 6 ký tự");
    if (partyPassword && partyPassword.length < 4)
      return onShowToast("Mật khẩu phòng cần ít nhất 4 ký tự");
    setPartyBusy(true);
    try {
      const result = await authRequest({
        action,
        code,
        password: partyPassword || undefined,
        scheduledAt:
          action === "create" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        slug: movieSlug,
        source: providerId,
        name: movieName,
        poster: moviePoster,
        ep: activeEpisodeIndex,
        srv: activeServerIndex,
      });
      if (!result.party) throw new Error("Không thể mở phòng");
      if (action === "create" && scheduledAt && new Date(scheduledAt).getTime() > Date.now()) {
        onShowToast(`Đã lên lịch phòng ${result.party.code}`);
        setScheduledAt("");
        return;
      }
      onPartyJoined?.(result.party.code);
      onShowToast(
        action === "create"
          ? `Đã tạo phòng ${result.party.code}`
          : `Đã vào phòng ${result.party.code}`,
      );
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Watch Party gặp lỗi");
    } finally {
      setPartyBusy(false);
    }
  };

  useEffect(() => {
    if (!partyCode) return setCurrentParty(null);
    void authRequest({ action: "list" })
      .then((result) =>
        setCurrentParty(
          result.parties?.find((party: { code: string }) => party.code === partyCode) || null,
        ),
      )
      .catch(() => setCurrentParty(null));
  }, [partyCode]);

  const togglePartyLock = async () => {
    if (!currentParty) return;
    setPartyBusy(true);
    try {
      await authRequest({
        action: "set-lock",
        partyId: currentParty.id,
        locked: !currentParty.join_locked,
      });
      setCurrentParty({ ...currentParty, join_locked: !currentParty.join_locked });
      onShowToast(currentParty.join_locked ? "Đã mở khóa phòng" : "Đã khóa phòng");
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Không thể đổi khóa phòng");
    } finally {
      setPartyBusy(false);
    }
  };

  const copyPartyCode = async () => {
    if (!partyCode) return;
    try {
      await navigator.clipboard.writeText(partyCode);
      onShowToast(`Đã sao chép mã phòng ${partyCode}`);
    } catch {
      onShowToast("Không thể sao chép mã phòng");
    }
  };

  useEffect(() => {
    setSelectedServerTab(activeServerIndex);
  }, [activeServerIndex]);

  const langGroups = useMemo(() => {
    const g: { vietsub: number[]; thuyetminh: number[]; longtieng: number[]; other: number[] } = {
      vietsub: [],
      thuyetminh: [],
      longtieng: [],
      other: [],
    };
    servers?.forEach((s, idx) => {
      const l = detectServerLang(s.server_name || "", movieLang);
      g[l].push(idx);
    });
    return g;
  }, [servers, movieLang]);

  const currentServer = servers?.[selectedServerTab] || servers?.[0] || null;
  const currentEpItems = currentServer?.items || [];
  const totalEpCount = servers?.reduce((acc, s) => acc + s.items.length, 0) || 0;
  const currentActiveLang = detectServerLang(
    servers?.[activeServerIndex]?.server_name || "",
    movieLang,
  );

  const handleSwitchServer = (sIdx: number) => {
    setSelectedServerTab(sIdx);
    const targetSrv = servers?.[sIdx];
    const targetEp = Math.min(activeEpisodeIndex, (targetSrv?.items?.length || 1) - 1);
    onSelectEpisode?.(sIdx, Math.max(0, targetEp));
  };

  return (
    <aside className="rightbar">
      {/* Danh sách tập & Máy chủ & Thuyết minh / Vietsub */}
      <section className="right-card episodes-card" id="playerEpisodesPanel">
        <h3>
          <span>🎬 Danh sách tập</span>
          {totalEpCount > 0 && <span className="ep-badge-count">{totalEpCount} tập</span>}
        </h3>

        <div className="episodes-body">
          {/* Bộ lọc bản dịch: Thuyết Minh / Vietsub / Lồng Tiếng */}
          <div className="language-selector-section">
            <div className="section-label-row">
              <span className="lang-section-label">Bản phim:</span>
              <span className="current-lang-indicator">
                {currentActiveLang === "thuyetminh"
                  ? "🎙️ Thuyết Minh"
                  : currentActiveLang === "longtieng"
                    ? "🗣️ Lồng Tiếng"
                    : "🇻🇳 Vietsub"}
              </span>
            </div>
            <div className="lang-pills-row">
              <button
                type="button"
                className={`lang-pill-btn ${currentActiveLang === "vietsub" ? "active" : ""}`}
                onClick={() => {
                  if (langGroups.vietsub.length > 0) {
                    handleSwitchServer(langGroups.vietsub[0]);
                    onShowToast("Đã chọn bản Vietsub (Phụ đề)");
                  } else {
                    onShowToast("Kho phim hiện tại chưa có bản Vietsub");
                  }
                }}
                title={langGroups.vietsub.length > 0 ? "Xem bản Vietsub" : "Chưa có bản Vietsub"}
              >
                <Languages className="lang-icon" />
                <span>Vietsub</span>
                {langGroups.vietsub.length > 0 && (
                  <span className="lang-count">({langGroups.vietsub.length})</span>
                )}
              </button>

              <button
                type="button"
                className={`lang-pill-btn ${currentActiveLang === "thuyetminh" ? "active" : ""} ${langGroups.thuyetminh.length === 0 ? "unavailable" : ""}`}
                onClick={() => {
                  if (langGroups.thuyetminh.length > 0) {
                    handleSwitchServer(langGroups.thuyetminh[0]);
                    onShowToast("Đã chọn bản Thuyết Minh");
                  } else {
                    onShowToast(
                      `Kho phim ${providerId?.toUpperCase() || ""} chưa có Thuyết minh. Bạn thử chuyển sang kho phim khác bên dưới nhé!`,
                    );
                  }
                }}
                title={
                  langGroups.thuyetminh.length > 0
                    ? "Xem bản Thuyết Minh"
                    : "Chưa có Thuyết Minh trên kho này"
                }
              >
                <Mic className="lang-icon" />
                <span>Thuyết Minh</span>
                {langGroups.thuyetminh.length > 0 ? (
                  <span className="lang-count">({langGroups.thuyetminh.length})</span>
                ) : (
                  <span className="lang-status-tag">Chưa có</span>
                )}
              </button>

              <button
                type="button"
                className={`lang-pill-btn ${currentActiveLang === "longtieng" ? "active" : ""} ${langGroups.longtieng.length === 0 ? "unavailable" : ""}`}
                onClick={() => {
                  if (langGroups.longtieng.length > 0) {
                    handleSwitchServer(langGroups.longtieng[0]);
                    onShowToast("Đã chọn bản Lồng Tiếng");
                  } else {
                    onShowToast(`Kho phim ${providerId?.toUpperCase() || ""} chưa có Lồng tiếng.`);
                  }
                }}
                title={
                  langGroups.longtieng.length > 0
                    ? "Xem bản Lồng Tiếng"
                    : "Chưa có Lồng Tiếng trên kho này"
                }
              >
                <Volume2 className="lang-icon" />
                <span>Lồng Tiếng</span>
                {langGroups.longtieng.length > 0 ? (
                  <span className="lang-count">({langGroups.longtieng.length})</span>
                ) : (
                  <span className="lang-status-tag">Chưa có</span>
                )}
              </button>
            </div>
          </div>

          {/* Hàng chọn máy chủ phát */}
          {servers && servers.length > 0 && (
            <div className="server-selector-row">
              <div className="section-label-row">
                <span className="server-label-hint">Máy chủ:</span>
                <span className="server-current-name">
                  {servers[activeServerIndex]?.server_name || `Máy chủ ${activeServerIndex + 1}`}
                </span>
              </div>
              <div className="server-tabs">
                {servers.map((srv, sIdx) => {
                  const isTabActive = activeServerIndex === sIdx;
                  const lang = detectServerLang(srv.server_name || "", movieLang);
                  const langBadge =
                    lang === "thuyetminh" ? "🎙️ TM" : lang === "longtieng" ? "🗣️ LT" : "🇻🇳 Sub";
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      className={`server-tab ${isTabActive ? "active" : ""}`}
                      onClick={() => handleSwitchServer(sIdx)}
                      title={`Đổi sang ${srv.server_name || `Máy chủ ${sIdx + 1}`}`}
                    >
                      <span className="server-lang-tag">{langBadge}</span>
                      <span>{srv.server_name || `Máy chủ ${sIdx + 1}`}</span>
                      {isTabActive && <span className="server-live-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Đổi kho phim khi cần */}
          {onChangeProvider && (
            <div className="provider-selector-row">
              <div className="section-label-row">
                <span className="provider-label-hint">Kho phim:</span>
                <span className="provider-current-name">{providerId?.toUpperCase()}</span>
              </div>
              <div className="provider-pills-row">
                {SOURCES.map((s) => {
                  const isSelected = providerId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`provider-tab-pill ${isSelected ? "active" : ""}`}
                      onClick={() => onChangeProvider(s.id)}
                      title={`Chuyển sang kho phim ${s.label}`}
                    >
                      <span>{s.label}</span>
                      {isSelected && <span className="provider-active-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentEpItems.length > 0 ? (
            <div className="episode-grid">
              {currentEpItems.map((epItem, epIdx) => {
                const isEpActive =
                  activeServerIndex === selectedServerTab && activeEpisodeIndex === epIdx;
                return (
                  <button
                    key={epItem.slug || epIdx}
                    type="button"
                    className={`ep-badge ${isEpActive ? "active" : ""}`}
                    onClick={() => onSelectEpisode?.(selectedServerTab, epIdx)}
                    aria-label={`Chọn ${epItem.name}`}
                    title={epItem.name}
                  >
                    {epItem.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="episodes-empty">Chưa có danh sách tập từ máy chủ này.</div>
          )}
        </div>
      </section>

      {/* Watch party */}
      <section className="right-card">
        <h3>🎉 Watch Party</h3>
        <div className="party-card">
          <div className="party-state">
            <strong>Xem chung cùng bạn bè</strong>
            <p>
              {partyCode
                ? currentParty?.is_host
                  ? `Bạn là chủ phòng · ${currentParty.join_locked ? "Phòng đang khóa" : "Phòng đang mở"}`
                  : "Bạn đang tham gia với tư cách khách"
                : "Tạo phòng hoặc nhập mã 6 ký tự để xem chung."}
            </p>
            <div className="party-actions" style={{ marginTop: "10px" }}>
              {!partyCode && (
                <>
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.slice(0, 6))}
                    placeholder="MÃ PHÒNG (để trống nếu tạo)"
                    aria-label="Mã Watch Party"
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      gridColumn: "1 / -1",
                    }}
                  />
                  <input
                    type="password"
                    minLength={4}
                    maxLength={72}
                    autoComplete="new-password"
                    value={partyPassword}
                    onChange={(event) => setPartyPassword(event.target.value)}
                    placeholder="Mật khẩu phòng (không bắt buộc)"
                    aria-label="Mật khẩu phòng"
                    style={{ width: "100%", marginBottom: 8, gridColumn: "1 / -1" }}
                  />
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
                      .toISOString()
                      .slice(0, 16)}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    aria-label="Lịch mở phòng"
                    style={{ width: "100%", marginBottom: 8, gridColumn: "1 / -1" }}
                  />
                </>
              )}
              {partyCode ? (
                <button
                  type="button"
                  className="primary"
                  onClick={() => void copyPartyCode()}
                  aria-label={`Sao chép mã phòng ${partyCode}`}
                  style={{ width: "100%", gridColumn: "1 / -1", height: 42, fontSize: 13 }}
                >
                  <strong style={{ fontFamily: "monospace", fontSize: 16, letterSpacing: 2 }}>
                    {partyCode}
                  </strong>
                  <Copy style={{ width: 15, marginLeft: 8 }} /> Sao chép mã phòng
                </button>
              ) : (
                <button
                  type="button"
                  className="primary"
                  id="joinPartyBtn"
                  style={{ width: "100%", gridColumn: "1 / -1" }}
                  disabled={partyBusy}
                  onClick={() => void partyRequest(joinCode ? "join" : "create")}
                >
                  {partyBusy
                    ? "Đang kết nối..."
                    : joinCode
                      ? "Tham gia phòng"
                      : "Tạo phòng Watch Party"}
                </button>
              )}
              {partyCode && currentParty?.is_host && (
                <button
                  type="button"
                  disabled={partyBusy}
                  onClick={() => void togglePartyLock()}
                  style={{ width: "100%", gridColumn: "1 / -1" }}
                >
                  {currentParty.join_locked ? (
                    <>
                      <Unlock /> Mở khóa phòng
                    </>
                  ) : (
                    <>
                      <Lock /> Khóa phòng
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mochi mách nhỏ */}
      <section
        className="right-card mascot-tip-card"
        style={{
          marginTop: "auto",
          padding: 11,
          position: "relative",
          overflow: "hidden",
          minHeight: 145,
        }}
      >
        <strong style={{ fontSize: 10 }}>Mochi mách nhỏ 💕</strong>
        <p
          style={{ margin: "5px 0", width: "60%", color: "#978a92", fontSize: 8, lineHeight: 1.5 }}
        >
          Nhấn F để xem toàn màn hình, hoặc Space để play/pause nha sếp.
        </p>
        <img
          src="/assets/mochi/mascot-chair.webp"
          alt="Mochi"
          style={{ position: "absolute", right: -12, bottom: -7, width: 105 }}
        />
      </section>
    </aside>
  );
};
