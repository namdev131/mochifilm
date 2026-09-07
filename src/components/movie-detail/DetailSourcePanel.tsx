import React from "react";
import type { SourceId } from "@/lib/types";

interface SourceItemConfig {
  id: SourceId;
  name: string;
  route: string;
  emoji: string;
  api: (slug: string) => string;
}

const SOURCES_CONFIG: SourceItemConfig[] = [
  {
    id: "ophim",
    name: "OPhim",
    route: "/ophim",
    emoji: "🍿",
    api: (slug) => `/api/ophim/movie/${slug}`,
  },
  {
    id: "kkphim",
    name: "KKPhim",
    route: "/kkphim",
    emoji: "🌸",
    api: (slug) => `/api/kkphim/movie/${slug}`,
  },
  {
    id: "nguonc",
    name: "Nguồn Phim",
    route: "/nguonphim",
    emoji: "🎞️",
    api: (slug) => `/api/nguonphim/movie/${slug}`,
  },
  {
    id: "vsmov",
    name: "VSMov",
    route: "/vsmov",
    emoji: "⚡",
    api: (slug) => `/api/vsmov/movie/${slug}`,
  },
  {
    id: "aiphim",
    name: "AI Phim",
    route: "/aiphim",
    emoji: "🤖",
    api: (slug) => `/api/aiphim/movie/${slug}`,
  },
];

interface DetailSourcePanelProps {
  currentSource: SourceId;
  movieSlug: string;
  onSelectSource: (source: SourceId) => void;
}

export const DetailSourcePanel: React.FC<DetailSourcePanelProps> = ({
  currentSource,
  movieSlug,
  onSelectSource,
}) => {
  const activeConfig = SOURCES_CONFIG.find((s) => s.id === currentSource) || SOURCES_CONFIG[0];

  return (
    <aside className="source-panel">
      <h3>Nguồn phát</h3>
      <div className="source-list" id="sourceList">
        {SOURCES_CONFIG.map((s) => {
          const isActive = s.id === currentSource;
          return (
            <button
              key={s.id}
              type="button"
              className={`source-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectSource(s.id)}
              data-source={s.id}
            >
              <span className="source-icon">{s.emoji}</span>
              <span>
                <strong>{s.name}</strong>
                <small>{s.route}</small>
              </span>
              <b>{isActive ? "✓" : ""}</b>
            </button>
          );
        })}
      </div>

      <div className="api-box">
        <i />
        <strong>API đang sử dụng</strong>
        <code id="apiCode">GET {activeConfig.api(movieSlug)}</code>
      </div>

      <div className="api-note">
        Dữ liệu phim được cập nhật từ nguồn đang chọn thông qua route tương ứng.
      </div>
    </aside>
  );
};
