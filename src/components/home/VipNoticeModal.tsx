import React, { useEffect, useState, type FormEvent } from "react";
import { Crown, X, AlertCircle } from "lucide-react";
import { defaultVipPrices, formatVipPrice, VIP_PLANS, type VipPlanPrice } from "@/lib/vip-plans";
import { supabase } from "@/lib/supabase";

interface VipNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VipNoticeModal: React.FC<VipNoticeModalProps> = ({ isOpen, onClose }) => {
  const [prices, setPrices] = useState<VipPlanPrice[]>(defaultVipPrices);
  const [promocode, setPromocode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const redeemPromocode = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Vui lòng đăng nhập để nhập promocode.");
      const response = await fetch("/api/promocode", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: promocode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không áp dụng được promocode.");
      await supabase.auth.refreshSession();
      setPromocode("");
      setMessage(`Đã kích hoạt VIP đến ${new Date(result.vip_expires_at).toLocaleString("vi-VN")}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không áp dụng được promocode.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void supabase
      .from("vip_plan_prices")
      .select("plan_id,original_price,price")
      .then(({ data }) => {
        if (data?.length === 3) setPrices(data as VipPlanPrice[]);
      });
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="vip-dialog-title" className="w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto p-6 rounded-3xl bg-[#13131b] border border-pink-500/30 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <h3 id="vip-dialog-title" className="text-lg font-black text-white">Gói Dịch Vụ Mochi VIP</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <span className="font-bold block text-amber-300 mb-0.5">Thanh toán thủ công</span>
            VIP hiện do Admin xác nhận và kích hoạt thủ công.
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {VIP_PLANS.map((plan) => (
            <article key={plan.id} className="relative rounded-2xl border border-white/10 bg-white/[.03] p-4">
              {plan.badge && <span className="absolute right-3 top-3 rounded-full bg-pink-500/15 px-2 py-1 text-[9px] font-bold text-pink-300">{plan.badge}</span>}
              <h4 className="font-bold text-white">{plan.name}</h4>
              {(prices.find((price) => price.plan_id === plan.id)?.price ?? plan.price) <
                (prices.find((price) => price.plan_id === plan.id)?.original_price ?? plan.price) && (
                <p className="mt-3 text-xs text-zinc-500 line-through">
                  {formatVipPrice(prices.find((price) => price.plan_id === plan.id)?.original_price ?? plan.price)}
                </p>
              )}
              <p className="mt-3 text-xl font-black text-pink-400">{formatVipPrice(prices.find((price) => price.plan_id === plan.id)?.price ?? plan.price)}</p>
              <p className="mt-2 text-[11px] text-zinc-400">Admin kích hoạt · {plan.days} ngày</p>
            </article>
          ))}
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">Bao gồm trải nghiệm không quảng cáo, nhận diện VIP và ưu tiên tính năng cộng đồng. Trạng thái, gói và ngày hết hạn được lưu phía máy chủ.</p>

        <form onSubmit={redeemPromocode} className="rounded-2xl border border-white/10 bg-white/[.03] p-4 space-y-3">
          <label htmlFor="vip-promocode" className="block text-xs font-bold text-white">Nhập promocode</label>
          <div className="flex gap-2">
            <input
              id="vip-promocode"
              value={promocode}
              onChange={(event) => setPromocode(event.target.value.toUpperCase())}
              minLength={6}
              maxLength={32}
              pattern="[A-Z0-9-]{6,32}"
              autoComplete="off"
              required
              placeholder="MOCHI-XXXXXXXXXXXX"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
            />
            <button type="submit" disabled={busy} className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {busy ? "Đang xử lý..." : "Kích hoạt"}
            </button>
          </div>
          {message && <p role="status" aria-live="polite" className="text-xs text-pink-200">{message}</p>}
        </form>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition cursor-pointer"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};
