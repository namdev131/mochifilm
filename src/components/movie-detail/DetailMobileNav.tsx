import React from "react";
import { MobileBottomDock } from "@/components/common/MobileBottomDock";

interface DetailMobileNavProps {
  onShowToast?: (msg: string) => void;
}

export const DetailMobileNav: React.FC<DetailMobileNavProps> = ({ onShowToast }) => {
  return <MobileBottomDock className="mobile-nav" onShowToast={onShowToast} />;
};
