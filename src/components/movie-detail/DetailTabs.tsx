import React from "react";

export type DetailTabType = "info" | "cast" | "comments" | "suggested";

interface DetailTabsProps {
  activeTab: DetailTabType;
  onTabChange: (tab: DetailTabType) => void;
}

export const DetailTabs: React.FC<DetailTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tabs">
      <button
        type="button"
        className={`tab ${activeTab === "info" ? "active" : ""}`}
        onClick={() => onTabChange("info")}
        data-tab="info"
      >
        👤 Thông tin
      </button>
      <button
        type="button"
        className={`tab ${activeTab === "cast" ? "active" : ""}`}
        onClick={() => onTabChange("cast")}
        data-tab="cast"
      >
        ♧ Diễn viên
      </button>
      <button
        type="button"
        className={`tab ${activeTab === "comments" ? "active" : ""}`}
        onClick={() => onTabChange("comments")}
        data-tab="comments"
      >
        💬 Bình luận
      </button>
      <button
        type="button"
        className={`tab ${activeTab === "suggested" ? "active" : ""}`}
        onClick={() => onTabChange("suggested")}
        data-tab="suggested"
      >
        ⭐ Đề xuất
      </button>
    </div>
  );
};
