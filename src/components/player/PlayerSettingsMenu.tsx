export interface PlayerQualityOption {
  level: number;
  label: string;
}

export interface PlayerSubtitleOption {
  track: number;
  label: string;
}

interface PlayerSettingsMenuProps {
  open: boolean;
  qualities: PlayerQualityOption[];
  qualityLevel: number;
  subtitles: PlayerSubtitleOption[];
  subtitleTrack: number;
  playbackSpeed: string;
  onQualityChange: (level: number) => void;
  onSubtitleChange: (track: number) => void;
  onSpeedChange: (speed: string) => void;
  onClose: () => void;
}

const speedChips = ["0.75", "1", "1.25", "1.5", "2"];

export function PlayerSettingsMenu({
  open,
  qualities,
  qualityLevel,
  subtitles,
  subtitleTrack,
  playbackSpeed,
  onQualityChange,
  onSubtitleChange,
  onSpeedChange,
  onClose,
}: PlayerSettingsMenuProps) {
  if (!open) return null;

  return (
    <div
      className="player-settings-menu"
      id="playerSettingsMenu"
      role="dialog"
      aria-label="Cài đặt trình phát"
    >
      <div className="settings-header">
        <span className="settings-title">⚙ Cài đặt trình phát</span>
        <button
          type="button"
          className="settings-close"
          onClick={onClose}
          aria-label="Đóng cài đặt"
        >
          ×
        </button>
      </div>

      {/* 1. Tốc độ phát (Speed Chips) */}
      <div className="settings-section">
        <div className="settings-label-row">
          <span>Tốc độ phát</span>
          <span className="settings-current-val">{playbackSpeed}x</span>
        </div>
        <div className="settings-chips-row">
          {speedChips.map((speed) => (
            <button
              key={speed}
              type="button"
              className={`settings-chip ${playbackSpeed === speed || (speed === "1" && playbackSpeed === "1.0") ? "active" : ""}`}
              onClick={() => onSpeedChange(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
        {/* Hidden select for accessibility / form control */}
        <select
          value={playbackSpeed}
          onChange={(event) => onSpeedChange(event.target.value)}
          aria-label="Tốc độ phát"
          style={{ display: "none" }}
        >
          {speedChips.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </div>

      {/* 2. Chất lượng (Quality) */}
      <div className="settings-section">
        <div className="settings-label-row">
          <span>Chất lượng</span>
          <span className="settings-current-val">
            {qualityLevel === -1
              ? "Tự động"
              : qualities.find((q) => q.level === qualityLevel)?.label || "HD"}
          </span>
        </div>
        <div className="settings-chips-row">
          <button
            type="button"
            className={`settings-chip ${qualityLevel === -1 ? "active" : ""}`}
            onClick={() => onQualityChange(-1)}
          >
            Auto
          </button>
          {qualities.map((item) => (
            <button
              key={item.level}
              type="button"
              className={`settings-chip ${qualityLevel === item.level ? "active" : ""}`}
              onClick={() => onQualityChange(item.level)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          value={qualities.length ? qualityLevel : -1}
          onChange={(event) => onQualityChange(Number(event.target.value))}
          aria-label="Chất lượng video"
          disabled={!qualities.length}
          style={{ display: "none" }}
        >
          <option value={-1}>Auto</option>
          {qualities.map((item) => (
            <option key={item.level} value={item.level}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Phụ đề (Subtitles) */}
      <div className="settings-section">
        <div className="settings-label-row">
          <span>Phụ đề</span>
          <span className="settings-current-val">
            {subtitleTrack === -1
              ? "Tắt"
              : subtitles.find((s) => s.track === subtitleTrack)?.label || "Bật"}
          </span>
        </div>
        <div className="settings-chips-row">
          <button
            type="button"
            className={`settings-chip ${subtitleTrack === -1 ? "active" : ""}`}
            onClick={() => onSubtitleChange(-1)}
          >
            Tắt
          </button>
          {subtitles.map((item) => (
            <button
              key={item.track}
              type="button"
              className={`settings-chip ${subtitleTrack === item.track ? "active" : ""}`}
              onClick={() => onSubtitleChange(item.track)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          value={subtitleTrack}
          onChange={(event) => onSubtitleChange(Number(event.target.value))}
          aria-label="Ngôn ngữ phụ đề"
          disabled={!subtitles.length}
          style={{ display: "none" }}
        >
          <option value={-1}>Tắt</option>
          {subtitles.map((item) => (
            <option key={item.track} value={item.track}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
