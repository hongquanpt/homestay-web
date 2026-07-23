import {
 LayoutDashboard,
 BedDouble,
 CalendarCheck,
 CreditCard,
 Package,
 Tag,
 Gift,
 Users,
 ShieldBan,
 ScrollText,
 Settings,
 History,
 Building2,
 Sparkles,
 type LucideIcon,
} from "lucide-react";

export interface NavItem {
 title: string;
 href: string;
 icon: LucideIcon;
 roles?: string[]; // roles allowed; empty = all
 children?: NavItem[];
}

export const adminNavItems: NavItem[] = [
 {
 title: "Dashboard",
 href: "/hms-portal-9f8b2c1a/dashboard",
 icon: LayoutDashboard,
 },
 {
 title: "Cơ sở",
 href: "/hms-portal-9f8b2c1a/facilities",
 icon: Building2,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Quản lý phòng",
 href: "/hms-portal-9f8b2c1a/rooms",
 icon: BedDouble,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Quản lý tiện ích",
 href: "/hms-portal-9f8b2c1a/amenities",
 icon: Sparkles,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Đơn đặt phòng",
 href: "/hms-portal-9f8b2c1a/bookings",
 icon: CalendarCheck,
 roles: ["Super Admin", "Reception", "Accounting"],
 },
 {
 title: "Sản phẩm & Dịch vụ",
 href: "/hms-portal-9f8b2c1a/products",
 icon: Package,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Mã giảm giá",
 href: "/hms-portal-9f8b2c1a/coupons",
 icon: Tag,
 roles: ["Super Admin", "Marketing"],
 },
 {
 title: "Ngày lễ & Phụ thu",
 href: "/hms-portal-9f8b2c1a/surcharges",
 icon: Gift,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Tài khoản",
 href: "/hms-portal-9f8b2c1a/users",
 icon: Users,
 roles: ["Super Admin"],
 },
 {
 title: "Blacklist",
 href: "/hms-portal-9f8b2c1a/blacklist",
 icon: ShieldBan,
 roles: ["Super Admin"],
 },
 {
 title: "Nhật ký",
 href: "/hms-portal-9f8b2c1a/audit-logs",
 icon: ScrollText,
 roles: ["Super Admin"],
 },
 {
 title: "Lịch sử truy cập (IP)",
 href: "/hms-portal-9f8b2c1a/visitor-logs",
 icon: History,
 roles: ["Super Admin"],
 },
 {
 title: "Cài đặt",
 href: "/hms-portal-9f8b2c1a/settings",
 icon: Settings,
 roles: ["Super Admin"],
 },
];
