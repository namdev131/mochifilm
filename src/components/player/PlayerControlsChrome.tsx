import { useState } from "react";
import type { ChangeEvent, CSSProperties, KeyboardEvent, MouseEvent } from "react";
import {
  Captions, Expand, Film, Gauge, Lock, Maximize, Pause, Play, RotateCcw, RotateCw,
  Server, Settings, Unlock, Volume2, VolumeX,
} from "lucide-react";
import { PlayerProgress } from "./PlayerProgress";
import { PlayerSettingsMenu } from "./PlayerSettingsMenu";
import type { PlayerQualityOption, PlayerSubtitleOption } from "./PlayerSettingsMenu";

interface PlayerControlsChromeProps {
  visible: boolean;
  controlsLocked: boolean;
  isPlaying: boolean;
  isSeeking: boolean;
  isMuted: boolean;
  isTheater: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  playbackSpeed: string;
  quality: string;
  settingsOpen: boolean;
  subtitlesEnabled: boolean;
  qualities: PlayerQualityOption[];
  qualityLevel: number;
  subtitles: PlayerSubtitleOption[];
  subtitleTrack: number;
  posterUrl?: string;
  isEmbed?: boolean;
  hasHls?: boolean;
  hasEmbed?: boolean;
  formatTime: (seconds: number) => string;
  onTogglePlay: () => void;
  onToggleLock: (event: MouseEvent<HTMLButtonElement>) => void;
  onSkip: (seconds: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSpeedChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onSpeedValueChange: (speed: string) => void;
  onToggleSubtitles: () => void;
  onToggleSettings: () => void;
  onQualityChange: (level: number) => void;
  onSubtitleChange: (track: number) => void;
  onToggleTheater: () => void;
  onToggleFullscreen: () => void;
  onToggleStreamMode?: () => void;
  onOpenEpisodes?: () => void;
  onOpenServers?: () => void;
  onSeekingChange: (seeking: boolean) => void;
  onSeek: (clientX: number, element: HTMLDivElement) => void;
  onProgressKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function PlayerControlsChrome(props: PlayerControlsChromeProps) {
  const {
    visible, controlsLocked, isPlaying, isSeeking, isMuted, isTheater,
    currentTime, duration, bufferedPercent, volume, playbackSpeed, quality,
    settingsOpen, subtitlesEnabled, qualities, qualityLevel, subtitles, subtitleTrack, posterUrl,
    isEmbed, hasHls, hasEmbed, formatTime,
    onTogglePlay, onToggleLock, onSkip, onToggleMute, onVolumeChange,
    onSpeedChange, onSpeedValueChange, onToggleSubtitles, onToggleSettings,
    onQualityChange, onSubtitleChange, onToggleTheater, onToggleFullscreen,
    onToggleStreamMode, onOpenEpisodes, onOpenServers, onSeekingChange,
    onSeek, onProgressKeyDown,
  } = props;

  const [showRemainingTime, setShowRemainingTime] = useState(false);

  // Huy hiệu hiển thị chất lượng: Auto, HD, FHD, 4K
  const displayQualityBadge = qualityLevel >= 0 && qualities[qualityLevel]
    ? qualities[qualityLevel].label.toUpperCase().replace("P", "")
    : (quality || "HD");

  return (
    <>
      <button
        type="button"
        className={`center-play ${isPlaying ? "hidden" : ""}`}
        id="centerPlay"
        onClick={onTogglePlay}
        aria-label="Phát"
      >
        <Play />
      </button>

      <button
        type="button"
        className="player-controls-lock"
        onClick={onToggleLock}
        aria-label={controlsLocked ? "Mở khóa công cụ" : "Khóa công cụ"}
        aria-pressed={controlsLocked}
        title={controlsLocked ? "Mở khóa công cụ" : "Khóa công cụ"}
      >
        {controlsLocked ? <Unlock /> : <Lock />}
      </button>

      <div className="controls" aria-hidden={!visible} onClick={(event) => event.stopPropagation()}>
        <PlayerProgress
          currentTime={currentTime}
          duration={duration}
          bufferedPercent={bufferedPercent}
          isPlaying={isPlaying}
          isSeeking={isSeeking}
          posterUrl={posterUrl}
          formatTime={formatTime}
          onSeekingChange={onSeekingChange}
          onSeek={onSeek}
          onKeyDown={onProgressKeyDown}
        />

        <div className="controls-row">
          <div className="player-mobile-primary-controls">
            <button
              type="button"
              className={`control-btn player-primary-control ${isPlaying ? "is-active-playing" : "is-paused"}`}
              id="playBtn"
              onClick={onTogglePlay}
              title="Phát / tạm dừng"
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? <Pause /> : <Play className="play-glyph" />}
            </button>
            <button
              type="button"
              className="control-btn skip-control"
              id="skipBackBtn"
              onClick={() => onSkip(-10)}
              title="Tua lùi 10 giây"
              aria-label="Tua lùi 10 giây"
            >
              <RotateCcw />
              <b>10</b>
            </button>
            <button
              type="button"
              className="control-btn skip-control"
              id="skipForwardBtn"
              onClick={() => onSkip(10)}
              title="Tua tới 10 giây"
              aria-label="Tua tới 10 giây"
            >
              <RotateCw />
              <b>10</b>
            </button>
          </div>

          <div className="volume">
            <button
              type="button"
              className="control-btn volume-btn"
              id="muteBtn"
              onClick={onToggleMute}
              title="Âm lượng"
              aria-label={isMuted ? "Bật âm lượng" : "Tắt tiếng"}
            >
              {isMuted ? <VolumeX /> : <Volume2 />}
            </button>
            <input
              id="volumeRange"
              type="range"
              min="0"
              max="1"
              step=".05"
              value={isMuted ? 0 : volume}
              onChange={onVolumeChange}
              aria-label="Thanh âm lượng"
              style={{ "--volume": `${(isMuted ? 0 : volume) * 100}%` } as CSSProperties}
            />
          </div>

          <button
            type="button"
            className="time time-pill"
            onClick={() => setShowRemainingTime((prev) => !prev)}
            title="Nhấn để đổi thời gian đã xem / thời gian còn lại"
            aria-label="Thời gian phát"
          >
            <span id="currentTime">
              {showRemainingTime && duration > 0
                ? `-${formatTime(Math.max(0, duration - currentTime))}`
                : formatTime(currentTime)}
            </span>
            {" / "}
            <span id="duration">{formatTime(duration)}</span>
          </button>

          <div className="control-space" />

          {/* Đổi chế độ phát HLS / Embed */}
          {onToggleStreamMode && (
            <button
              type="button"
              className={`stream-mode-badge ${isEmbed ? "is-embed" : "is-hls"}`}
              id="playerStreamModeBtn"
              onClick={onToggleStreamMode}
              title={`Đang phát ${isEmbed ? "Embed" : "HLS"}. Bấm để đổi sang ${isEmbed ? "HLS" : "Embed"}`}
              aria-label={`Đổi chế độ phát giữa HLS và Embed (hiện tại: ${isEmbed ? "Embed" : "HLS"})`}
            >
              <span className="mode-dot" />
              <b>{isEmbed ? "Embed" : "HLS"}</b>
            </button>
          )}

          {/* Chọn tập phim */}
          {onOpenEpisodes && (
            <button
              type="button"
              className="control-btn"
              id="playerEpisodesBtn"
              onClick={onOpenEpisodes}
              title="Danh sách tập phim"
              aria-label="Danh sách tập phim"
            >
              <Film />
            </button>
          )}

          {/* Đổi máy chủ */}
          {onOpenServers && (
            <button
              type="button"
              className="control-btn"
              id="playerServerBtn"
              onClick={onOpenServers}
              title="Đổi máy chủ / server"
              aria-label="Đổi máy chủ phát"
            >
              <Server />
            </button>
          )}

          {/* Nút phụ đề */}
          <button
            type="button"
            className={`control-btn subtitle-btn ${subtitlesEnabled ? "active" : ""}`}
            id="subtitleBtn"
            onClick={onToggleSubtitles}
            title="Phụ đề"
            aria-label={subtitlesEnabled ? "Tắt phụ đề" : "Bật phụ đề"}
            aria-pressed={subtitlesEnabled}
          >
            <Captions />
          </button>

          {/* Nút cài đặt & huy hiệu chất lượng */}
          <button
            type="button"
            className={`quality player-quality-badge ${settingsOpen ? "active" : ""}`}
            onClick={onToggleSettings}
            title="Cài đặt"
            aria-label="Mở cài đặt trình phát"
            aria-expanded={settingsOpen}
            aria-controls="playerSettingsMenu"
          >
            <Settings />
            <b>{displayQualityBadge}</b>
          </button>

          {/* Tốc độ phát */}
          <label className="speed-control" title="Tốc độ phát">
            <Gauge aria-hidden="true" />
            <select
              className="select-speed"
              id="speedSelect"
              value={playbackSpeed}
              onChange={onSpeedChange}
              aria-label="Tốc độ phát"
            >
              <option value=".75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </label>

          {/* Chế độ rạp phim */}
          <button
            type="button"
            className={`control-btn ${isTheater ? "active" : ""}`}
            id="theaterBtn"
            onClick={onToggleTheater}
            title="Chế độ rạp"
            aria-label="Chế độ rạp"
          >
            <Expand />
          </button>

          {/* Toàn màn hình */}
          <button
            type="button"
            className="control-btn"
            id="fullscreenBtn"
            onClick={onToggleFullscreen}
            title="Toàn màn hình"
            aria-label="Toàn màn hình"
          >
            <Maximize />
          </button>
        </div>

        <PlayerSettingsMenu
          open={settingsOpen}
          qualities={qualities}
          qualityLevel={qualityLevel}
          subtitles={subtitles}
          subtitleTrack={subtitleTrack}
          playbackSpeed={playbackSpeed}
          onQualityChange={onQualityChange}
          onSubtitleChange={onSubtitleChange}
          onSpeedChange={onSpeedValueChange}
          onClose={onToggleSettings}
        />
      </div>
    </>
  );
}

