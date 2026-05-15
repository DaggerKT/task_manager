"use client";

import { useEffect, useState } from "react";
import { BellOutlined, LeftOutlined, LogoutOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Layout,
  Skeleton,
  Space,
  Typography,
} from "antd";
import { fetchUserInfo } from "@/apis/auth";
import { getPendingInvitationCount } from "@/actions/invitation";
import { getCurrentUserAvatar } from "@/actions/user";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentUser } from "@/contexts/UserContext";
import NotificationBell from "@/components/NotificationBell";
import type { UserInfo } from "@/types/employee";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";

export function Topbar() {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentUserId } = useCurrentUser();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState(0);

  useEffect(() => {
    const loadUserInfo = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetchUserInfo(token);
        if (res && res.empData) {
          const apiUser = res.empData;
          let resolvedEmpImg = apiUser.empImg;

          if (!resolvedEmpImg) {
            const dbAvatar = await getCurrentUserAvatar();
            if (dbAvatar) {
              resolvedEmpImg = dbAvatar;
            }
          }

          setUser({
            ...apiUser,
            empImg: resolvedEmpImg || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    const loadInvitationCount = async () => {
      try {
        const count = await getPendingInvitationCount();
        setPendingInvitations(count);
      } catch (err) {
        console.error("Error fetching invitation count:", err);
      }
    };

    void loadUserInfo();
    void loadInvitationCount();

    const intervalId = window.setInterval(() => {
      void loadInvitationCount();
    }, 8000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadInvitationCount();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  const pathname = usePathname();

  const hiddenBackButton = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length <= 1;
  };

  return (
    <Layout.Header
      style={{
        height: 64,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="flex items-center">
        {!hiddenBackButton() && (
          <Button
            type="text"
            shape="circle"
            icon={<LeftOutlined />}
            onClick={() => router.back()}
            style={{ marginRight: 4, marginTop: 4 }}
          />
        )}
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t.topbar.title}
        </Typography.Title>
      </div>

      <Space size="middle">
        {currentUserId && <NotificationBell userId={currentUserId} />}

        {/* <Badge count={pendingInvitations > 99 ? "99+" : pendingInvitations}>
          <Button
            type="text"
            shape="circle"
            icon={<BellOutlined />}
            onClick={() => router.push("/notifications")}
            title={t.topbar.notifications}
          />
        </Badge> */}

        {user ? (
          <Space size={10}>
            <Avatar
              style={{ backgroundColor: "#e0ecff", color: "#1d4ed8" }}
              src={user.empImg || undefined}
            >
              {user.empName.charAt(0)}
            </Avatar>

            <div style={{ lineHeight: 1.2 }}>
              <Typography.Text strong>{user.empName}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {user.empPositionName}
              </Typography.Text>
            </div>
          </Space>
        ) : (
          <Space size={10}>
            <Skeleton.Avatar active size="small" />
            <Skeleton.Input active size="small" style={{ width: 120 }} />
          </Space>
        )}

        <Button
          type="text"
          onClick={handleLogout}
          icon={<LogoutOutlined />}
          title={t.topbar.logout}
          danger
        />
      </Space>
    </Layout.Header>
  );
}
