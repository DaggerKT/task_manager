"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { RealtimeClient } from "@/components/RealtimeClient";

export function AppLayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // ตรวจสอบว่าเป็นหน้า /login หรือไม่
  const isLoginPage = pathname === "/login";

  // ถาเป็นหน้า /login ไม่ต้องแสดง Sidebar และ Topbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // หน้าอื่นๆ แสดง Sidebar และ Topbar ตามปกติ
  return (
    <div className="flex min-h-screen bg-gray-50">
      <RealtimeClient />
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}