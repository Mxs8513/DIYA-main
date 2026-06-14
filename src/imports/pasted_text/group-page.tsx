import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { api, getUser, clearAuth, type Group } from "../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ForumIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7.5A4.5 4.5 0 0 1 10.5 3h3A4.5 4.5 0 0 1 18 7.5v3A4.5 4.5 0 0 1 13.5 15H11l-4.5 3V15A4.5 4.5 0 0 1 6 10.5v-3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function GroupPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [sidebarHoveredId, setSidebarHoveredId] = useState<string | null>(null);

  useEffect(() => {
    api.groups.list()
      .then(setGroups)
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? groups.filter(g => g.name.toLowerCase().includes(q)) : groups;
  }, [groups, query]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const g = await api.groups.create(name, newDesc.trim());
      setGroups(prev => [...prev, g]);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    } catch (err: any) {
      alert('Error creating group: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  const totalStudents = groups.reduce((s, g) => s + (g.member_count || 0), 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, -apple-system, sans-serif", display: "flex" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)", padding: "0 10px 16px", boxSizing: "border-box", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)", boxShadow: "4px 0 32px rgba(0,0,0,0.25)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 8px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(162,34,55,0.45)" }}>
            <img src="/logo.png" alt="logo" style={{ height: 22, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Italiana, serif", fontSize: 22, letterSpacing: 2.5, color: "#fff", lineHeight: 1 }}>D.I.Y.A</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 }}>Professor View</div>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Menu</div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[{ id: "groups", label: "My Groups" }].map(item => {
            const isHov = sidebarHoveredId === item.id;
            return (
              <button key={item.id} type="button" onMouseEnter={() => setSidebarHoveredId(item.id)} onMouseLeave={() => setSidebarHoveredId(null)}
                style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: isHov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, outline: "none", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: "0 4px 4px 0", backgroundColor: palette.crimson }} />
                <UsersIcon color="rgba(255,255,255,0.7)" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <div style={{ padding: "10px 12px", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Quick Stats</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>📚 {groups.length} {groups.length === 1 ? 'Class' : 'Classes'}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>👥 {totalStudents} Students</div>
          </div>
          <button type="button" onClick={() => { clearAuth(); navigate('/'); }} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "none", backgroundColor: "rgba(220,53,69,0.15)", color: "#ff6b7a", fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero */}
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Professor Dashboard</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 10 }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </div>
          <div style={{ fontSize: 18, fontWeight: 400, color: "rgba(92,30,38,0.6)", marginBottom: 48 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Classes", value: groups.length, color: palette.crimson },
              { label: "Students", value: totalStudents, color: palette.sage },
              { label: "Questions", value: groups.reduce((s, _g) => s, 0), color: palette.deepBurgundy },
            ].map((stat, i) => (
              <div key={stat.label} style={{ flex: 1, paddingRight: i < 2 ? 40 : 0, marginRight: i < 2 ? 40 : 0, borderRight: i < 2 ? "1px solid rgba(214,214,214,0.5)" : "none" }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>
                  {loading ? '—' : stat.value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Classes section */}
        <div style={{ padding: "48px 64px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 40, fontWeight: 900, color: palette.darkest, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>Your Classes</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>
                {loading ? 'Loading...' : filtered.length === groups.length ? `Teaching ${groups.length} group${groups.length !== 1 ? 's' : ''}` : `Showing ${filtered.length} of ${groups.length}`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 14, border: "1.5px solid rgba(39,1,21,0.12)", backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", minWidth: 260 }}>
              <SearchIcon color={palette.deepBurgundy} />
              <input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Search classes..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: palette.deepBurgundy, fontSize: 14, fontWeight: 500, fontFamily: "inherit" }} />
            </div>
          </div>

          {/* Create group */}
          {!showCreate ? (
            <button onClick={() => setShowCreate(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderRadius: 16, border: "1.5px dashed rgba(162,34,55,0.25)", backgroundColor: "rgba(162,34,55,0.02)", marginBottom: 32, cursor: "pointer", color: palette.crimson, fontSize: 15, fontWeight: 600, outline: "none" }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Create a new class group
            </button>
          ) : (
            <div style={{ padding: "20px 24px", borderRadius: 16, border: "1.5px solid rgba(162,34,55,0.2)", backgroundColor: "#fff", marginBottom: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: palette.darkest, marginBottom: 14 }}>New Class Group</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="Class name (e.g., BIO 2301 — Cell Biology)" style={{ flex: 2, padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(39,1,21,0.15)", outline: "none", fontSize: 14, fontFamily: "inherit", color: palette.darkest }} />
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description (optional)" style={{ flex: 2, padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(39,1,21,0.15)", outline: "none", fontSize: 14, fontFamily: "inherit", color: palette.darkest }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{ padding: "10px 22px", background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`, color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: creating || !newName.trim() ? 0.6 : 1 }}>
                  {creating ? 'Creating…' : '+ Create Group'}
                </button>
                <button onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }} style={{ padding: "10px 18px", background: "transparent", color: palette.deepBurgundy, border: "1.5px solid rgba(39,1,21,0.15)", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Group cards */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 180, borderRadius: 20, backgroundColor: "#e8e0e4", animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
              {filtered.map(g => {
                const isHov = hoveredId === g.id;
                return (
                  <div key={g.id} onMouseEnter={() => setHoveredId(g.id)} onMouseLeave={() => setHoveredId(null)}
                    onClick={() => navigate(`/forum/${encodeURIComponent(g.name)}`)}
                    style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: isHov ? "0 20px 60px rgba(0,0,0,0.18)" : "0 2px 24px rgba(0,0,0,0.06)", transform: isHov ? "translateY(-4px)" : "translateY(0)", transition: "transform 200ms ease, box-shadow 200ms ease", cursor: "pointer", position: "relative" }}>
                    <div style={{ height: 5, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                    <div style={{ padding: "28px 28px 24px" }}>
                      {/* Invite code badge */}
                      <div style={{ position: "absolute", top: 18, right: 16, fontSize: 10, fontWeight: 800, color: palette.crimson, backgroundColor: "rgba(162,34,55,0.08)", padding: "3px 8px", borderRadius: 6, letterSpacing: 1 }}>
                        {g.code}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, lineHeight: 1.3, marginBottom: 8, paddingRight: 40 }}>
                        {g.name}
                      </div>
                      {g.description && (
                        <div style={{ fontSize: 13, color: "rgba(92,30,38,0.5)", marginBottom: 18, lineHeight: 1.5 }}>
                          {g.description.length > 80 ? g.description.slice(0, 80) + '…' : g.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, backgroundColor: "rgba(122,155,118,0.1)" }}>
                          <UsersIcon color={palette.sage} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>{g.member_count} member{g.member_count !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, backgroundColor: "rgba(162,34,55,0.06)", cursor: "pointer" }}
                          onClick={e => { e.stopPropagation(); navigate(`/workflow/${encodeURIComponent(g.name)}`); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" /></svg>
                          <span style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>AI Queue</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: palette.crimson }}>Open Forum</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && !loading && (
                <div style={{ gridColumn: "1 / -1", backgroundColor: "#fff", borderRadius: 20, padding: "48px 40px", textAlign: "center", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                  <div style={{ color: palette.darkest, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                    {query ? `No classes match "${query}"` : "No classes yet"}
                  </div>
                  <div style={{ color: "rgba(92,30,38,0.5)", fontSize: 14, fontWeight: 500 }}>
                    {query ? "Try a different search term." : "Create your first class group above."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer banner */}
        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 64px", marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>D.I.Y.A Platform</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>AI-powered teaching assistant.</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>Monitor engagement, analyze learning gaps, and respond smarter.</div>
        </div>
      </main>
    </div>
  );
}
