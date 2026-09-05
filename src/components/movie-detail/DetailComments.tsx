import React, { useState, useEffect } from "react";

export interface RealCommentItem {
  id: string;
  author: string;
  text: string;
  rating: number;
  timeAgo: string;
  createdAt: number;
}

interface DetailCommentsProps {
  movieSlug: string;
  onShowToast?: (msg: string) => void;
}

export const DetailComments: React.FC<DetailCommentsProps> = ({ movieSlug, onShowToast }) => {
  const [commentInput, setCommentInput] = useState("");
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [comments, setComments] = useState<RealCommentItem[]>([]);

  // Load real comments from localStorage for this specific movie
  useEffect(() => {
    try {
      const key = `mochi-comments-${movieSlug}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setComments(JSON.parse(saved));
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    }
  }, [movieSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInput.trim();
    if (!text) return;

    const newComment: RealCommentItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: "Bạn",
      text,
      rating: ratingInput,
      timeAgo: "Vừa xong",
      createdAt: Date.now(),
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    setCommentInput("");

    try {
      const key = `mochi-comments-${movieSlug}`;
      localStorage.setItem(key, JSON.stringify(updated));
      onShowToast?.("Đã gửi bình luận của bạn thành công!");
    } catch {
      onShowToast?.("Không thể lưu bình luận");
    }
  };

  return (
    <article className="panel" style={{ marginTop: 10 }} id="commentsPanel">
      <div className="panel-head">
        <h2>Bình luận {comments.length > 0 ? `(${comments.length})` : ""}</h2>
        {comments.length > 3 && (
          <button
            type="button"
            className="small-all"
            onClick={() => onShowToast?.(`Đang hiển thị toàn bộ ${comments.length} bình luận`)}
          >
            Xem tất cả ›
          </button>
        )}
      </div>

      {comments.length > 0 ? (
        <div className="comment-list" id="commentList">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <img
                src="/assets/mochi/mascot-mini.png"
                alt={c.author}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(255, 91, 138, 0.15)",
                  border: "1px solid rgba(255, 91, 138, 0.3)",
                  objectFit: "contain",
                  padding: 2,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <strong>{c.author}</strong>
                  <small style={{ color: "var(--muted)", fontSize: 11 }}>{c.timeAgo}</small>
                </div>
                <p>{c.text}</p>
              </div>
              <span style={{ color: "var(--yellow)", fontWeight: 800, fontSize: 12 }}>
                ★ {c.rating}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Chưa có bình luận nào cho phim này. Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn!
        </div>
      )}

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          placeholder="Viết nhận xét của bạn về phim..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select
            value={ratingInput}
            onChange={(e) => setRatingInput(Number(e.target.value))}
            style={{
              height: 36,
              padding: "0 8px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--line)",
              color: "var(--yellow)",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
            aria-label="Chọn điểm đánh giá"
          >
            <option value={5} style={{ background: "#171016", color: "#ffc75d" }}>★ 5 - Tuyệt vời</option>
            <option value={4} style={{ background: "#171016", color: "#ffc75d" }}>★ 4 - Rất hay</option>
            <option value={3} style={{ background: "#171016", color: "#ffc75d" }}>★ 3 - Khá ổn</option>
            <option value={2} style={{ background: "#171016", color: "#ffc75d" }}>★ 2 - Tạm được</option>
            <option value={1} style={{ background: "#171016", color: "#ffc75d" }}>★ 1 - Chưa hay</option>
          </select>
          <button type="submit">Gửi</button>
        </div>
      </form>
    </article>
  );
};
