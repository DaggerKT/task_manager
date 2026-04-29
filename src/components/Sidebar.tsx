import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  FolderGit2,
  Bell,
  Settings,
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
          <CheckSquare className="w-6 h-6" />
          TaskMan
        </h2>
      </div>

      <nav className="flex-1 px-4 space-y-2 text-sm font-medium">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white text-gray-300 transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="flex-1">ภาพรวม (Dashboard)</span>
        </Link>
        <Link
          href="/projects"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white text-gray-300 transition-colors"
        >
          <FolderGit2 className="w-5 h-5" />
          <span className="flex-1">โปรเจคของฉัน</span>
        </Link>
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white text-gray-300 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="flex-1">แจ้งเตือน</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white text-gray-300 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="flex-1">ตั้งค่า</span>
        </Link>
      </div>
    </aside>
  );
}
