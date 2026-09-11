import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase, useAppAuth } from "@/lib/auth-data-provider";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  slug: string | null;
  source: "kkphim" | "ophim" | null;
  poster: string | null;
  kind: "episode" | "admin";
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAppAuth();
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  const load = async () => {
    if (!user) return setItems([]);
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,slug,source,poster,kind,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data || []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    if (!user) return;
    const channel = supabase
      .channel(`notification_bell_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [user?.id]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true } as never).eq("user_id", user.id);
    setItems((rows) => rows.map((row) => ({ ...row, read: true })));
  };

  const select = async (item: Notification) => {
    if (!item.read) {
      await supabase.from("notifications").update({ read: true } as never).eq("id", item.id);
      setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
    }
    setOpen(false);
    if (item.slug)
      void navigate({
        to: "/movie/$slug",
        params: { slug: item.slug },
        search: { source: item.source || "kkphim" },
      });
  };

  const unread = items.filter((item) => !item.read).length;
  return (
    <div ref={root} className="notification-bell-root">
      <button
        type="button"
        className="icon-btn"
        aria-label={unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
      </button>
      {open && (
        <section className="notification-bell-popover" role="dialog" aria-label="Thông báo">
          <header>
            <strong>Thông báo</strong>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()}>
                <CheckCheck size={15} /> Đã đọc tất cả
              </button>
            )}
          </header>
          <div className="notification-bell-list">
            {!user ? (
              <p>Đăng nhập để nhận thông báo phim và thông báo từ Admin.</p>
            ) : loading ? (
              <p>Đang tải thông báo...</p>
            ) : items.length === 0 ? (
              <p>Chưa có thông báo.</p>
            ) : (
              items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`${item.read ? "" : "unread"} ${item.kind === "admin" ? "admin" : ""}`}
                  onClick={() => void select(item)}
                >
                  {item.poster && <img src={item.poster} alt="" />}
                  <span>
                    {item.kind === "admin" && <b className="notification-admin-badge">ADMIN</b>}
                    <strong>{item.title}</strong>
                    {item.body && <small>{item.body}</small>}
                    <time>{new Date(item.created_at).toLocaleString("vi-VN")}</time>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
