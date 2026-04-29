import "./globals.css";
import { AppLayoutManager } from "@/components/AppLayoutManager";

export const metadata = {
  title: "Task Manager",
  description: "Task Manager Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AppLayoutManager>{children}</AppLayoutManager>
      </body>
    </html>
  );
}
