import React from "react";
import type { MovieDetail, EpisodeServerItem } from "@/lib/types";

interface DetailContentProps {
  movie: MovieDetail;
  activeEpisode: EpisodeServerItem | null;
  activeServerIndex: number;
  activeEpisodeIndex: number;
  activeStreamUrl: string | null;
  onSelectEpisode: (ep: EpisodeServerItem, srvIdx: number, epIdx: number) => void;
  onClosePlayer?: () => void;
}

export const DetailContent: React.FC<DetailContentProps> = ({
  movie,
  activeEpisode,
  activeServerIndex,
  activeEpisodeIndex,
  activeStreamUrl,
  onSelectEpisode,
  onClosePlayer,
}) => {
  // Format description into paragraphs
  const rawContent = movie.content || "";
  const plainContent = rawContent.replace(/<[^>]*>?/gm, "").trim();
  const paragraphs = plainContent
    ? plainContent.split("\n\n").filter(Boolean)
    : [
        "Nội dung bộ phim đang được cập nhật từ hệ thống máy chủ phát trực tuyến. Vui lòng theo dõi danh sách tập bên dưới để trải nghiệm các liên kết chất lượng cao.",
      ];

  const totalServers = movie.servers || [];

  return (
    <div>
      {/* Video Player if active */}
      {activeStreamUrl && (
        <article className="panel" style={{ marginBottom: 10 }}>
          <div className="panel-head">
            <h2>
              Đang phát: <span style={{ color: "var(--pink)" }}>{activeEpisode?.name || "Tập phim"}</span> (Máy chủ #{activeServerIndex + 1})
            </h2>
            {onClosePlayer && (
              <button
                type="button"
                className="small-all"
                onClick={onClosePlayer}
                style={{ color: "var(--pink)" }}
              >
                ✕ Thu nhỏ
              </button>
            )}
          </div>
          <div className="player-wrap">
            <iframe
              src={activeStreamUrl}
              title={movie.name}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </article>
      )}

      {/* Synopsis Panel */}
      <article className="panel description" id="infoPanel">
        <div className="panel-head">
          <h2>Nội dung phim</h2>
        </div>
        <div className="panel-body">
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </article>

      {/* Facts Panel */}
      <article className="panel" style={{ marginTop: 10 }}>
        <div className="facts">
          <div className="fact">
            🎞️ Chất lượng: <b>{movie.quality || "Đang cập nhật"}</b>
          </div>
          <div className="fact">
            📅 Năm phát hành: <b>{movie.year || "Đang cập nhật"}</b>
          </div>
          <div className="fact">
            🅰️ Ngôn ngữ: <b>{movie.lang || "Đang cập nhật"}</b>
          </div>
          <div className="fact">
            🕒 Thời lượng: <b>{movie.time || "Đang cập nhật"}</b>
          </div>
          <div className="fact">
            💬 Tình trạng: <b>{movie.episode_current || "Đang cập nhật"}</b>
          </div>
          <div className="fact">
            🌐 Quốc gia: <b>{movie.country && movie.country.length > 0 ? movie.country.join(", ") : "Đang cập nhật"}</b>
          </div>
          {movie.director && movie.director.length > 0 && (
            <div className="fact" style={{ gridColumn: "1 / -1" }}>
              🎬 Đạo diễn: <b>{movie.director.join(", ")}</b>
            </div>
          )}
        </div>
      </article>

      {/* Episode / Server List Panel */}
      {totalServers.length > 0 ? (
        <article className="panel" style={{ marginTop: 10 }} id="episodesPanel">
          <div className="panel-head">
            <h2>Danh sách tập phim ({totalServers.reduce((acc, s) => acc + s.items.length, 0)} tập)</h2>
          </div>
          <div className="episodes-container">
            {totalServers.map((server, srvIdx) => (
              <div key={srvIdx} className="server-group">
                <div className="server-title">
                  <span>▶</span> {server.server_name || `Máy chủ ${srvIdx + 1}`} ({server.items.length} tập):
                </div>
                <div className="episode-buttons">
                  {server.items.map((ep, epIdx) => {
                    const isSelected =
                      activeServerIndex === srvIdx && activeEpisodeIndex === epIdx;
                    return (
                      <button
                        key={ep.slug || epIdx}
                        type="button"
                        className={`ep-btn ${isSelected ? "active" : ""}`}
                        onClick={() => onSelectEpisode(ep, srvIdx, epIdx)}
                      >
                        <span>▶</span> {ep.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : (
        <article className="panel" style={{ marginTop: 10 }} id="episodesPanel">
          <div className="panel-head">
            <h2>Danh sách tập phim</h2>
          </div>
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13,
            }}
          >
            Máy chủ chưa cập nhật danh sách tập phát sóng cho tựa phim này. Vui lòng chuyển nguồn phát để tìm máy chủ có sẵn.
          </div>
        </article>
      )}
    </div>
  );
};
