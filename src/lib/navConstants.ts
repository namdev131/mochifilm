import {
  Swords,
  Heart,
  Smile,
  Landmark,
  Brain,
  Ghost,
  Rocket,
  Compass,
  Shield,
  Search,
  Gamepad2,
  Home,
  Sparkles,
  Flag,
  type LucideIcon,
} from "lucide-react";

export interface NavGenreItem {
  name: string;
  icon: LucideIcon;
}

export interface NavCountryItem {
  code: string;
  name: string;
}

export const NAVBAR_GENRES: NavGenreItem[] = [
  { name: "Hành Động", icon: Swords },
  { name: "Tình Cảm", icon: Heart },
  { name: "Hài Hước", icon: Smile },
  { name: "Cổ Trang", icon: Landmark },
  { name: "Tâm Lý", icon: Brain },
  { name: "Kinh Dị", icon: Ghost },
  { name: "Viễn Tưởng", icon: Rocket },
  { name: "Phiêu Lưu", icon: Compass },
  { name: "Chiến Tranh", icon: Shield },
  { name: "Hình Sự", icon: Search },
  { name: "Hoạt Hình", icon: Gamepad2 },
  { name: "Gia Đình", icon: Home },
  { name: "Anime", icon: Sparkles },
  { name: "Mỹ Nam", icon: Heart },
  { name: "Việt Nam", icon: Flag },
];

export const NAVBAR_COUNTRIES: NavCountryItem[] = [
  { code: "VN", name: "Việt Nam" },
  { code: "KR", name: "Hàn Quốc" },
  { code: "CN", name: "Trung Quốc" },
  { code: "JP", name: "Nhật Bản" },
  { code: "US", name: "Âu Mỹ" },
  { code: "TH", name: "Thái Lan" },
  { code: "HK", name: "Hồng Kông" },
  { code: "TW", name: "Đài Loan" },
  { code: "IN", name: "Ấn Độ" },
  { code: "GB", name: "Anh" },
];
