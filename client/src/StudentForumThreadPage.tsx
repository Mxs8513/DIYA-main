import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface Reply {
  id: string;
  author: string;
  role: "student" | "professor";
  text: string;
  image?: string;
  timestamp: Date;
}

const questionMap: Record<string, { question: string; author: string; image?: string }> = {
  "1": { question: "Can someone explain the difference between recursion and iteration?", author: "Student A" },
  "2": { question: "What's the best way to approach the final project?", author: "Student B" },
  "3": { question: "Are we allowed to use external libraries for the assignment?", author: "Student C" },
  "4": { question: "When is the deadline for submitting the lab report?", author: "Student D" },
  "5": { question: "How do I set up the development environment for this project?", author: "Student E" },
  "6": { question: "Is there a study guide available for the midterm exam?", author: "Student F" },
};

const demoReplies: Reply[] = [
  { id: "r1", author: "Prof. A", role: "professor", text: "Great question! Recursion calls itself with a smaller subproblem, while iteration uses loops. Both can solve the same problems but have different trade-offs in readability and performance.", timestamp: new Date("2026-03-10T14:30:00") },
  { id: "r2", author: "Student A", role: "student", text: "I think of recursion like Russian nesting dolls — each one opens to reveal a smaller version of itself.", timestamp: new Date("2026-03-10T14:45:00") },
  { id: "r3", author: "Student B", role: "student", text: "The textbook on page 214 has a really good diagram comparing the call stack for both approaches.", timestamp: new Date("2026-03-10T15:10:00") },
];

export function StudentForumThreadPage() {
  const { groupId, questionId } = useParams<{ groupId: string; questionId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>(questionId && parseInt(questionId) <= 6 ? demoReplies : []);
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const info = questionId ? questionMap[questionId] : undefined;
  const questionTitle = info?.question ?? "Your question";
  const questionAuthor = info?.author ?? "You";

  const handleSend = () => {
    const text = draft.trim();
    if (!text && !imagePreview) return;
    setReplies((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        author: "You",
        role: "student",
        text: text || "(image)",
        image: imagePreview,
        timestamp: new Date(),
      },
    ]);
    setDraft("");
    setImagePreview(undefined);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* collapsible sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 220 : 0,
          overflow: "hidden",
          transition: "width 200ms ease",
          background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)",
          padding: sidebarOpen ? "0 10px 16px" : 0,
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          boxShadow: sidebarOpen ? "4px 0 32px rgba(0,0,0,0.25)" : "none",
        }}
      >
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
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(162,34,55,0.45)" }}>
            <img src="/logo.png" alt="logo" style={{ height: 22, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Italiana, serif", fontSize: 22, letterSpacing: 2.5, color: "#fff", lineHeight: 1 }}>D.I.Y.A</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 }}>Student Portal</div>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Menu</div>

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
            const isActive = false; // only highlight Groups on the main groups list page, not on forum thread
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "groups") {
                    navigate("/groups");
                    return;
                  }
                  if (item.id === "request") {
                    navigate("/office-hours");
                    return;
                  }
                  if (item.id === "selfcheck") {
                    navigate("/self-check");
                    return;
                  }
                  alert(`${item.label} (route not wired yet)`);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 130ms ease",
                  outline: "none",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            margin: "10px 0 8px 0",
          }}
        />

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(135deg, rgba(162,34,55,0.7), rgba(92,30,38,0.7))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)" }}>S</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>Student</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>student@university.edu</div>
            </div>
          </div>
          <button type="button" onClick={() => alert("Signed out (auth not wired yet)")} style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none" }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderBottom: "1px solid #e0e0e0",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            style={{
              background: "none",
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}/forum`)}
            style={{
              background: "none",
              border: "none",
              color: palette.crimson,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back to Forum
          </button>
        </header>

        {/* question banner */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `2px solid ${palette.sage}`,
            backgroundColor: "rgba(122,155,118,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.sage, marginBottom: 4 }}>
            Asked by {questionAuthor}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: palette.deepBurgundy,
              lineHeight: 1.35,
            }}
          >
            {questionTitle}
          </div>
        </div>

        {/* replies area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {replies.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(92,30,38,0.4)", fontSize: 14, fontWeight: 600, marginTop: 40 }}>
              No replies yet — be the first to respond!
            </div>
          )}

          {replies.map((r) => {
            const isSelf = r.author === "You";
            const isProf = r.role === "professor";
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: isSelf ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "65%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    borderBottomRightRadius: isSelf ? 4 : 14,
                    borderBottomLeftRadius: isSelf ? 14 : 4,
                    backgroundColor: isSelf
                      ? "rgba(162,34,55,0.08)"
                      : isProf
                        ? "rgba(122,155,118,0.1)"
                        : "#fff",
                    border: isProf
                      ? `1px solid ${palette.sage}`
                      : isSelf
                        ? `1px solid rgba(162,34,55,0.2)`
                        : "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: isProf ? palette.sage : palette.deepBurgundy,
                    }}
                  >
                    {r.author} {isProf && "(Professor)"}
                  </div>
                  {r.image && (
                    <img
                      src={r.image}
                      alt="attachment"
                      style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }}
                    />
                  )}
                  <div style={{ fontSize: 14, lineHeight: 1.45, color: "#111" }}>{r.text}</div>
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, textAlign: "right" }}>
                    {r.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* image preview strip */}
        {imagePreview && (
          <div style={{ padding: "6px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <img src={imagePreview} alt="preview" style={{ height: 48, borderRadius: 6 }} />
            <button
              type="button"
              onClick={() => setImagePreview(undefined)}
              style={{
                background: "none",
                border: "none",
                color: palette.crimson,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        )}

        {/* input bar */}
        <div
          style={{
            borderTop: "1px solid #e0e0e0",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image"
            style={{
              background: "none",
              border: `1px solid rgba(39,1,21,0.2)`,
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>

          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Type your reply..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid rgba(39,1,21,0.2)`,
              fontSize: 14,
              outline: "none",
            }}
          />

          <button
            type="button"
            onClick={handleSend}
            aria-label="Send reply"
            style={{
              background: palette.crimson,
              border: "none",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
