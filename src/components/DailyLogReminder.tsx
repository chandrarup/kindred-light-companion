import { useEffect, useRef, useState } from "react";

/**
 * Daily reminder for the caregiver to log within a configured window.
 *
 * Note on web push: true background push needs VAPID + a dedicated messaging
 * service worker. The brief calls for a daily reminder; this implementation
 * uses the browser Notifications API while the app is open (foreground), and
 * always renders an in-app banner. The window + permission UI gives a clean
 * upgrade path to background web push later.
 */
export function DailyLogReminder({
  windowStart,
  windowEnd,
  alreadyLoggedToday,
}: {
  windowStart: string; // "HH:MM"
  windowEnd: string;   // "HH:MM"
  alreadyLoggedToday: boolean;
}) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const firedKey = useRef<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (alreadyLoggedToday) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const t = setInterval(() => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const day = now.toISOString().slice(0, 10);
      if (hhmm < windowStart || hhmm > windowEnd) return;
      if (firedKey.current === day) return;
      try {
        new Notification("COMPANION", {
          body: "Don't forget to log today's notes.",
          tag: `companion-daily-${day}`,
        });
        firedKey.current = day;
      } catch {}
    }, 60 * 1000);
    return () => clearInterval(t);
  }, [windowStart, windowEnd, alreadyLoggedToday]);

  if (alreadyLoggedToday) return null;

  const inWindow = (() => {
    const hhmm = new Date().toTimeString().slice(0, 5);
    return hhmm >= windowStart && hhmm <= windowEnd;
  })();
  if (!inWindow) return null;

  return (
    <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 my-3 flex flex-wrap items-center gap-2">
      <span className="flex-1">
        Reminder: log today's notes for your loved one.
      </span>
      {permission !== "granted" && typeof Notification !== "undefined" && (
        <button
          type="button"
          onClick={async () => {
            const p = await Notification.requestPermission();
            setPermission(p);
          }}
          className="rounded border px-3 py-2 text-sm min-h-10"
        >
          Enable reminders
        </button>
      )}
    </div>
  );
}