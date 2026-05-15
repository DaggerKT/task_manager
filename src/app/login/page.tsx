"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, fetchUserInfo } from "@/apis/auth";
import { syncUserToDatabase } from "@/actions/auth";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Spin,
  Typography,
} from "antd";

type LoginFormValues = {
  username: string;
  password: string;
};

function LoginForm() {
  const [form] = Form.useForm<LoginFormValues>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setError("");

    try {
      const data = await login({
        username: values.username,
        password: values.password,
      });

      if (data.status && data.accessToken) {
        const userInfoRes = await fetchUserInfo(data.accessToken);

        if (!userInfoRes?.status || !userInfoRes?.empData) {
          setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
          return;
        }

        if (userInfoRes.status && userInfoRes.empData) {
          const syncRes = await syncUserToDatabase(userInfoRes.empData);
          if (syncRes.status !== "success") {
            setError("ไม่สามารถเตรียมข้อมูลผู้ใช้สำหรับเข้าใช้งานได้");
            return;
          }
        }

        localStorage.setItem("accessToken", data.accessToken);
        const nextPath = searchParams.get("next");
        const redirectPath =
          nextPath && nextPath.startsWith("/") ? nextPath : "/";
        router.push(redirectPath);
      } else {
        setError(data.message || "ล็อคอินไม่สำเร็จ กรุณาตรวจสอบข้อมูล");
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const user = await fetchUserInfo(token);
        if (user?.status && user?.empData) {
          router.push("/");
        } else {
          localStorage.removeItem("accessToken");
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: 16,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Typography.Title level={2} style={{ marginBottom: 4 }}>
              Project Task Management
            </Typography.Title>
            <Typography.Text type="secondary">
              ยินดีต้อนรับเข้าสู่ระบบจัดการงาน
            </Typography.Text>
          </div>

          {error && <Alert type="error" showIcon message={error} />}

          <Form<LoginFormValues>
            form={form}
            name="login"
            layout="vertical"
            onFinish={handleLogin}
            requiredMark={false}
          >
            <Form.Item
              label="ชื่อผู้ใช้ (Username)"
              name="username"
              className="mb-3!"
              rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้" }]}
            >
              <Input placeholder="Username" autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="รหัสผ่าน (Password)"
              name="password"
              rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
            >
              <Input.Password
                placeholder="รหัสผ่านของคุณ"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f7fb",
          }}
        >
          <Space align="center">
            <Spin size="small" />
            <Typography.Text type="secondary">กำลังโหลด...</Typography.Text>
          </Space>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
