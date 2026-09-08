import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Copy,
  Lock,
  MessageCircle,
  RefreshCw,
  Send,
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
};

type Member = {
  user_id: string;
  display_name: string;
  joined_at: string;
};

type Message = {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
  staff_role?: "admin" | "deputy_admin" | "member";
};

export function WatchPartyRoomPanel({
  partyCode,
  onShowToast,
  onClosed,
}: {
  partyCode: string;
  onShowToast: (message: string) => void;
  onClosed: () => void;
}) {
  const [tab, setTab] = useState<"chat" | "members" | "rules" | "settings">("chat");
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

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

  const load = useCallback(async () => {
    try {
      const listed = await request({ action: "list" });
      const current = listed.parties?.find((party: Room) => party.code === partyCode) as
        Room | undefined;
      if (!current) throw new Error("Phòng không còn hoạt động");
      const [memberResult, chatResult] = await Promise.all([
        request({ action: "members-list", partyId: current.id }),
        request({ action: "chat-list", partyId: current.id }),
      ]);
      setRoom(current);
      setMembers(memberResult.members || []);
      setMessages(chatResult.messages || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải phòng");
    }
  }, [partyCode, request]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!room?.is_host) return;
    const heartbeat = () => void request({ action: "host-heartbeat", partyId: room.id });
    heartbeat();
    const timer = window.setInterval(heartbeat, 30_000);
    return () => window.clearInterval(timer);
  }, [request, room?.id, room?.is_host]);

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

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onShowToast("Đã sao chép liên kết mời");
    } catch {
      onShowToast(`Mã phòng: ${partyCode}`);
    }
  };

  return (
    <aside
      className="rightbar watch-party-room-panel"
      aria-label={`Phòng Watch Party ${partyCode}`}
    >
      <header className="watch-party-room-head">
        <div>
          <span>Watch Party</span>
          <strong>{partyCode}</strong>
        </div>
        <button type="button" onClick={() => void copyInvite()} aria-label="Sao chép liên kết mời">
          <Copy />
        </button>
      </header>

      <div className="watch-party-qr">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.href)}`}
          alt="QR tham gia Watch Party"
        />
        <span>Quét QR để tham gia phòng</span>
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
              <article key={message.id} className={message.user_id === userId ? "mine" : ""}>
                <span className="watch-party-avatar">
                  <UserRound />
                </span>
                <div>
                  <header>
                    <strong>{message.display_name}</strong>
                    {message.staff_role !== "member" && (
                      <b>{message.staff_role === "admin" ? "ADMIN" : "PHÓ ADMIN"}</b>
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
            <article key={member.user_id}>
              <span className="watch-party-avatar">
                <UserRound />
              </span>
              <div>
                <strong>{member.display_name}</strong>
                <small>{member.user_id === room?.host_id ? "Chủ phòng" : "Đang xem"}</small>
              </div>
              {member.user_id === room?.host_id && <b>HOST</b>}
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
          {room?.is_host && (
            <button
              type="button"
              className="watch-party-close"
              disabled={busy}
              onClick={() => void closeRoom()}
            >
              <X />
              Đóng phòng
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
