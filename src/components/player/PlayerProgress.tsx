import { useState, useRef } from "react";
import type { KeyboardEvent, PointerEvent, MouseEvent } from "react";

interface PlayerProgressProps {
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  isPlaying: boolean;
  isSeeking: boolean;
  posterUrl?: string;
  formatTime: (seconds: number) => string;
  onSeekingChange: (seeking: boolean) => void;
  onSeek: (clientX: number, element: HTMLDivElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

// Các mốc chương mẫu (theo tỷ lệ phần trăm thời lượng phim)
const CHAPTER_RATIOS = [0.15, 0.35, 0.58, 0.78, 0.92];

export function PlayerProgress({
  currentTime,
  duration,
  bufferedPercent,
  isPlaying,
  isSeeking,
  posterUrl,
  formatTime,
  onSeekingChange,
  onSeek,
  onKeyDown,
}: PlayerProgressProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number | null>(null);

  const progressPercent = duration ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
  const mochiLeft = `calc(${progressPercent}% + ${31 * (1 - progressPercent / 50)}px)`;

  const updateHover = (clientX: number) => {
    if (!wrapRef.current || !duration) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = clampedX / rect.width;
    setHoverTime(ratio * duration);
    setHoverPos(clampedX);
  };

  const handlePointerEnter = (e: MouseEvent<HTMLDivElement>) => {
    updateHover(e.clientX);
  };

  const handlePointerLeave = () => {
    if (!isSeeking) {
      setHoverTime(null);
      setHoverPos(null);
    }
  };

  const startSeeking = (event: PointerEvent<HTMLDivElement>) => {
    onSeekingChange(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateHover(event.clientX);
    onSeek(event.clientX, event.currentTarget);
  };

  const handleSeekingMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateHover(event.clientX);
      onSeek(event.clientX, event.currentTarget);
    }
  };

  const stopSeeking = () => {
    onSeekingChange(false);
    setHoverTime(null);
    setHoverPos(null);
  };

  return (
    <div
      ref={wrapRef}
      className="progress-wrap"
      id="progressWrap"
      onPointerDown={startSeeking}
      onPointerMove={handleSeekingMove}
      onPointerUp={stopSeeking}
      onPointerCancel={stopSeeking}
      onMouseEnter={handlePointerEnter}
      onMouseMove={(e) => updateHover(e.clientX)}
      onMouseLeave={handlePointerLeave}
      onKeyDown={onKeyDown}
      role="slider"
      tabIndex={0}
      aria-label="Tiến trình phát phim"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-valuenow={Math.floor(currentTime)}
      aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
    >
      {/* Tooltip tua nhanh (Hover Thumbnail Preview) */}
      {hoverTime !== null && hoverPos !== null && duration > 0 && (
        <div
          className="progress-preview-tooltip"
          style={{ left: `${hoverPos}px` }}
          aria-hidden="true"
        >
          {posterUrl && (
            <div className="preview-thumb-wrap">
              <img src={posterUrl} alt="Preview" className="preview-thumb-img" />
              <div className="preview-thumb-overlay" />
            </div>
          )}
          <span className="preview-time-badge">{formatTime(hoverTime)}</span>
        </div>
      )}

      <div className="progress-track">
        {/* Điểm đệm buffer */}
        <div className="progress-buffer" style={{ width: `${bufferedPercent}%` }} />

        {/* Phần đã xem (Hồng gradient) */}
        <div
          className="progress-played"
          id="progressPlayed"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Các mốc chương phim (Chương - Chấm vàng hổ phách) */}
        {duration > 60 &&
          CHAPTER_RATIOS.map((ratio, index) => (
            <span
              key={index}
              className={`progress-chapter-dot ${progressPercent >= ratio * 100 ? "is-passed" : ""}`}
              style={{ left: `${ratio * 100}%` }}
              title={`Chương ${index + 1}`}
            />
          ))}

        {/* Mèo Mochi chạy tại đầu kim tiến trình */}
        <span
          className={`progress-mochi ${isPlaying && !isSeeking ? "is-playing" : ""} ${isSeeking ? "is-dragging" : ""}`}
          id="progressKnob"
          style={{ left: mochiLeft }}
          aria-hidden="true"
        >
          <img src="/assets/mochi/progress-runner.png" alt="" />
        </span>
      </div>
    </div>
  );
}
