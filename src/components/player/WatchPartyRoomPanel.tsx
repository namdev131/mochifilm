import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Lock,
  MessageCircle,
  RefreshCw,
  QrCode,
  Send,
  Share2,
  Settings,
  ShieldCheck,
  Unlock,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Room = {
  id: string;
  code: string;
  host_id: string;
  join_locked: boolean;
  is_host: boolean;
  is_admin: boolean;
};

type Member = {
  user_id: string;
  display_name: string;
  joined_at: string;
  staff_role?: "admin" | "deputy_admin" | "vip" | "member";
};

type Message = {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
  staff_role?: "admin" | "deputy_admin" | "vip" | "member";
};

export function WatchPartyRoomPanel({
  partyCode,
  onShowToast,
  onClosed,
  onPlayback,
  activeServerIndex,
  activeEpisodeIndex,
  onGuestChange,
}: {
  partyCode: string;
  onShowToast: (message: string) => void;
  onClosed: () => void;
  onPlayback: (state: { slug: string; source: string; ep_index: number; srv_index: number }) => void;
  activeServerIndex: number;
  activeEpisodeIndex: number;
  onGuestChange?: (isGuest: boolean) => void;
}) {
  const [tab, setTab] = useState<"chat" | "members" | "rules" | "settings">("chat");
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const syncing = useRef(false);
  const [notice, setNotice] = useState("");
  const knownMessageIds = useRef<Set<string> | null>(null);
  const knownMemberIds = useRef<Set<string> | null>(null);

  const request = useCallback(async (body: Record<string, unknown>) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error("Đăng nhập để dùng Watch Party");
    setUserId(session.user.id);
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
  }, []);

  const syncPlayback = useCallback(
    async (manual = false) => {
      if (!room || syncing.current) return;
      const video = document.querySelector<HTMLVideoElement>("video#video");
      if (!video || video.readyState < 1 || video.style.display === "none") {
        if (manual) onShowToast("Đồng bộ cần player video trực tiếp đã tải; iframe không hỗ trợ.");
        return;
      }
      syncing.current = true;
      try {
        if (room.is_host) {
          await request({
            action: "sync",
            partyId: room.id,
            patch: { position_seconds: video.currentTime, is_playing: !video.paused, ep_index: activeEpisodeIndex, srv_index: activeServerIndex },
          });
        } else {
          const result = await request({ action: "playback", partyId: room.id });
          const state = result.playback;
          const position =
            Number(state.position_seconds) +
            (state.is_playing
              ? Math.max(0, (result.server_time - Date.parse(state.playback_updated_at)) / 1000)
              : 0);
          onPlayback(state);
          if (Number.isFinite(position) && (manual || Math.abs(video.currentTime - position) > 2))
            video.currentTime = Number.isFinite(video.duration)
              ? Math.min(position, video.duration)
              : position;
          if (state.is_playing && video.paused) await video.play();
          else if (!state.is_playing && !video.paused) video.pause();
        }
        if (manual) onShowToast("Đã đồng bộ với phòng");
      } catch (cause) {
        if (manual) onShowToast(cause instanceof Error ? cause.message : "Không thể đồng bộ");
      } finally {
        syncing.current = false;
      }
    },
    [room?.id, room?.is_host, request, onShowToast, onPlayback, activeServerIndex, activeEpisodeIndex],
  );

  useEffect(() => {
    void syncPlayback();
    if (!room?.id) return;
    const channel = supabase
      .channel(`watch_party_playback_${room.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "watch_parties", filter: `id=eq.${room.id}` }, () => void syncPlayback())
      .subscribe();
    const timer = window.setInterval(() => void syncPlayback(), 10_000);
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [room?.id, syncPlayback]);

  const load = useCallback(async () => {
    try {
      const listed = await request({ action: "list" });
      const current = listed.parties?.find((party: Room) => party.code === partyCode) as
        Room | undefined;
      if (!current) { onClosed(); throw new Error("Phòng không còn hoạt động"); }
      const [memberResult, chatResult] = await Promise.all([
        request({ action: "members-list", partyId: current.id }),
        request({ action: "chat-list", partyId: current.id }),
      ]);
      const nextMembers = (memberResult.members || []) as Member[];
      const nextMessages = (chatResult.messages || []) as Message[];
      const adminJoined = nextMembers.find(
        (member) => member.staff_role === "admin" && !knownMemberIds.current?.has(member.user_id),
      );
      const incomingAdmin = nextMessages.findLast(
        (message) =>
          message.staff_role === "admin" &&
          message.user_id !== userId &&
          !knownMessageIds.current?.has(message.id),
      );
      if (knownMemberIds.current && adminJoined) setNotice("Admin đã vào phòng");
      else if (knownMessageIds.current && incomingAdmin)
        setNotice(`${incomingAdmin.display_name}: ${incomingAdmin.content.slice(0, 80)}`);
      knownMemberIds.current = new Set(nextMembers.map((member) => member.user_id));
      knownMessageIds.current = new Set(nextMessages.map((message) => message.id));
      setRoom(current);
      onGuestChange?.(!current.is_host);
      setMembers(nextMembers);
      setMessages(nextMessages);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải phòng");
    }
  }, [partyCode, request, userId, onClosed, onGuestChange]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!room?.is_host) return;
    const heartbeat = () => void request({ action: "host-heartbeat", partyId: room.id });
    const onVisible = () => document.visibilityState === "visible" && heartbeat();
    heartbeat();
    const timer = window.setInterval(heartbeat, 30_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [request, room?.id, room?.is_host]);

  useEffect(() => {
    if (!qrOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setQrOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [qrOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!room || !content || busy) return;
    setBusy(true);
    try {
      const result = await request({ action: "chat-send", partyId: room.id, content });
      setMessages((current) => [...current, result.message]);
      setDraft("");
    } catch (cause) {
      onShowToast(cause instanceof Error ? cause.message : "Không thể gửi tin nhắn");
    } finally {
      setBusy(false);
    }
  };

  const setLocked = async () => {
    if (!room || busy) return;
    setBusy(true);
    try {
      await request({ action: "set-lock", partyId: room.id, locked: !room.join_locked });
      setRoom({ ...room, join_locked: !room.join_locked });
      onShowToast(room.join_locked ? "Đã mở khóa phòng" : "Đã khóa phòng");
    } catch (cause) {
      onShowToast(cause instanceof Error ? cause.message : "Không thể đổi khóa phòng");
    } finally {
      setBusy(false);
    }
  };

  const closeRoom = async () => {
    if (
      !room ||
      busy ||
      !window.confirm("Đóng phòng Watch Party này? Mọi người sẽ không thể vào lại.")
    )
      return;
    setBusy(true);
    try {
      await request({ action: "close", partyId: room.id });
      onClosed();
    } catch (cause) {
      onShowToast(cause instanceof Error ? cause.message : "Không thể đóng phòng");
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Watch Party ${partyCode}`, url: window.location.href });
        return;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      onShowToast("Đã sao chép liên kết mời");
    } catch {
      onShowToast(`Mã phòng: ${partyCode}`);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.href)}`;

  return (
    <>
      <aside
        className="rightbar watch-party-room-panel"
        aria-label={`Phòng Watch Party ${partyCode}`}
      >
        {notice && (
          <div className="watch-party-admin-notice" role="status" aria-live="polite">
            <ShieldCheck />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Đóng thông báo">
              <X />
            </button>
          </div>
        )}
        <header className="watch-party-room-head">
          <div className="watch-party-room-head-meta">
            <span>Watch Party</span>
            <strong>{partyCode}</strong>
          </div>
          <button
            type="button"
            className="watch-party-sync-btn"
            onClick={() => void syncPlayback(true)}
            title="Đồng bộ lại trạng thái phát phim"
          >
            <RefreshCw /> Đồng bộ
          </button>
        </header>

        <div className="watch-party-invite-actions">
          <button type="button" onClick={() => void shareInvite()}>
            <Share2 /> Chia sẻ phòng
          </button>
          <button type="button" onClick={() => setQrOpen(true)}>
            <QrCode /> Quét QR
          </button>
        </div>

        <div className="watch-party-tabs" role="tablist" aria-label="Thông tin phòng">
          <button
            type="button"
            className={tab === "chat" ? "active" : ""}
            onClick={() => setTab("chat")}
          >
            <MessageCircle />
            Trò chuyện
          </button>
          <button
            type="button"
            className={tab === "members" ? "active" : ""}
            onClick={() => setTab("members")}
          >
            <Users />
            Thành viên
          </button>
          <button
            type="button"
            className={tab === "rules" ? "active" : ""}
            onClick={() => setTab("rules")}
          >
            <ShieldCheck />
            Quy tắc
          </button>
          <button
            type="button"
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
          >
            <Settings />
            Cài đặt
          </button>
        </div>

        {error ? (
          <div className="watch-party-room-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void load()}>
              <RefreshCw /> Thử lại
            </button>
          </div>
        ) : tab === "chat" ? (
          <div className="watch-party-chat">
            <div className="watch-party-messages" aria-live="polite">
              {!messages.length && (
                <p className="watch-party-empty">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>
              )}
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={[
                    message.user_id === userId ? "mine" : "",
                    message.staff_role === "admin" ? "watch-party-message-admin" : "",
                    message.staff_role === "deputy_admin" ? "watch-party-message-deputy" : "",
                    message.staff_role === "vip" ? "watch-party-message-vip" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="watch-party-avatar">
                    <UserRound />
                  </span>
                  <div>
                    <header>
                      <strong>{message.display_name}</strong>
                      {message.staff_role && message.staff_role !== "member" && (
                        <b>
                          {message.staff_role === "admin"
                            ? "ADMIN"
                            : message.staff_role === "vip" ? "VIP" : "PHÓ ADMIN"}
                        </b>
                      )}
                      <time>
                        {new Date(message.created_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </header>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
            </div>
            <form onSubmit={sendMessage} className="watch-party-composer">
              <label htmlFor="party-chat-input">Tin nhắn</label>
              <div>
                <input
                  id="party-chat-input"
                  value={draft}
                  maxLength={500}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Nhập tin nhắn..."
                />
                <button type="submit" disabled={busy || !draft.trim()} aria-label="Gửi tin nhắn">
                  <Send />
                </button>
              </div>
            </form>
          </div>
        ) : tab === "members" ? (
          <div className="watch-party-member-list">
            {!members.length && <p className="watch-party-empty">Đang tải thành viên...</p>}
            {members.map((member) => (
              <article
                key={member.user_id}
                className={member.staff_role === "admin" ? "watch-party-member-admin" : ""}
              >
                <span className="watch-party-avatar">
                  <UserRound />
                </span>
                <div>
                  <strong>{member.display_name}</strong>
                  <small>{member.user_id === room?.host_id ? "Chủ phòng" : "Đang xem"}</small>
                </div>
                {member.staff_role === "admin" ? (
                  <b>ADMIN</b>
                ) : member.user_id === room?.host_id ? (
                  <b>HOST</b>
                ) : null}
              </article>
            ))}
          </div>
        ) : tab === "rules" ? (
          <div className="watch-party-rules">
            <img src="/assets/mochi/watch-party-rules.jpg" alt="Nội quy cộng đồng Watch Party" />
          </div>
        ) : (
          <div className="watch-party-settings">
            <div>
              <span>
                <strong>Quyền tham gia</strong>
                <small>{room?.join_locked ? "Phòng đang khóa" : "Phòng đang mở"}</small>
              </span>
              {room?.is_host ? (
                <button type="button" disabled={busy} onClick={() => void setLocked()}>
                  {room.join_locked ? <Unlock /> : <Lock />}
                  {room.join_locked ? "Mở khóa" : "Khóa phòng"}
                </button>
              ) : (
                <b>{room?.join_locked ? "Đã khóa" : "Đang mở"}</b>
              )}
            </div>
            {(room?.is_host || room?.is_admin) && (
              <button
                type="button"
                className="watch-party-close"
                disabled={busy}
                onClick={() => void closeRoom()}
              >
                <X />
                {room.is_admin && !room.is_host ? "Admin đóng phòng" : "Đóng phòng"}
              </button>
            )}
          </div>
        )}
      </aside>

      {qrOpen && (
        <div className="watch-party-qr-backdrop" onClick={() => setQrOpen(false)}>
          <div
            className="watch-party-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="watch-party-qr-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="watch-party-qr-close"
              onClick={() => setQrOpen(false)}
              aria-label="Đóng mã QR"
            >
              <X />
            </button>
            <strong id="watch-party-qr-title">Quét QR để tham gia phòng</strong>
            <img src={qrUrl} alt={`QR tham gia phòng ${partyCode}`} />
            <span>{partyCode}</span>
            {room?.is_host && (
              <form
                className="watch-party-qr-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (busy) return;
                  setBusy(true);
                  try {
                    await request({
                      action: "set-password",
                      partyId: room.id,
                      password: roomPassword,
                    });
                    setRoomPassword("");
                    onShowToast("Đã cập nhật mật khẩu phòng");
                  } catch (cause) {
                    onShowToast(cause instanceof Error ? cause.message : "Không lưu được mật khẩu");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="watch-party-qr-label">
                  <span>Mật khẩu phòng</span>
                  <input
                    type="password"
                    className="watch-party-qr-input"
                    placeholder="Nhập mật khẩu (để trống để gỡ)..."
                    autoComplete="new-password"
                    maxLength={72}
                    value={roomPassword}
                    onChange={(event) => setRoomPassword(event.target.value)}
                  />
                </label>
                <small className="watch-party-qr-hint">
                  Để trống để bỏ mật khẩu. Không kèm mật khẩu trong QR.
                </small>
                <button type="submit" className="watch-party-qr-submit" disabled={busy}>
                  {busy ? "Đang lưu..." : "Lưu mật khẩu"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
