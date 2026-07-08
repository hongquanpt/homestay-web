import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminLayoutClient } from "./AdminLayoutClient";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutClient session={session}>
      {children}
    </AdminLayoutClient>
  );
}
