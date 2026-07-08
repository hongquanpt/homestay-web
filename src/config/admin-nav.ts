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
 href: "/admin/dashboard",
 icon: LayoutDashboard,
 },
 {
 title: "Cơ sở",
 href: "/admin/facilities",
 icon: Building2,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Quản lý phòng",
 href: "/admin/rooms",
 icon: BedDouble,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Quản lý tiện ích",
 href: "/admin/amenities",
 icon: Sparkles,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Đơn đặt phòng",
 href: "/admin/bookings",
 icon: CalendarCheck,
 roles: ["Super Admin", "Reception", "Accounting"],
 },
 {
 title: "Sản phẩm & Dịch vụ",
 href: "/admin/products",
 icon: Package,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Mã giảm giá",
 href: "/admin/coupons",
 icon: Tag,
 roles: ["Super Admin", "Marketing"],
 },
 {
 title: "Ngày lễ & Phụ thu",
 href: "/admin/surcharges",
 icon: Gift,
 roles: ["Super Admin", "Reception"],
 },
 {
 title: "Tài khoản",
 href: "/admin/users",
 icon: Users,
 roles: ["Super Admin"],
 },
 {
 title: "Blacklist",
 href: "/admin/blacklist",
 icon: ShieldBan,
 roles: ["Super Admin"],
 },
 {
 title: "Nhật ký",
 href: "/admin/audit-logs",
 icon: ScrollText,
 roles: ["Super Admin"],
 },
 {
 title: "Lịch sử truy cập (IP)",
 href: "/admin/visitor-logs",
 icon: History,
 roles: ["Super Admin"],
 },
 {
 title: "Cài đặt",
 href: "/admin/settings",
 icon: Settings,
 roles: ["Super Admin"],
 },
];
