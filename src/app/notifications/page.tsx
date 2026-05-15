"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, Bell } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  List,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { getMyInvitations, respondToInvitation } from "@/actions/invitation";
import {
  getUnreadNotifications,
  markNotificationAsRead,
} from "@/lib/notification";
import { useCurrentUser } from "@/contexts/UserContext";
import Link from "next/link";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";

type InvitationItem = Awaited<ReturnType<typeof getMyInvitations>>[number];
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
  taskId?: string | null;
  projectId?: string | null;
}

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { currentUserId } = useCurrentUser();
  const [messageApi, contextHolder] = message.useMessage();
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!currentUserId) {
      setInvitations([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [invitationData, notificationData] = await Promise.all([
        getMyInvitations(),
        getUnreadNotifications(currentUserId),
      ]);
      setInvitations(invitationData);
      setNotifications(notificationData as NotificationItem[]);
    } catch (err) {
      console.error(err);
      setError(t.notifications.loadError);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, t.notifications.loadError]);

  useEffect(() => {
    void loadData();

    const intervalId = window.setInterval(() => {
      void loadData();
    }, 8000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadData();
      }
    };

    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId: recipientId, notification } = customEvent.detail;

      if (recipientId !== currentUserId) return;

      setNotifications((prev) => [
        {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: false,
          taskId: notification.taskId,
          projectId: notification.projectId,
          createdAt: new Date(),
        },
        ...prev,
      ]);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("notification:created", handleNewNotification);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("notification:created", handleNewNotification);
    };
  }, [currentUserId, loadData]);

  const handleRespond = async (
    invitationId: string,
    decision: "accept" | "decline",
  ) => {
    const res = await respondToInvitation(invitationId, decision);
    if (!res.success) {
      messageApi.error(res.error || t.notifications.generalError);
      return;
    }

    messageApi.success(
      decision === "accept" ? t.notifications.accept : t.notifications.decline,
    );
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
    } catch (err) {
      console.error(err);
      messageApi.error(t.notifications.generalError);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.map((notification) =>
          markNotificationAsRead(notification.id),
        ),
      );
      setNotifications([]);
    } catch (err) {
      console.error(err);
      messageApi.error(t.notifications.generalError);
    }
  };

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      {contextHolder}

      <Space orientation="vertical" size={2}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t.notifications.title}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t.notifications.subtitle}
        </Typography.Text>
      </Space>

      {loading && (
        <Card>
          <Space align="center">
            <Spin size="small" />
            <Typography.Text type="secondary">
              {t.common.loading}
            </Typography.Text>
          </Space>
        </Card>
      )}

      {!loading && error && <Alert type="error" showIcon title={error} />}

      {!loading && !error && (
        <Card
          title={t.notifications.activityTitle}
          extra={
            notifications.length > 0 && (
              <Button type="link" size="small" onClick={handleMarkAllAsRead}>
                {t.notifications.readAll}
              </Button>
            )
          }
        >
          {notifications.length === 0 ? (
            <Empty
              image={<Bell size={36} color="#9ca3af" />}
              description={t.notifications.activityEmpty}
            />
          ) : (
            <List
              dataSource={notifications}
              split
              className="-my-6!"
              renderItem={(notification) => (
                <List.Item
                  key={notification.id}
                  actions={[
                    notification.taskId && notification.projectId ? (
                      <Link
                        key="view-task"
                        href={`/projects/${notification.projectId}?task=${notification.taskId}`}
                        onClick={() => void handleMarkAsRead(notification.id)}
                      >
                        <Button
                          type="link"
                          size="small"
                          icon={<ArrowRightOutlined />}
                        >
                          {t.projects.viewTasks}
                        </Button>
                      </Link>
                    ) : null,
                    <Button
                      key="read"
                      type="text"
                      size="small"
                      onClick={() => void handleMarkAsRead(notification.id)}
                    >
                      {t.common.clear}
                    </Button>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Typography.Text strong>
                        {notification.title}
                      </Typography.Text>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Typography.Text type="secondary">
                          {notification.message}
                        </Typography.Text>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {new Date(notification.createdAt).toLocaleString(
                            "th-TH",
                          )}
                        </Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}

      {!loading && !error && (
        <Card
          title={
            <Space size={8}>
              <span>{t.notifications.invitationsTitle}</span>
              <Badge count={invitations.length} size="small" />
            </Space>
          }
        >
          {invitations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t.notifications.empty}
            />
          ) : (
            <Space orientation="vertical" size={10} style={{ width: "100%" }}>
              {invitations.map((inv) => (
                <Card
                  key={inv.id}
                  size="small"
                  styles={{ body: { padding: 14 } }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <Typography.Text strong>
                        {inv.inviter.name || inv.inviter.username}{" "}
                        {t.notifications.inviteFrom} {inv.team.name}
                      </Typography.Text>
                      <br />
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {t.notifications.project}: {inv.project?.name || "-"}
                      </Typography.Text>
                    </div>

                    <Space>
                      <Button
                        onClick={() => void handleRespond(inv.id, "decline")}
                        icon={<X size={14} />}
                      >
                        {t.notifications.decline}
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => void handleRespond(inv.id, "accept")}
                        icon={<Check size={14} />}
                      >
                        {t.notifications.accept}
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      )}
    </Space>
  );
}
