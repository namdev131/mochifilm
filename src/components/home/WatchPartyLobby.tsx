import { useEffect, useState } from "react";
import { KeyRound, Lock, LogIn, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Party {
  id: string;
  code: string;
  slug: string;
  source: string;
  name: string;
  poster?: string;
  ep_index: number;
  srv_index: number;
  join_locked: boolean;
  has_password: boolean;
  is_host: boolean;
  is_member: boolean;
  member_count: number;
  scheduled_at: string;
}

export function WatchPartyLobby({ signedIn }: { signedIn: boolean }) {
  const [parties, setParties] = useState<Party[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const request = async (body: Record<string, unknown>) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) throw new Error("Đăng nhập để xem và tham gia Watch Party");
    const response = await fetch("/api/watch-party", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Watch Party gặp lỗi");
    return result;
  };

  const load = async () => {
    setError("");
    try {
      const result = await request({ action: "list" });
      setParties(result.parties || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải danh sách phòng");
    }
  };

  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn]);

  const enterParty = (party: Party) =>
    window.location.assign(
      `/watch/${encodeURIComponent(party.slug)}?source=${encodeURIComponent(party.source)}&srv=${party.srv_index}&ep=${party.ep_index}&party=${party.code}`,
    );

  const join = async (party: Party) => {
    if (party.join_locked && !party.is_member && !party.is_host) return;
    setBusy(party.id);
    setError("");
    try {
      const result = await request({
        action: "join",
        code: party.code,
        password: passwords[party.id] || undefined,
      });
      enterParty(result.party as Party);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tham gia phòng");
      setBusy("");
    }
  };

  const joinByCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) return setError("Mã phòng phải có 6 ký tự");
    setBusy("code");
    setError("");
    try {
      const result = await request({ action: "join", code, password: joinPassword || undefined });
      if (!result.party) throw new Error("Không tìm thấy phòng đang mở");
      enterParty(result.party as Party);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tham gia phòng");
      setBusy("");
    }
  };

  if (!signedIn)
    return (
      <p className="box-border w-[calc(100vw-2rem)] max-w-full whitespace-normal break-words rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-300 sm:w-auto">
        Đăng nhập để xem các phòng Watch Party đang mở.
      </p>
    );

  return (
    <section className="space-y-5" aria-labelledby="watch-party-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 id="watch-party-title" className="font-brand text-2xl font-bold text-white">
            Watch Party
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Chọn phòng đang mở để xem phim cùng mọi người.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-200"
        >
          <RefreshCw className="mr-2 inline h-4 w-4" /> Làm mới
        </button>
      </div>

      <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-rose-500/5 p-4 shadow-lg shadow-pink-950/20">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <KeyRound className="h-4 w-4 text-pink-400" />
          Nhập mã phòng
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={joinCode}
            onChange={(event) =>
              setJoinCode(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z2-9]/g, "")
                  .slice(0, 6),
              )
            }
            maxLength={6}
            autoComplete="off"
            aria-label="Mã phòng"
            placeholder="MÃ PHÒNG"
            className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 font-mono text-sm font-bold tracking-[0.2em] text-white outline-none focus:border-pink-500"
          />
          <input
            type="password"
            value={joinPassword}
            onChange={(event) => setJoinPassword(event.target.value.slice(0, 72))}
            maxLength={72}
            autoComplete="off"
            aria-label="Mật khẩu phòng"
            placeholder="Mật khẩu nếu có"
            className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-pink-500"
          />
          <button
            type="button"
            disabled={busy === "code" || joinCode.length !== 6}
            onClick={() => void joinByCode()}
            className="min-h-11 rounded-xl bg-pink-600 px-5 text-sm font-bold text-white disabled:opacity-45"
          >
            <LogIn className="mr-2 inline h-4 w-4" />
            {busy === "code" ? "Đang vào..." : "Tham gia"}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"
        >
          {error}
        </p>
      )}
      {!parties.length && !error ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
          Chưa có phòng nào đang mở.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {parties.map((party) => (
            <article
              key={party.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]"
            >
              {party.poster && (
                <img src={party.poster} alt="" className="aspect-video w-full object-cover" />
              )}
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-white">{party.name}</h2>
                    <p className="text-xs text-zinc-400">Phòng {party.code}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-zinc-300">
                    <Users className="h-3.5 w-3.5" />
                    {party.member_count}
                  </span>
                </div>
                {new Date(party.scheduled_at).getTime() > Date.now() && (
                  <p className="text-xs font-semibold text-amber-300">
                    Mở lúc {new Date(party.scheduled_at).toLocaleString("vi-VN")}
                  </p>
                )}
                {party.has_password && !party.is_member && !party.is_host && (
                  <input
                    type="password"
                    minLength={4}
                    maxLength={72}
                    autoComplete="off"
                    aria-label={`Mật khẩu phòng ${party.code}`}
                    placeholder="Mật khẩu phòng"
                    value={passwords[party.id] || ""}
                    onChange={(event) =>
                      setPasswords((current) => ({ ...current, [party.id]: event.target.value }))
                    }
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-pink-500"
                  />
                )}
                <button
                  type="button"
                  disabled={
                    new Date(party.scheduled_at).getTime() > Date.now() ||
                    (party.join_locked && !party.is_member && !party.is_host) ||
                    busy === party.id ||
                    (party.has_password &&
                      !party.is_member &&
                      !party.is_host &&
                      (passwords[party.id]?.length || 0) < 4)
                  }
                  onClick={() => void join(party)}
                  className="min-h-11 w-full rounded-xl bg-pink-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {party.join_locked && !party.is_member && !party.is_host ? (
                    <>
                      <Lock className="mr-2 inline h-4 w-4" />
                      Phòng đã khóa
                    </>
                  ) : busy === party.id ? (
                    "Đang tham gia..."
                  ) : party.is_member || party.is_host ? (
                    "Vào lại phòng"
                  ) : (
                    "Tham gia phòng"
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
