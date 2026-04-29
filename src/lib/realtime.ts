type RealtimeEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

const realtimeServerUrl =
  process.env.REALTIME_SERVER_URL || 'http://localhost:3001';

export async function publishRealtimeEvent(event: RealtimeEvent) {
  try {
    await fetch(`${realtimeServerUrl}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      cache: 'no-store',
    });
  } catch {
    // Realtime must not break core business flows.
  }
}
