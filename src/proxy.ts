import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
 function middleware(req) {
 return NextResponse.next();
 },
 {
 callbacks: {
 authorized: ({ req, token }) => {
 // Cho phép truy cập vào trang login mà không cần token
 if (req.nextUrl.pathname.startsWith("/admin/login")) {
 return true;
 }
 // Các trang khác trong /admin yêu cầu token
 return !!token;
 },
 },
 pages: {
 signIn: "/admin/login",
 },
 }
);

export const config = {
 matcher: ["/admin/:path*"],
};
