"use client";

import { useState, useEffect } from "react";
import { Save, Bell, Globe, CheckCircle } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Divider,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { getUserSettings, updateUserSettings } from "@/actions/user";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Locale } from "@/lib/i18n";

const version = process.env.VERSION || "1.0.0";

export default function SettingsPage() {
  const { locale, t, setLocale } = useLanguage();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateUserSettings({
        locale: selectedLocale,
        emailNotif,
        pushNotif,
      });

      if (!result.success) {
        console.error(result.error || "Failed to save settings");
        return;
      }

      setLocale(selectedLocale);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await getUserSettings();
        if (result.success && result.data) {
          setEmailNotif(result.data.emailNotifications);
          setPushNotif(result.data.pushNotifications);
          if (result.data.locale) {
            setSelectedLocale(result.data.locale);
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };

    void loadSettings();
  }, []);

  return (
    <Space
      orientation="vertical"
      size={20}
      style={{
        width: "100%",
        margin: "0 auto",
        paddingBottom: 24,
      }}
    >
      <Space orientation="vertical" size={2}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t.settings.title}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t.settings.subtitle}
        </Typography.Text>
      </Space>

      <Card>
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <Space align="center" size={8}>
            <Bell size={18} color="#2563eb" />
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t.settings.notifications.title}
            </Typography.Title>
          </Space>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <Typography.Text strong>
                {t.settings.notifications.email}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.settings.notifications.emailDesc}
              </Typography.Text>
            </div>
            <Switch checked={emailNotif} onChange={setEmailNotif} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <Typography.Text strong>
                {t.settings.notifications.push}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.settings.notifications.pushDesc}
              </Typography.Text>
            </div>
            <Switch checked={pushNotif} onChange={setPushNotif} />
          </div>

          <Divider style={{ margin: "4px 0" }} />

          <Space align="center" size={8}>
            <Globe size={18} color="#2563eb" />
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t.settings.preferences.title}
            </Typography.Title>
          </Space>

          <Space orientation="vertical" size={6} style={{ width: "100%" }}>
            <Typography.Text>{t.settings.preferences.language}</Typography.Text>
            <Select
              value={selectedLocale}
              onChange={(value) => setSelectedLocale(value as Locale)}
              style={{ width: "100%", maxWidth: 320 }}
              options={[
                { value: "th", label: t.settings.preferences.languageTh },
                { value: "en", label: t.settings.preferences.languageEn },
              ]}
            />
          </Space>
        </Space>
      </Card>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        {saved && (
          <Alert
            showIcon
            type="success"
            title={t.settings.saveSuccess}
            icon={<CheckCircle size={14} />}
            style={{ padding: "6px 10px" }}
          />
        )}
        <Button
          type="primary"
          onClick={handleSave}
          icon={<Save size={16} />}
          loading={isSaving}
        >
          {t.settings.save}
        </Button>
      </div>

      <Typography.Text
        type="secondary"
        style={{
          fontSize: 12,
          textAlign: "right",
          display: "block",
          position: "absolute",
          bottom: 8,
          right: 16,
        }}
      >
        Version {version}
      </Typography.Text>
    </Space>
  );
}
