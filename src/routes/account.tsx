import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, UserRound } from "lucide-react";
import { useAppAuth } from "@/lib/auth-data-provider";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAppAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !user)
      void navigate({ to: "/auth", search: { mode: "login", redirect: "/account" } });
    if (!user) return;
    void supabase
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.user_metadata.full_name || "");
        setAvatarUrl(data?.avatar_url || user.user_metadata.avatar_url || "");
      });
  }, [isLoading, navigate, user]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const name = displayName.trim();
    const avatar = avatarUrl.trim();
    if (!name || name.length > 80) return setMessage("Tên phải có 1–80 ký tự.");
    if (avatar && !/^https?:\/\//i.test(avatar))
      return setMessage("Ảnh đại diện phải là URL http(s).");
    if (!user) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: name,
      avatar_url: avatar || null,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      const authResult = await supabase.auth.updateUser({
        data: { full_name: name, avatar_url: avatar || null },
      });
      if (authResult.error) setMessage(authResult.error.message);
      else {
        const stored = { id: user.id, email: user.email, name, avatarUrl: avatar || undefined };
        localStorage.setItem("mochi_user", JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent("mochi:user-changed", { detail: stored }));
        setMessage("Đã lưu thông tin tài khoản.");
      }
    } else setMessage(error.message);
    setBusy(false);
  };

  if (!user) return null;
  return (
    <main className="min-h-screen bg-[#09090d] px-4 py-8 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#12121a] p-5 shadow-2xl sm:p-8">
        <Link to="/" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-zinc-300">
          <ArrowLeft className="h-4 w-4" />
          Trang chủ
        </Link>
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-pink-500/40 bg-pink-950/30">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-9 w-9 text-pink-300" />
            )}
          </div>
          <div>
            <h1 className="font-brand text-3xl text-pink-300">Tài khoản</h1>
            <p className="text-sm text-zinc-400">Thông tin cá nhân Mochi Film</p>
          </div>
        </div>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">
            Tên hiển thị
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
              required
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none focus:border-pink-500"
            />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              value={user.email || ""}
              readOnly
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-zinc-400"
            />
          </label>
          <label className="block text-sm font-semibold">
            URL ảnh đại diện
            <input
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              maxLength={1000}
              placeholder="https://..."
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none focus:border-pink-500"
            />
          </label>
          <dl className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Ngày tham gia</dt>
              <dd>{new Date(user.created_at).toLocaleDateString("vi-VN")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-400">Xác minh email</dt>
              <dd>{user.email_confirmed_at ? "Đã xác minh" : "Chưa xác minh"}</dd>
            </div>
          </dl>
          {message && (
            <p role="status" className="text-sm text-pink-300">
              {message}
            </p>
          )}
          <button
            disabled={busy}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 font-bold disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {busy ? "Đang lưu..." : "Lưu chỉnh sửa"}
          </button>
        </form>
      </section>
    </main>
  );
}
