import "./globals.css";
import { AppLayoutManager } from "@/components/AppLayoutManager";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
        <LanguageProvider>
          <AppLayoutManager>{children}</AppLayoutManager>
        </LanguageProvider>
      </body>
    </html>
  );
}
