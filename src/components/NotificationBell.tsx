"use client";

import { useState, useEffect } from "react";
import { Badge, Button, Empty, List, Popover, Spin, Typography } from "antd";
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
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

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
