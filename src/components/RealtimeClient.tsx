"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

export function RealtimeClient() {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = setTimeout(() => {
        router.refresh();
      }, 300);
    };

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = () => {
        if (document.visibilityState === "visible") {
          scheduleRefresh();
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connect, 1500);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [router]);

  return null;
}
