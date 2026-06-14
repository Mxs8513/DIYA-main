import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { api, getUser, type Group } from "../../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
} as const;

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke={color} strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ForumIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 7.5A4.5 4.5 0 0 1 10.5 3h3A4.5 4.5 0 0 1 18 7.5v3A4.5 4.5 0 0 1 13.5 15H11l-4.5 3V15A4.5 4.5 0 0 1 6 10.5v-3Z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );
}

export function StudentGroupsPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    api.groups.list()
      .then(setGroups)
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setJoinError("");
    try {
      const { group } = await api.groups.join(code);
      setGroups(prev => [...prev, group]);
      setJoinCode("");
    } catch (err: any) {
      setJoinError(err.message || "Invalid code");
    } finally {
      setJoining(false);
    }
  }

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const totalCount = groups.length;
  const showingCount = filteredGroups.length;
  const showingLabel =
    query.trim().length > 0 && showingCount !== totalCount
      ? `Showing ${showingCount} of ${totalCount} groups`
      : `You're a member of ${totalCount} group${totalCount === 1 ? "" : "s"}`;

  const totalMembers = groups.reduce((s, g) => s + (g.member_count ?? 0), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <Sidebar activeId="groups" />

      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero Section */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "56px 64px 52px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            Student Portal
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            My Groups
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 52,
            }}
          >
            Welcome back! Browse and access your enrolled course groups.
          </div>

          {user && <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(255,255,255,0.75)", marginBottom: 32 }}>Welcome back, {user.name.split(' ')[0]}!</div>}
          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Groups Enrolled", value: totalCount, color: "#fff" },
              { label: "Classmates", value: totalMembers, color: "rgba(255,255,255,0.9)" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: i < 2 ? 40 : 0,
                  marginRight: i < 2 ? 40 : 0,
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: -1.5,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "48px 64px 56px" }}>
          {/* Search bar */}
          <div
            style={{
              width: "min(560px, 100%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              borderRadius: 14,
              border: "1px solid rgba(39,1,21,0.15)",
              backgroundColor: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              marginBottom: 20,
            }}
          >
            <SearchIcon color={palette.deepBurgundy} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search your groups by name..."
              aria-label="Search groups by name"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                color: palette.deepBurgundy,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
          </div>

          {/* Join group */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Enter invite code (e.g. CHEM01)"
              maxLength={8}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(39,1,21,0.15)", fontSize: 14, fontFamily: "inherit", outline: "none", width: 220, color: palette.darkest, fontWeight: 600, letterSpacing: 1 }}
            />
            <button onClick={handleJoin} disabled={joining || !joinCode.trim()} style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`, color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: joining || !joinCode.trim() ? 0.6 : 1 }}>
              {joining ? "Joining…" : "Join Group"}
            </button>
            {joinError && <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{joinError}</span>}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.55)", marginBottom: 24 }}>
            {loading ? "Loading your groups…" : showingLabel}
          </div>

          {/* Group cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
              alignItems: "stretch",
            }}
          >
            {filteredGroups.map((g) => {
              const isHovered = hoveredId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(`/groups/${g.id}/forum`)}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    textAlign: "left",
                    backgroundColor: "#fff",
                    border: isHovered ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)",
                    borderRadius: 20,
                    padding: "22px 24px",
                    cursor: "pointer",
                    boxShadow: isHovered
                      ? "0 12px 36px rgba(0,0,0,0.16)"
                      : "0 2px 24px rgba(0,0,0,0.06)",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0px)",
                    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      backgroundColor: palette.crimson,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: -0.2,
                      color: palette.darkest,
                      lineHeight: 1.3,
                      marginBottom: 16,
                    }}
                  >
                    {g.name}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: palette.deepBurgundy,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(122,155,118,0.12)",
                      }}
                    >
                      <UsersIcon color={palette.sage} />
                      <span>{g.member_count} members</span>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(92,30,38,0.08)",
                      }}
                    >
                      <ForumIcon color={palette.deepBurgundy} />
                      <span>{g.professor_name}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: palette.crimson }}>
                      View group
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              );
            })}

            {filteredGroups.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: "40px 32px",
                  textAlign: "center",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                  color: "rgba(92,30,38,0.5)",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                No groups match your search.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
