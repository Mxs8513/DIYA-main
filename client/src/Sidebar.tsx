import { useState } from "react";
import { useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
} as const;

export type SidebarActiveId = "profile" | "groups" | "request" | "selfcheck";

function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckDocIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar({ activeId }: { activeId: SidebarActiveId }) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const navItems = [
    { id: "profile" as SidebarActiveId, label: "Profile", icon: <ProfileIcon /> },
    { id: "groups" as SidebarActiveId, label: "Groups", icon: <GroupsIcon /> },
    { id: "request" as SidebarActiveId, label: "Office Hours", icon: <CalendarIcon /> },
    { id: "selfcheck" as SidebarActiveId, label: "Self-Check", icon: <CheckDocIcon /> },
  ];

  const handleNav = (id: SidebarActiveId) => {
    if (id === "groups") { navigate("/groups"); return; }
    if (id === "request") { navigate("/office-hours"); return; }
    if (id === "selfcheck") { navigate("/self-check"); return; }
    alert("Profile (not wired yet)");
  };

  return (
    <aside
      style={{
        width: 220,
        background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)",
        padding: "0 10px 16px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "18px 8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 10px rgba(162,34,55,0.45)",
          }}
        >
          <img src="/logo.png" alt="logo" style={{ height: 22, objectFit: "contain" }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: "Italiana, serif",
              fontSize: 22,
              letterSpacing: 2.5,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            D.I.Y.A
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginTop: 3,
            }}
          >
            Student Portal
          </div>
        </div>
      </div>

      {/* Section label */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(255,255,255,0.28)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          padding: "0 8px",
          marginBottom: 8,
        }}
      >
        Menu
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const isActive = item.id === activeId;
          const isHovered = hoveredId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.1)"
                  : isHovered
                  ? "rgba(255,255,255,0.05)"
                  : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 130ms ease",
                position: "relative",
                outline: "none",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 20,
                    borderRadius: "0 4px 4px 0",
                    backgroundColor: palette.crimson,
                  }}
                />
              )}
              <span style={{ opacity: isActive ? 1 : 0.65, display: "flex" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* User + sign out */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
        <div
          style={{
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "linear-gradient(135deg, rgba(162,34,55,0.7) 0%, rgba(92,30,38,0.7) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            S
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap" }}>
              Student
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.38)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              student@university.edu
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => alert("Signed out (auth not wired yet)")}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            outline: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
