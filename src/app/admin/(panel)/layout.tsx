import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — PERF'EXHAUST", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured() || !(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
