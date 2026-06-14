import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { api, type Question } from "../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ForumPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"All" | "Pending" | "Verified">("All");

  useEffect(() => {
    if (!groupName) return;
    api.groups.byName(decodeURIComponent(groupName))
      .then(g => {
        setGroupId(g.id);
        return api.forum.list(g.id);
      })
      .then(setQuestions)
      .catch(() => navigate('/professor'))
      .finally(() => setLoading(false));
  }, [groupName]);

  const handleAIResponse = async (questionId: number, action: "verify" | "reject") => {
    const status = action === "verify" ? "verified" : "rejected";
    try {
      await api.forum.updateAIStatus(questionId, status);
      setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, ai_status: status as Question["ai_status"] } : q));
    } catch { /* ignore */ }
  };

  const filtered = questions.filter(q => {
    if (filter === "Pending") return q.ai_status === "pending" || q.ai_status === "generating";
    if (filter === "Verified") return q.ai_status === "verified";
    return true;
  });

  const pendingCount = questions.filter(q => q.ai_status === "pending" || q.ai_status === "generating").length;
  const verifiedCount = questions.filter(q => q.ai_status === "verified").length;
  const totalReplies = questions.reduce((sum, q) => sum + (q.reply_count || 0), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <ProfessorSidebar activeId="analysis" groupName={groupName} />

      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero Section */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "56px 64px 52px",
            borderBottom: "1px solid rgba(214,214,214,0.2)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
            Student Forum
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>
            {decodeURIComponent(groupName || "")}
          </div>
          <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 52 }}>
            Discussion board & AI answer management
          </div>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Total Questions", value: questions.length, color: palette.crimson },
              { label: "AI Verified", value: verifiedCount, color: palette.sage },
              { label: "Pending Review", value: pendingCount, color: "#DC3545" },
              { label: "Student Replies", value: totalReplies, color: palette.deepBurgundy },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: i < 3 ? 40 : 0,
                  marginRight: i < 3 ? 40 : 0,
                  borderRight: i < 3 ? "1px solid rgba(214,214,214,0.5)" : "none",
                }}
              >
                <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions Section */}
        <div style={{ padding: "48px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: palette.darkest, letterSpacing: -1 }}>
              Recent Questions
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["All", "Pending", "Verified"] as const).map((label) => (
                <button
                  key={label}
                  onClick={() => setFilter(label)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: filter === label ? "none" : "1.5px solid rgba(39,1,21,0.12)",
                    backgroundColor: filter === label ? palette.crimson : "transparent",
                    color: filter === label ? "white" : palette.deepBurgundy,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(92,30,38,0.5)", fontWeight: 600 }}>
              Loading questions…
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filtered.map((q) => {
              const isHovered = hoveredId === q.id;
              const statusColor = q.ai_status === "verified" ? palette.sage : q.ai_status === "rejected" ? "#DC3545" : palette.crimson;
              return (
                <div
                  key={q.id}
                  onMouseEnter={() => setHoveredId(q.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: isHovered ? "0 20px 60px rgba(0,0,0,0.14)" : "0 2px 24px rgba(0,0,0,0.06)",
                    transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                    transition: "transform 200ms ease, box-shadow 200ms ease",
                  }}
                >
                  <div style={{ height: 4, backgroundColor: statusColor }} />
                  <div style={{ padding: "28px 32px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ flex: 1, paddingRight: 24 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: palette.darkest, letterSpacing: -0.4, lineHeight: 1.35, marginBottom: 10 }}>
                          {q.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, backgroundColor: "rgba(122,155,118,0.1)" }}>
                            <UsersIcon color={palette.sage} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: palette.deepBurgundy }}>{q.author_name}</span>
                          </div>
                          <div style={{ padding: "5px 10px", borderRadius: 8, backgroundColor: q.reply_count === 0 ? "rgba(220,53,69,0.08)" : "rgba(92,30,38,0.06)", fontSize: 12, fontWeight: 700, color: q.reply_count === 0 ? "#DC3545" : palette.deepBurgundy }}>
                            {q.reply_count} {q.reply_count === 1 ? "reply" : "replies"}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>
                            {timeAgo(q.created_at)}
                          </span>
                          {q.topic && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: palette.deepBurgundy, backgroundColor: "rgba(92,30,38,0.06)", padding: "3px 8px", borderRadius: 6 }}>
                              {q.topic}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ padding: "6px 14px", borderRadius: 10, backgroundColor: q.ai_status === "verified" ? "rgba(122,155,118,0.12)" : q.ai_status === "rejected" ? "rgba(220,53,69,0.1)" : "rgba(162,34,55,0.08)", fontSize: 11, fontWeight: 800, color: statusColor, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                        {q.ai_status === "verified" ? "✓ Verified" : q.ai_status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                      </div>
                    </div>

                    {q.ai_answer && (
                      <div style={{ padding: "16px 20px", backgroundColor: q.ai_status === "verified" ? "rgba(122,155,118,0.06)" : q.ai_status === "rejected" ? "rgba(220,53,69,0.04)" : "rgba(162,34,55,0.03)", borderRadius: 14, borderLeft: `4px solid ${statusColor}`, marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: palette.crimson, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          AI Generated Answer
                          {q.rag_sources && (() => { try { const s: string[] = JSON.parse(q.rag_sources); return s.length > 0 ? <span style={{ marginLeft: 8, fontWeight: 700, color: "#6366f1" }}>📚 {s.join(', ')}</span> : null; } catch { return null; } })()}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.65 }}>
                          {q.ai_answer}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(q.ai_status === "pending" || q.ai_status === "generating") && q.ai_answer && (
                          <>
                            <button
                              onClick={() => handleAIResponse(q.id, "verify")}
                              style={{ padding: "8px 16px", background: palette.sage, color: "white", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              ✓ Verify Answer
                            </button>
                            <button
                              onClick={() => handleAIResponse(q.id, "reject")}
                              style={{ padding: "8px 16px", background: "transparent", color: "#DC3545", border: "1.5px solid #DC3545", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/forum/${groupName}/question/${q.id}`)}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 700, color: palette.crimson }}
                      >
                        View Discussion
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 2px 24px rgba(0,0,0,0.06)", color: "rgba(92,30,38,0.5)", fontWeight: 600 }}>
                No questions yet.
              </div>
            )}
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 64px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            AI Forum Management
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 4 }}>
            {pendingCount > 0 ? `${pendingCount} answers awaiting your review.` : "All AI answers reviewed. Great work."}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
            Verify or override AI-generated responses to keep students informed.
          </div>
        </div>
      </main>
    </div>
  );
}
