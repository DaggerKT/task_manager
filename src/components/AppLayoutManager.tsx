"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Layout } from "antd";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { RealtimeClient } from "@/components/RealtimeClient";

export function AppLayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ตรวจสอบว่าเป็นหน้า /login หรือไม่
  const isLoginPage = pathname === "/login";

  // ถาเป็นหน้า /login ไม่ต้องแสดง Sidebar และ Topbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // หน้าอื่นๆ แสดง Sidebar และ Topbar ตามปกติ
  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <RealtimeClient />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <Layout
        style={{
          marginLeft: isSidebarCollapsed ? 80 : 256,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          background: "#f5f7fb",
        }}
      >
        <Topbar />
        <Layout.Content style={{ padding: 24, overflow: "auto" }}>
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
