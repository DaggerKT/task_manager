"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button, Layout, Menu, Typography } from "antd";
import {
  LayoutDashboard,
  FolderGit2,
  Bell,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "@/assets/icon/logo.png";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const selectedKey =
    pathname === "/"
      ? "dashboard"
      : pathname.startsWith("/projects")
        ? "projects"
        : pathname.startsWith("/notifications")
          ? "notifications"
          : pathname.startsWith("/settings")
            ? "settings"
            : "";

  return (
    <Layout.Sider
      collapsible
      collapsed={isCollapsed}
      trigger={null}
      width={256}
      collapsedWidth={80}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        background: "#0f172a",
        borderRight: "1px solid #1f2937",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          padding: isCollapsed ? "0 12px" : "0 16px",
        }}
      >
        {!isCollapsed && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={Logo.src}
              alt="Logo"
              style={{ width: 32, height: 32, marginRight: 8 }}
            />
            <Typography.Title level={4} style={{ margin: 0, color: "#60a5fa" }}
              // ค่อยๆแสดงตัวอักษรทีละตัว
              className="sidebar-title"
            >
              {t.sidebar.title}
            </Typography.Title>
          </div>
        )}

        <Button
          type="text"
          onClick={onToggle}
          style={{ color: "#cbd5e1" }}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft
            size={18}
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease-in-out",
            }}
          />
        </Button>
      </div>

      <div style={{ padding: "8px 8px 12px", height: "calc(100% - 64px)" }}>
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={({ key }) => {
            if (key === "dashboard") router.push("/");
            if (key === "projects") router.push("/projects");
            if (key === "notifications") router.push("/notifications");
            if (key === "settings") router.push("/settings");
          }}
          style={{
            height: "100%",
            borderRight: "none",
            background: "transparent",
            color: "#cbd5e1",
          }}
          theme="dark"
          items={[
            {
              key: "dashboard",
              icon: <LayoutDashboard size={16} />,
              label: t.sidebar.dashboard,
            },
            {
              key: "projects",
              icon: <FolderGit2 size={16} />,
              label: t.sidebar.projects,
            },
            {
              key: "notifications",
              icon: <Bell size={16} />,
              label: t.sidebar.notifications,
            },
            {
              type: "divider",
            },
            {
              key: "settings",
              icon: <Settings size={16} />,
              label: t.sidebar.settings,
            },
          ]}
        />
      </div>
    </Layout.Sider>
  );
}
