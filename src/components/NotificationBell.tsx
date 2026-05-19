"use client";

import { useState, useEffect, use } from "react";
import {
  Badge,
  Button,
  Empty,
  List,
  message,
  Popover,
  Spin,
  Typography,
} from "antd";
import {
  BellOutlined,
  CloseOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import {
  getUnreadNotifications,
  markNotificationAsRead,
} from "@/lib/notification";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import {
  getPendingInvitationCount,
  getMyInvitations,
  respondToInvitation,
} from "@/actions/invitation";

type InvitationItem = Awaited<ReturnType<typeof getMyInvitations>>[number];

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  taskId?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  actor?: {
    name?: string;
  };
}

export default function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await Promise.all(
        notifications.map((notification) =>
          markNotificationAsRead(notification.id),
        ),
      );
      setNotifications([]);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getUnreadNotifications(userId);
        setNotifications(data as Notification[]);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadNotifications();

    // Listen for real-time notification events
    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId: recipientId, notification } = customEvent.detail;

      // Only add if this notification is for the current user
      if (recipientId === userId) {
        const newNotif: Notification = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: false,
          createdAt: new Date(),
          taskId: notification.taskId,
          projectId: notification.projectId,
        };

        setNotifications((prev) => [newNotif, ...prev]);
      }
    };

    window.addEventListener("notification:created", handleNewNotification);

    return () => {
      window.removeEventListener("notification:created", handleNewNotification);
    };
  }, [userId]);

  useEffect(() => {
    const loadInvitationCount = async () => {
      try {
        const count = await getPendingInvitationCount();
        setPendingInvitations(count);
      } catch (err) {
        console.error("Error fetching invitation count:", err);
      }
    };

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

    const loadInvitations = async () => {
      try {
        const data = await getMyInvitations();
        setInvitations(data);
      } catch (error) {
        console.error("Error loading invitations:", error);
      }
    };
    void loadInvitations();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingInvitations, router, userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleRespond = async (
    invitationId: string,
    decision: "accept" | "decline",
  ) => {
    const res = await respondToInvitation(invitationId, decision);
    if (!res.success) {
      message.error(res.error || t.notifications.generalError);
      return;
    }

    message.success(
      decision === "accept" ? t.notifications.accept : t.notifications.decline,
    );
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  };

  const unreadCount =
    notifications.filter((n) => !n.read).length + pendingInvitations;

  const popoverContent = (
    <div style={{ width: 360 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          Notifications
        </Typography.Title>
        <div className="flex items-center gap-2">
          {/* btn read all */}
          {notifications.length > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleMarkAllAsRead}
              loading={loading}
            >
              {t.notifications.readAll}
            </Button>
          )}
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setIsOpen(false)}
            size="small"
          />
        </div>
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "8px 0" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No new notifications"
            />
          </div>
        ) : (
          <List
            dataSource={notifications}
            split
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{
                  padding: "12px 8px",
                  background: notification.read ? "transparent" : "#eaf3ff",
                  borderRadius: 8,
                }}
                actions={
                  notification.taskId && notification.projectId
                    ? [
                        <Link
                          key="view-task"
                          href={`/projects/${notification.projectId}?task=${notification.taskId}`}
                          onClick={() => {
                            void handleMarkAsRead(notification.id);
                            setIsOpen(false);
                          }}
                        >
                          <Button
                            type="link"
                            size="small"
                            icon={<ArrowRightOutlined />}
                          >
                            View
                          </Button>
                        </Link>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  title={
                    <Typography.Text strong>
                      {notification.title}
                    </Typography.Text>
                  }
                  description={
                    <>
                      <Typography.Text type="secondary">
                        {notification.message}
                      </Typography.Text>
                      <br />
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {new Date(notification.createdAt).toLocaleTimeString(
                          "th-TH",
                        )}
                      </Typography.Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
        <div
          style={{
            borderTop: "1px #d0d0d0 dashed",
            marginBottom: 12,
          }}
        ></div>
        {invitations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              Pending Invitations
            </Typography.Title>
            <List
              dataSource={invitations}
              split
              renderItem={(invitation) => (
                <List.Item
                  key={invitation.id}
                  style={{
                    padding: "12px 8px",
                    background: "#fffbe6",
                    borderRadius: 8,
                  }}
                  actions={[
                    <Button
                      key="accept"
                      type="link"
                      onClick={() => handleRespond(invitation.id, "accept")}
                    >
                      {t.notifications.accept}
                    </Button>,
                    <Button
                      key="decline"
                      type="link"
                      onClick={() => handleRespond(invitation.id, "decline")}
                    >
                      {t.notifications.decline}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Typography.Text
                        strong
                        className="text-nowrap overflow-hidden text-ellipsis"
                      >
                        {invitation.team?.name}
                      </Typography.Text>
                    }
                    description={
                      <div className="text-nowrap overflow-hidden text-ellipsis min-w-47.5">
                        <Typography.Text type="secondary">
                          {invitation?.inviter?.username}{" "}
                          {t.notifications.inviteFrom} {invitation?.team?.name}
                        </Typography.Text>
                        <br />
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {new Date(invitation.createdAt).toLocaleTimeString(
                            "th-TH",
                          )}
                        </Typography.Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      placement="bottomRight"
      open={isOpen}
      onOpenChange={setIsOpen}
      style={{ paddingTop: 8 }}
    >
      <Badge count={unreadCount > 99 ? "99+" : unreadCount} size="small">
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined />}
          title="Notifications"
        />
      </Badge>
    </Popover>
  );
}
