"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { adminNavItems } from "@/config/admin-nav";
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
  BedDouble,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminLayoutClient({
  children,
  session
}: {
  children: React.ReactNode;
  session: any;
}) {
  const pathname = usePathname();
  const userRole = session?.user?.role || "";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = adminNavItems.filter(
    (item) => !item.roles || item.roles.length === 0 || item.roles.includes(userRole)
  );

  return (
    <div className="flex h-screen bg-zinc-50 ">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-200 ">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center">
            <BedDouble className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 ">Homestay</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-zinc-500 hover:text-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-primary/10 to-primary/10 text-primary border border-primary/20/50 "
                      : "text-zinc-600 hover:bg-zinc-100 :bg-zinc-800 hover:text-zinc-900 :text-white"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "text-primary ")} />
                  <span>{item.title}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User profile */}
        <div className="border-t border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center text-xs font-bold text-white">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-xs text-zinc-500 truncate">{userRole}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-red-500"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-500 hover:text-zinc-900 :text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {userRole}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
