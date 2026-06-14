import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Defining the shape of a group object
type StudentGroup = {
  id: string;
  name: string;
  membersCount: number;
  forumPostsCount: number;
};

// Creating a constant pallete to help when styling how pages are going to look
const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

// Demo data to help simulate what the group homepage looks like
const demoGroups: StudentGroup[] = [
  { id: "cs1337", name: "CS 1337 — Computer Science I", membersCount: 128, forumPostsCount: 42 },
  { id: "cs2305", name: "CS 2305 — Discrete Mathematics", membersCount: 96, forumPostsCount: 31 },
  { id: "math2413", name: "MATH 2413 — Differential Calculus", membersCount: 211, forumPostsCount: 58 },
  { id: "phys2325", name: "PHYS 2325 — Mechanics", membersCount: 144, forumPostsCount: 19 },
  { id: "ecs1100", name: "ECS 1100 — Intro to Engineering", membersCount: 310, forumPostsCount: 67 },
  { id: "cs3341", name: "CS 3341 — Probability & Statistics", membersCount: 88, forumPostsCount: 24 },
];

// For the group name search bar: magnifying glass icon
function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke={color} strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// For the SVG images, paths used to draw out the images like the logo in the Groups page.
// This is the users/members icon used in the group cards
function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// This is the forum/posts icon used in the group cards
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

// Main page component for displaying student groups
export function StudentGroupsPage({
  groups = demoGroups,
}: {
  groups?: StudentGroup[];
}) {
  const navigate = useNavigate(); // for navigating to other pages
  const [query, setQuery] = useState(""); // search input state
  const [hoveredId, setHoveredId] = useState<string | null>(null); // for hover effects on group cards

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups; // if no query, return all
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  // Helper vars for showing counts
  const totalCount = groups.length;
  const showingCount = filteredGroups.length;
  const showingLabel =
    query.trim().length > 0 && showingCount !== totalCount
      ? `Showing ${showingCount} of ${totalCount} groups`
      : `You're a member of ${totalCount} group${totalCount === 1 ? "" : "s"}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        textAlign: "left",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: "#111",
        display: "flex",
      }}
    >






      {/* sidebar — (30%) color*/}
      <aside
        style={{
          width: 180,
          background: `linear-gradient(180deg, #3d1542 0%, ${palette.darkest} 100%)`,
          padding: 12,
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: "Italiana, serif",
            fontSize: 30,
            letterSpacing: 1.5,
            color: "#fff",
            padding: "6px 4px 10px 4px",
          }}
        >
          <img src="/logo.png" alt="logo" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
          <span style={{ lineHeight: 1 }}>D.I.Y.A</span>
        </div>









        {/* divider line */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.25)",
            margin: "0 0 10px 0",
          }}
        />







        {/* Sidebar navigation buttons */}
        <nav aria-label="Sidebar navigation" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(
            [
              { id: "profile", label: "Profile" },
              { id: "groups", label: "Groups" },
              { id: "activity", label: "Activity" },
              { id: "request", label: "Request Office Hours" },
              { id: "selfcheck", label: "Self-Check" },
            ] as const
          ).map((item) => {
            const isActive = item.id === "groups"; // currently active page
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "groups") return; // already on this page
                  alert(`${item.label} (route not wired yet)`); // placeholder
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: isActive ? "rgba(255,255,255,0.88)" : "transparent",
                  color: isActive ? palette.darkest : "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  transition: "background-color 120ms ease",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>











        <div style={{ flex: 1 }} /> {/* spacer to push sign out button to bottom */}

        {/* bottom divider */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            margin: "10px 0 8px 0",
          }}
        />

        {/* sign out button */}
        <button
          type="button"
          onClick={() => alert("Signed out (auth not wired yet)")}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            backgroundColor: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </aside>













      {/* main content — burgundy background (60%) */}
      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1400 }}>
          {/* Page title */}
          <div
            style={{
              color: palette.crimson,
              fontSize: 44,
              fontWeight: 850,
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            Groups
          </div>

          {/* small divider under title */}
          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 18,
            }}
          />

          {/* search bar — light gray accent (10%) */}
          <div
            style={{
              width: "min(560px, 100%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 12,
              border: `1px solid rgba(39,1,21,0.15)`,
              backgroundColor: "rgba(39,1,21,0.05)",
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








          {/* showing count text */}
          <div
            style={{
              marginTop: 12,
              color: palette.crimson,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {showingLabel}
          </div>












          {/* group cards container */}
          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              alignItems: "stretch",
            }}
          >












            {/* render each group card */}
            {filteredGroups.map((g) => {
              const isHovered = hoveredId === g.id; // handle hover effects
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
                    borderRadius: 14,
                    padding: "18px 20px",
                    cursor: "pointer",
                    boxShadow: isHovered
                      ? "0 12px 36px rgba(0,0,0,0.22)"
                      : "0 4px 18px rgba(0,0,0,0.12)",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0px)",
                    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                  }}
                >











                  {/* card header — name + dot indicator */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        letterSpacing: -0.2,
                        color: palette.deepBurgundy,
                        lineHeight: 1.3,
                      }}
                    >
                      {g.name}
                    </div>





                    {/* small status dot */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: palette.sage,
                        flex: "0 0 auto",
                      }}
                      aria-hidden="true"
                    />
                  </div>





                  {/* card stats — members & posts */}
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: palette.deepBurgundy,
                    }}
                  >





                    {/* members */}
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
                      <span>{g.membersCount} members</span>
                    </div>





                    {/* forum posts */}
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
                      <span>{g.forumPostsCount} posts</span>
                    </div>
                  </div>







                  {/* view group + arrow */}
                  <div
                    style={{
                      marginTop: 14,
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










            {/* fallback if no groups match search */}
            {filteredGroups.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(214,214,214,0.3)",
                  borderRadius: 14,
                  padding: 22,
                  boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ color: palette.deepBurgundy, fontWeight: 900, fontSize: 16 }}>
                  No groups match "{query.trim()}"
                </div>
                <div style={{ marginTop: 8, color: "rgba(17,17,17,0.6)", fontSize: 13, fontWeight: 600 }}>
                  Try a shorter name, course code, or remove extra spaces.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}