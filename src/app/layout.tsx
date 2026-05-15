import "./globals.css";
import "antd/dist/reset.css";
import { ConfigProvider } from "antd";
import { AppLayoutManager } from "@/components/AppLayoutManager";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProvider } from "@/contexts/UserContext";
import { cookies } from "next/headers";

export const metadata = {
  title: "Task Manager",
  description: "Task Manager Application",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("user_id")?.value || null;

  return (
    <html lang="th">
      <body>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#2563eb",
              borderRadius: 10,
            },
          }}
        >
          <UserProvider currentUserId={currentUserId}>
            <LanguageProvider>
              <AppLayoutManager>{children}</AppLayoutManager>
            </LanguageProvider>
          </UserProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
