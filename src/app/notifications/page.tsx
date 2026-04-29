"use client";

import { useEffect, useState } from "react";
import { Check, X, Bell } from "lucide-react";
import { getMyInvitations, respondToInvitation } from "@/actions/invitation";

type InvitationItem = {
  id: string;
  createdAt: string;
  team: { name: string };
  project: { name: string } | null;
  inviter: { name: string | null; username: string };
  inviteeEmail: string | null;
  inviteeEmpNo: string | null;
  inviteeUsername: string | null;
};

export default function NotificationsPage() {
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvitations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyInvitations();
      setInvitations(data as InvitationItem[]);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถโหลดการแจ้งเตือนได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvitations();

    const intervalId = window.setInterval(() => {
      void loadInvitations();
    }, 8000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadInvitations();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleRespond = async (
    invitationId: string,
    decision: "accept" | "decline",
  ) => {
    const res = await respondToInvitation(invitationId, decision);
    if (!res.success) {
      alert(res.error || "เกิดข้อผิดพลาด");
      return;
    }
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
        <p className="text-sm text-gray-500 mt-1">
          คำเชิญเข้าร่วมโปรเจกต์ที่รอการตอบรับ
        </p>
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-500">
          กำลังโหลด...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && invitations.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          ยังไม่มีคำเชิญใหม่
        </div>
      )}

      {!loading && !error && invitations.length > 0 && (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="text-sm text-gray-900 font-medium">
                  {inv.inviter.name || inv.inviter.username} เชิญคุณเข้าทีม {inv.team.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  โปรเจกต์: {inv.project?.name || "-"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleRespond(inv.id, "decline")}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  ปฏิเสธ
                </button>
                <button
                  onClick={() => void handleRespond(inv.id, "accept")}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  ยอมรับ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
