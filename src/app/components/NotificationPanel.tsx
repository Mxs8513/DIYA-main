import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { api, type AppNotification } from "../../lib/api";

const palette = {
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  darkest: "#270115",
} as const;

const typeConfig: Record<string, { color: string; bg: string; icon: string }> = {
  verified:     { color: palette.sage,        bg: "rgba(122,155,118,0.12)", icon: "✓" },
  rejected:     { color: "#6366f1",            bg: "rgba(99,102,241,0.1)",   icon: "✎" },
  reply:        { color: palette.crimson,      bg: "rgba(162,34,55,0.1)",    icon: "💬" },
  new_question: { color: "#f59e0b",            bg: "rgba(245,158,11,0.1)",   icon: "❓" },
  oh_request:   { color: "#3b82f6",            bg: "rgba(59,130,246,0.1)",   icon: "📅" },
  oh_approved:  { color: palette.sage,         bg: "rgba(122,155,118,0.12)", icon: "✓" },
  oh_rejected:  { color: palette.crimson,      bg: "rgba(162,34,55,0.1)",    icon: "✗" },
  oh_completed: { color: "#6366f1",            bg: "rgba(99,102,241,0.1)",   icon: "★" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: Props) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.notifications.list()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.notifications.readAll().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.read) {
      await api.notifications.read(n.id).catch(() => {});
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: 1 } : x));
    }
    if (n.link) {
      navigate(n.link);
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: 240,
        top: 0,
        bottom: 0,
        width: 360,
        backgroundColor: "#fff",
        boxShadow: "4px 0 32px rgba(0,0,0,0.18)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
        borderRight: "1px solid rgba(214,214,214,0.4)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(214,214,214,0.4)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: palette.darkest, letterSpacing: -0.5 }}>
              Notifications
            </div>
            {unreadCount > 0 && (
              <div style={{ backgroundColor: palette.crimson, color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 7px", borderRadius: 999, lineHeight: 1.4 }}>
                {unreadCount}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{ fontSize: 11, fontWeight: 700, color: palette.deepBurgundy, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, backgroundColor: "rgba(92,30,38,0.06)" }}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(92,30,38,0.45)", fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.45)" }}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(92,30,38,0.4)", fontSize: 13, fontWeight: 600 }}>
            Loading…
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.darkest, marginBottom: 6 }}>No notifications yet</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(92,30,38,0.45)", lineHeight: 1.5 }}>
              You'll be notified when students ask questions, professors reply, or your office hours requests are updated.
            </div>
          </div>
        )}

        {notifications.map((n, i) => {
          const cfg = typeConfig[n.type] ?? { color: palette.deepBurgundy, bg: "rgba(92,30,38,0.06)", icon: "•" };
          const isUnread = !n.read;
          return (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: "flex",
                gap: 12,
                padding: "14px 20px",
                cursor: n.link ? "pointer" : "default",
                backgroundColor: isUnread ? "rgba(162,34,55,0.03)" : "transparent",
                borderBottom: i < notifications.length - 1 ? "1px solid rgba(214,214,214,0.3)" : "none",
                transition: "background-color 100ms",
                position: "relative",
              }}
              onMouseEnter={e => { if (n.link) (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(162,34,55,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isUnread ? "rgba(162,34,55,0.03)" : "transparent"; }}
            >
              {/* Unread dot */}
              {isUnread && (
                <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 6, height: 6, borderRadius: "50%", backgroundColor: palette.crimson }} />
              )}

              {/* Icon */}
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: cfg.bg, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {cfg.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isUnread ? 800 : 600, color: palette.darkest, lineHeight: 1.3, marginBottom: 3 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(92,30,38,0.6)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {n.message}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(92,30,38,0.35)", marginTop: 4 }}>
                  {timeAgo(n.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(214,214,214,0.4)", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.35)", textAlign: "center" }}>
          Showing last 30 notifications
        </div>
      </div>
    </div>
  );
}

// Bell icon + badge — drop into any sidebar
interface BellProps {
  collapsed?: boolean;
  dark?: boolean;
}

export function NotificationBell({ collapsed, dark }: BellProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => api.notifications.list().then(ns => setUnread(ns.filter(n => !n.read).length)).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeColor = dark ? "rgba(255,255,255,0.9)" : palette.crimson;
  const inactiveColor = dark ? "rgba(255,255,255,0.55)" : "rgba(92,30,38,0.55)";
  const activeBg = dark ? "rgba(255,255,255,0.1)" : "rgba(162,34,55,0.1)";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Notifications"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          width: "100%",
          padding: collapsed ? "10px 0" : "9px 12px",
          borderRadius: 10,
          border: "none",
          background: open ? activeBg : "transparent",
          cursor: "pointer",
          color: open ? activeColor : inactiveColor,
          fontSize: 13,
          fontWeight: 600,
          textAlign: "left",
          justifyContent: collapsed ? "center" : "flex-start",
          transition: "background 120ms, color 120ms",
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {unread > 0 && (
            <div style={{ position: "absolute", top: -5, right: -6, backgroundColor: palette.crimson, color: "#fff", fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
              {unread > 9 ? "9+" : unread}
            </div>
          )}
        </div>
        {!collapsed && <span>Notifications</span>}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </>
  );
}
