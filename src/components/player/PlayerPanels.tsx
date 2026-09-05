import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { MovieCard, SourceId } from "@/lib/types";

interface CommentItem {
  id: string;
  author: string;
  text: string;
  timeAgo: string;
}

interface PlayerPanelsProps {
  synopsis: string;
  movieSlug: string;
  recommendations: MovieCard[];
  currentSource: SourceId;
  onShowToast: (msg: string) => void;
}

export const PlayerPanels: React.FC<PlayerPanelsProps> = ({
  synopsis,
  movieSlug,
  recommendations,
  currentSource,
  onShowToast,
}) => {
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);

  // Load real comments from localStorage for this movie
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

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commentInput.trim();
    if (!text) return;

    const newComment: CommentItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: "Bạn",
      text,
      timeAgo: "vừa xong",
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    setCommentInput("");

    try {
      localStorage.setItem(`mochi-comments-${movieSlug}`, JSON.stringify(updated));
      onShowToast("Đã đăng bình luận");
    } catch {
      onShowToast("Không thể lưu bình luận");
    }
  };

  const recItems = recommendations.slice(0, 6);

  return (
    <>
      <section className="content-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>Thông tin phim</h2>
          </div>
          <div className="panel-body">
            <p className="synopsis">
              {synopsis
                ? synopsis.replace(/<[^>]*>?/gm, "").trim()
                : "Đang cập nhật tóm tắt nội dung bộ phim từ máy chủ phát trực tuyến..."}
            </p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Phím tắt</h2>
          </div>
          <div className="panel-body shortcuts">
            <div className="shortcut">
              <kbd>Space</kbd>
              <div>
                <strong>Phát / Tạm dừng</strong>
                <small>Điều khiển nhanh player</small>
              </div>
            </div>
            <div className="shortcut">
              <kbd>F</kbd>
              <div>
                <strong>Toàn màn hình</strong>
                <small>Mở chế độ fullscreen</small>
              </div>
            </div>
            <div className="shortcut">
              <kbd>← →</kbd>
              <div>
                <strong>Tua ±10 giây</strong>
                <small>Di chuyển nhanh timeline</small>
              </div>
            </div>
            <div className="shortcut">
              <kbd>M</kbd>
              <div>
                <strong>Tắt / bật âm</strong>
                <small>Mute audio</small>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel comments">
        <div className="panel-head">
          <h2>💬 Bình luận {comments.length > 0 ? `(${comments.length})` : ""}</h2>
          <span style={{ fontSize: 9, color: "#81747c" }}>Dữ liệu lưu trên máy</span>
        </div>
        <form onSubmit={handleAddComment} className="comment-form">
          <input
            id="commentInput"
            placeholder="Viết bình luận về phim..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            aria-label="Nội dung bình luận"
          />
          <button type="submit" id="commentBtn" aria-label="Đăng bình luận">
            Đăng
          </button>
        </form>
        <div className="comment-list" id="commentList">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="comment">
                <img src="/assets/mochi/mascot-mini.png" alt={c.author} />
                <div>
                  <strong>{c.author}</strong>
                  <p>{c.text}</p>
                </div>
                <small>{c.timeAgo}</small>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "20px 0",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 11,
              }}
            >
              Chưa có bình luận nào cho phim này. Hãy để lại cảm nghĩ đầu tiên!
            </div>
          )}
        </div>
      </section>

      <section className="recommend">
        <div className="section-head">
          <h2>⭐ Có thể sếp sẽ thích</h2>
          <Link to="/" search={{ nav: "phim-moi" }}>
            Xem tất cả ›
          </Link>
        </div>
        <div className="movie-row" id="movieRow">
          {recItems.map((m, idx) => (
            <Link
              key={`${m.slug}-${idx}`}
              to="/watch/$slug"
              params={{ slug: m.slug }}
              search={{ source: m.source || currentSource }}
              className="movie"
              data-title={m.name}
            >
              <div className="movie-poster">
                <img src={m.thumb || m.poster} alt={m.name} loading="lazy" />
                <span className="badge">{m.quality || "HD"}</span>
                {m.vote_average !== undefined && m.vote_average > 0 && (
                  <span className="score">★ {m.vote_average.toFixed(1)}</span>
                )}
              </div>
              <div className="movie-info">
                <h3>{m.name}</h3>
                <p>{[m.year, m.episode_current || "Hoàn tất"].filter(Boolean).join(" · ")}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};
