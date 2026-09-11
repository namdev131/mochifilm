import React from "react";
import { MobileBottomDock } from "@/components/common/MobileBottomDock";

interface PlayerMobileNavProps {
  onShowToast: (msg: string) => void;
}

export const PlayerMobileNav: React.FC<PlayerMobileNavProps> = ({ onShowToast }) => {
  const handlePartyClick = () => {
    const el = document.getElementById("joinPartyBtn") || document.getElementById("partyBtn");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      onShowToast("Tính năng Watch Party đang hoàn thiện");
    }
  };

  return <MobileBottomDock className="mobile-nav" onShowToast={onShowToast} onPartyClick={handlePartyClick} />;
};
