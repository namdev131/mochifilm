export const VIP_PLANS = [
  { id: "monthly", name: "1 tháng", days: 30, price: 39000 },
  { id: "quarterly", name: "3 tháng", days: 90, price: 99000, badge: "Tiết kiệm 18%" },
  { id: "yearly", name: "12 tháng", days: 365, price: 299000, badge: "Tốt nhất" },
] as const;

export type VipPlanId = (typeof VIP_PLANS)[number]["id"];
export type VipPlanPrice = { plan_id: VipPlanId; original_price: number; price: number };
export const VIP_PLAN_BY_ID = Object.fromEntries(VIP_PLANS.map((plan) => [plan.id, plan])) as Record<
  VipPlanId,
  (typeof VIP_PLANS)[number]
>;
export const formatVipPrice = (price: number) => `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
export const defaultVipPrices = VIP_PLANS.map((plan) => ({ plan_id: plan.id, original_price: plan.price, price: plan.price }));
