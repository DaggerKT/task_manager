"use client";

import { useEffect, useState } from "react";
import { LogOut, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchUserInfo } from "@/apis/auth";
import { getPendingInvitationCount } from "@/actions/invitation";

interface UserInfo {
  empNo: string;
  empName: string;
  empPositionCode: string;
  empPositionName: string;
  empPositionShotName: string;
  empPositionShortName: string;
  empSectCode: string;
  empSectName: string;
  empSectShotName: string;
  empSectShortName: string;
  empDeptCode: string;
  empDeptName: string;
  empDeptShotName: string;
  empDeptShortName: string;
  empLocationCode: string;
  empDivisionCode: string;
  empDivisionName: string;
  empEmail: string;
  empImg: string;
  empUserName: string;
}

export function Topbar() {
  const router = useRouter();
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
          setUser(res.empData);
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

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-800">
          หน้ากระดานโปรเจค
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/notifications")}
          className="relative p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="การแจ้งเตือน"
        >
          <Bell className="w-5 h-5" />
          {pendingInvitations > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {pendingInvitations > 99 ? "99+" : pendingInvitations}
            </span>
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
              {user.empImg ? (
                <img
                  src={user.empImg}
                  alt={user.empName}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.empName.charAt(0)
              )}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-800">
                {user.empName}
              </p>
              <p className="text-xs text-gray-500">{user.empPositionName}</p>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div className="hidden md:block space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="h-2 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          title="ออกจากระบบ"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
