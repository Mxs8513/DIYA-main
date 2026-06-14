import { useState } from "react";
import { useNavigate } from "react-router";
import { clearAuth } from "../../lib/api";
import { NotificationBell } from "./NotificationPanel";

const palette = { crimson: "#a22237", deepBurgundy: "#5C1E26" } as const;

export type ProfSidebarActiveId =
  | "calendar" | "analysis" | "requests" | "editgroup"
  | "workflow" | "interventions" | "admin" | "approved" | "knowledge";

const navGroups = [
  {
    label: "Class",
    items: [
      { id: "calendar" as const,   label: "Calendar",   path: (g: string) => `/calendar/${g}`,      icon: CalendarIcon },
      { id: "requests" as const,   label: "Requests",   path: (g: string) => `/requests/${g}`,      icon: RequestsIcon },
      { id: "editgroup" as const,  label: "Edit Group", path: (g: string) => `/edit-group/${g}`,    icon: EditIcon },
    ],
  },
  {
    label: "AI Workflow",
    items: [
      { id: "workflow" as const,      label: "Queue",           path: (g: string) => `/workflow/${g}`,       icon: QueueIcon,       badge: "new" },
      { id: "interventions" as const, label: "Interventions",   path: (g: string) => `/interventions/${g}`,  icon: InterventionIcon },
      { id: "approved" as const,      label: "Answer Library",  path: (g: string) => `/approved/${g}`,       icon: LibraryIcon },
      { id: "knowledge" as const,     label: "Knowledge Base",  path: (g: string) => `/knowledge/${g}`,      icon: KnowledgeIcon },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "analysis" as const, label: "Analytics",     path: (g: string) => `/analysis/${g}`,   icon: AnalysisIcon },
      { id: "admin" as const,    label: "Observability", path: (g: string) => `/admin/${g}`,      icon: AdminIcon },
    ],
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function CalendarIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function AnalysisIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18 9l-5 5-2-2-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function RequestsIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function EditIcon()        { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function QueueIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function InterventionIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function LibraryIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function AdminIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function KnowledgeIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

interface ProfessorSidebarProps {
  activeId: ProfSidebarActiveId;
  groupName: string | undefined;
}

export function ProfessorSidebar({ activeId, groupName }: ProfessorSidebarProps) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = () => {
    clearAuth();
    navigate("/");
  };

  const W = collapsed ? 64 : 248;
  const gn = groupName || '';

  return (
    <aside style={{
      width: W, minWidth: W,
      background: "linear-gradient(180deg, #161622 0%, #1c0a24 40%, #270115 100%)",
      padding: collapsed ? "0 0 16px" : "0 10px 16px",
      boxSizing: "border-box",
      position: "sticky", top: 0, height: "100vh",
      overflowY: "auto", overflowX: "hidden",
      display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
      flexShrink: 0,
      transition: "width 200ms ease, min-width 200ms ease, padding 200ms ease",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 10, padding: collapsed ? "18px 0 14px" : "18px 4px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(162,34,55,0.4)" }}>
            <img src="/logo.png" alt="logo" style={{ height: 18, objectFit: "contain" }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: "Italiana, serif", fontSize: 20, letterSpacing: 2.5, color: "#fff", lineHeight: 1 }}>D.I.Y.A</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 2 }}>Professor</div>
            </div>
          )}
        </div>
        <button type="button" onClick={() => setCollapsed(!collapsed)} style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            {collapsed ? <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </button>
      </div>

      {/* Forum link */}
      <button type="button" onClick={() => navigate(`/forum/${gn}`)} title={collapsed ? "Forum" : undefined} style={{ width: "100%", textAlign: collapsed ? "center" : "left", padding: collapsed ? "9px 0" : "9px 12px", borderRadius: 8, border: "none", backgroundColor: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8, marginBottom: 8, outline: "none" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {!collapsed && "Forum"}
      </button>

      {/* Nav groups */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: 1.5, textTransform: "uppercase", padding: "10px 6px 5px" }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const isActive = item.id === activeId;
              const isHov = hoveredId === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path(gn))}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: "100%", textAlign: collapsed ? "center" : "left", padding: collapsed ? "10px 0" : "9px 12px",
                    borderRadius: 8, border: "none",
                    backgroundColor: isActive ? "rgba(162,34,55,0.25)" : isHov ? "rgba(255,255,255,0.06)" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                    fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 9,
                    transition: "all 120ms ease", position: "relative", outline: "none",
                  }}
                >
                  {isActive && !collapsed && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: "0 3px 3px 0", backgroundColor: palette.crimson }} />}
                  <span style={{ opacity: isActive ? 1 : 0.7, display: "flex", flexShrink: 0 }}><Icon /></span>
                  {!collapsed && (
                    <span style={{ flex: 1 }}>{item.label}</span>
                  )}
                  {!collapsed && (item as any).badge && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: palette.crimson, backgroundColor: "rgba(162,34,55,0.15)", padding: "1px 5px", borderRadius: 4, letterSpacing: 0.5 }}>NEW</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Notifications */}
      <div style={{ marginBottom: 4 }}>
        <NotificationBell collapsed={collapsed} dark />
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
        {groupName && !collapsed && (
          <div style={{ padding: "9px 10px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 8 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>Group</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{decodeURIComponent(groupName)}</div>
          </div>
        )}
        <button type="button" onClick={handleSignOut} title={collapsed ? "Sign out" : undefined} style={{ width: "100%", textAlign: collapsed ? "center" : "left", padding: collapsed ? "9px 0" : "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8, outline: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
