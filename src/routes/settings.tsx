import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Brush, Database, Gauge, LockKeyhole, Play, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { MobileBottomDock } from "@/components/common/MobileBottomDock";
import { MochiSettingsStore, useMochiSettings, type MochiSettings } from "@/lib/mochi-settings";
import "@/styles/settings.css";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Cài đặt | Mochi Film" }] }),
  component: SettingsPage,
});

type Section = "playback" | "performance" | "appearance" | "notifications" | "privacy" | "data";
const sections = [
  ["playback", Play, "Phát phim"], ["performance", Gauge, "Hiệu năng"], ["appearance", Brush, "Giao diện"],
  ["notifications", Bell, "Thông báo"], ["privacy", LockKeyhole, "Quyền riêng tư"], ["data", Database, "Dữ liệu & bộ nhớ"],
] as const;

function Select({ label, value, options, onChange }: { label: string; value: string | number; options: readonly (readonly [string | number, string])[]; onChange: (value: string) => void }) {
  return <label className="settings-row"><span><strong>{label}</strong></span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
function Toggle({ label, detail, checked, onChange }: { label: string; detail?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="settings-row"><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} /></label>;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="settings-card"><h2>{title}</h2>{children}</section>; }

function SettingsPage() {
  const settings = useMochiSettings();
  const set = (patch: Partial<MochiSettings>) => MochiSettingsStore.set(patch);
  const nested = <K extends "notifications" | "privacy">(key: K, patch: Partial<MochiSettings[K]>) => set({ [key]: { ...settings[key], ...patch } } as Partial<MochiSettings>);
  const clearHistory = () => {
    if (!window.confirm("Xóa lịch sử xem trên thiết bị này? Dữ liệu đã đồng bộ trên tài khoản không bị xóa.")) return;
    localStorage.removeItem("lv-progress"); window.dispatchEvent(new CustomEvent("lv-history-sync"));
  };
  const clearCache = async () => {
    if (!window.confirm("Xóa cache poster, metadata, tìm kiếm và trạng thái trình phát tạm thời?")) return;
    if ("caches" in window) await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    Object.keys(localStorage).filter((key) => /^(mochi-source:|mochi_notifications|mochi-player-)/.test(key)).forEach((key) => localStorage.removeItem(key));
  };
  const clearLocal = () => {
    if (!window.confirm("Xóa cài đặt, lịch sử và dữ liệu Mochi cục bộ trên thiết bị này? Phiên đăng nhập được giữ lại.")) return;
    Object.keys(localStorage).filter((key) => /^(mochi-|lv-)/.test(key) && !key.startsWith("mochi_user")).forEach((key) => localStorage.removeItem(key));
    MochiSettingsStore.reset();
  };

  return <main className="settings-page">
    <aside className="settings-sidebar">
      <Link to="/" className="settings-brand"><img src="/assets/mochi/wordmark.webp" alt="Mochi Film" /></Link>
      <nav>{sections.map(([id, Icon, label]) => <a key={id} href={`#${id}`}><Icon />{label}</a>)}</nav>
    </aside>
    <div className="settings-main">
      <header><Link to="/">← Trang chủ</Link><div><Settings2 /><h1>Cài đặt</h1></div><p>Tùy chỉnh Mochi Film trên thiết bị này.</p></header>

      <div id="playback" className="settings-section"><Card title="Nguồn phát">
        <Select label="Nguồn phát mặc định" value={settings.defaultSource} options={[["auto","Tự động"],["kkphim","KKPhim"],["ophim","OPhim"],["aiphim","AiPhim"],["vsmov","VSMOV"]]} onChange={(defaultSource) => set({ defaultSource: defaultSource as MochiSettings["defaultSource"] })} />
        <Toggle label="Tự động chuyển nguồn khi lỗi" checked={settings.sourceFallback} onChange={(sourceFallback) => set({ sourceFallback })} />
        <Toggle label="Ưu tiên nguồn nhanh nhất" detail="Đánh giá phản hồi API, không tải toàn bộ video." checked={settings.fastestSource} onChange={(fastestSource) => set({ fastestSource })} />
        <Toggle label="Ghi nhớ nguồn theo từng phim" checked={settings.rememberMovieSource} onChange={(rememberMovieSource) => set({ rememberMovieSource })} />
      </Card><Card title="Trình phát">
        <Select label="Chất lượng mặc định" value={settings.quality} options={[["auto","Auto"],["1080","1080p"],["720","720p"],["480","480p"]]} onChange={(quality) => set({ quality: quality as MochiSettings["quality"] })} />
        <Select label="Tốc độ mặc định" value={settings.playbackRate} options={[[.75,"0.75x"],[1,"1.0x"],[1.25,"1.25x"],[1.5,"1.5x"],[1.75,"1.75x"],[2,"2.0x"]]} onChange={(playbackRate) => set({ playbackRate: Number(playbackRate) as MochiSettings["playbackRate"] })} />
        <Toggle label="Tự động phát tập tiếp" checked={settings.autoplayNext} onChange={(autoplayNext) => set({ autoplayNext })} />
        <Toggle label="Bỏ intro khi có dữ liệu" checked={settings.skipIntro} onChange={(skipIntro) => set({ skipIntro })} />
        <Toggle label="Ghi nhớ vị trí xem" checked={settings.rememberProgress} onChange={(rememberProgress) => set({ rememberProgress })} />
      </Card><Card title="Phụ đề">
        <Select label="Ngôn ngữ mặc định" value={settings.subtitleLanguage} options={[["vietsub","Vietsub"],["thuyet-minh","Thuyết minh"],["long-tieng","Lồng tiếng"],["auto","Tự động"]]} onChange={(subtitleLanguage) => set({ subtitleLanguage: subtitleLanguage as MochiSettings["subtitleLanguage"] })} />
        <Select label="Cỡ chữ" value={settings.subtitleSize} options={[["small","Nhỏ"],["medium","Vừa"],["large","Lớn"]]} onChange={(subtitleSize) => set({ subtitleSize: subtitleSize as MochiSettings["subtitleSize"] })} />
        <label className="settings-row"><span><strong>Nền phụ đề</strong><small>{settings.subtitleBackground}%</small></span><input type="range" min="0" max="100" value={settings.subtitleBackground} onChange={(e) => set({ subtitleBackground: Number(e.target.value) })} /></label>
      </Card></div>

      <div id="performance" className="settings-section"><Card title="Hiệu năng">
        <Select label="Chế độ" value={settings.performanceMode} options={[["high","Cao"],["balanced","Cân bằng"],["low","Tiết kiệm"],["auto","Tự động"]]} onChange={(performanceMode) => set({ performanceMode: performanceMode as MochiSettings["performanceMode"] })} />
        <Toggle label="Tự động tối ưu cho thiết bị" checked={settings.autoOptimize} onChange={(autoOptimize) => set({ autoOptimize })} />
        <Toggle label="Giảm animation" checked={settings.reduceMotion} onChange={(reduceMotion) => set({ reduceMotion })} />
        <Toggle label="Giảm blur" checked={settings.reduceBlur} onChange={(reduceBlur) => set({ reduceBlur })} />
        <Toggle label="Giảm neon glow" checked={settings.reduceGlow} onChange={(reduceGlow) => set({ reduceGlow })} />
        <Toggle label="Tắt video nền" checked={!settings.backgroundVideo} onChange={(off) => set({ backgroundVideo: !off })} />
        <Toggle label="Poster chất lượng thấp" checked={settings.lowQualityPosters} onChange={(lowQualityPosters) => set({ lowQualityPosters })} />
        <Toggle label="Lazy-load ảnh" checked={settings.lazyImages} onChange={(lazyImages) => set({ lazyImages })} />
        <Select label="Preload phim" value={settings.preload} options={[["none","Không"],["metadata","Metadata"],["partial","Một phần"]]} onChange={(preload) => set({ preload: preload as MochiSettings["preload"] })} />
      </Card></div>

      <div id="appearance" className="settings-section"><Card title="Giao diện">
        <Select label="Theme" value={settings.theme} options={[["dark","Tối"],["oled","Đen OLED"],["system","Theo hệ thống"]]} onChange={(theme) => set({ theme: theme as MochiSettings["theme"] })} />
        <Select label="Mật độ giao diện" value={settings.density} options={[["compact","Gọn"],["normal","Bình thường"],["wide","Rộng"]]} onChange={(density) => set({ density: density as MochiSettings["density"] })} />
        <Select label="Hiệu ứng mascot" value={settings.mascotEffects} options={[["full","Đầy đủ"],["reduced","Giảm"],["off","Tắt"]]} onChange={(mascotEffects) => set({ mascotEffects: mascotEffects as MochiSettings["mascotEffects"] })} />
        <Select label="Glow / Blur" value={settings.effects} options={[["full","Đầy đủ"],["reduced","Giảm"],["off","Tắt"]]} onChange={(effects) => set({ effects: effects as MochiSettings["effects"] })} />
      </Card></div>

      <div id="notifications" className="settings-section"><Card title="Thông báo">
        {[["newEpisode","Phim có tập mới"],["watchParty","Watch Party"],["favorites","Phim yêu thích cập nhật"],["comments","Bình luận / phản hồi"],["system","Thông báo hệ thống"]].map(([key,label]) => <Toggle key={key} label={label} checked={settings.notifications[key as keyof MochiSettings["notifications"]]} onChange={(value) => nested("notifications", { [key]: value })} />)}
      </Card></div>

      <div id="privacy" className="settings-section"><Card title="Quyền riêng tư">
        <Toggle label="Lưu lịch sử xem" checked={settings.privacy.watchHistory} onChange={(watchHistory) => nested("privacy", { watchHistory })} />
        <Select label="Hiển thị hoạt động" value={settings.privacy.activityVisibility} options={[["public","Công khai"],["friends","Bạn bè"],["private","Riêng tư"]]} onChange={(activityVisibility) => nested("privacy", { activityVisibility: activityVisibility as "public"|"friends"|"private" })} />
        <Select label="Hiển thị phim yêu thích" value={settings.privacy.favoritesVisibility} options={[["public","Công khai"],["friends","Bạn bè"],["private","Riêng tư"]]} onChange={(favoritesVisibility) => nested("privacy", { favoritesVisibility: favoritesVisibility as "public"|"friends"|"private" })} />
        <Toggle label="Hiển thị trạng thái Watch Party" checked={settings.privacy.showWatchParty} onChange={(showWatchParty) => nested("privacy", { showWatchParty })} />
        <button className="settings-danger" type="button" onClick={clearHistory}><Trash2 /> Xóa lịch sử xem</button>
      </Card></div>

      <div id="data" className="settings-section"><Card title="Dữ liệu & bộ nhớ">
        <button type="button" onClick={() => void clearCache()}><Trash2 /> Xóa cache</button>
        <button className="settings-danger" type="button" onClick={clearLocal}><Trash2 /> Xóa dữ liệu trên thiết bị này</button>
      </Card></div>

      <footer><button type="button" onClick={() => window.confirm("Khôi phục toàn bộ cài đặt mặc định?") && MochiSettingsStore.reset()}><RotateCcw /> Khôi phục cài đặt mặc định</button><p>✓ Cài đặt được tự động lưu</p></footer>
    </div>
    <MobileBottomDock />
  </main>;
}
