import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { api, type ApprovedAnswer } from "../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
} as const;

export function ApprovedAnswersPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<ApprovedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!groupName) return;
    api.groups.byName(decodeURIComponent(groupName))
      .then(g => {
        setGroupId(g.id);
        return api.approvedAnswers.list(g.id);
      })
      .then(setAnswers)
      .catch(() => navigate('/professor'))
      .finally(() => setLoading(false));
  }, [groupName]);

  const filtered = answers.filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return a.question_pattern.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q) || (a.topic ?? "").toLowerCase().includes(q);
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <ProfessorSidebar activeId="approved" groupName={groupName} />

      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero */}
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
            Professor Portal
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>
            Answer Library
          </div>
          <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 48 }}>
            Verified answers reused by the AI to instantly respond to duplicate questions.
          </div>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Approved Answers", value: answers.length, color: palette.crimson },
              { label: "Total Uses", value: answers.reduce((s, a) => s + (a.usage_count || 0), 0), color: palette.sage },
            ].map((stat, i) => (
              <div key={stat.label} style={{ flex: 1, paddingRight: i < 1 ? 40 : 0, marginRight: i < 1 ? 40 : 0, borderRight: i < 1 ? "1px solid rgba(214,214,214,0.5)" : "none" }}>
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

        <div style={{ padding: "48px 64px" }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 14, border: "1px solid rgba(39,1,21,0.15)", backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 28, maxWidth: 520 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke={palette.deepBurgundy} strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search answers by topic or keyword..."
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, fontWeight: 500, color: palette.deepBurgundy }}
            />
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginBottom: 24 }}>
            {loading ? "Loading…" : `${filtered.length} answer${filtered.length !== 1 ? "s" : ""} in the library`}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(a => {
              const isExpanded = expandedId === a.id;
              return (
                <div key={a.id} style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                  <div style={{ height: 4, backgroundColor: palette.sage }} />
                  <div style={{ padding: "22px 28px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: palette.darkest, lineHeight: 1.3, marginBottom: 8 }}>
                          {a.question_pattern}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {a.topic && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: palette.deepBurgundy, backgroundColor: "rgba(92,30,38,0.06)", padding: "3px 8px", borderRadius: 6 }}>
                              {a.topic}
                            </span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, color: palette.sage, backgroundColor: "rgba(122,155,118,0.1)", padding: "3px 8px", borderRadius: 6 }}>
                            Used {a.usage_count} time{a.usage_count !== 1 ? "s" : ""}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.45)" }}>
                            Added by {a.created_by_name}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(39,1,21,0.15)", background: "transparent", fontSize: 12, fontWeight: 700, color: palette.deepBurgundy, cursor: "pointer" }}
                      >
                        {isExpanded ? "Hide" : "View Answer"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 16, padding: "16px 20px", backgroundColor: "rgba(122,155,118,0.06)", borderRadius: 12, borderLeft: `4px solid ${palette.sage}` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: palette.sage, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          Approved Answer
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                          {a.answer}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 32px", backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 2px 24px rgba(0,0,0,0.06)", color: "rgba(92,30,38,0.5)", fontSize: 15, fontWeight: 600 }}>
                {query ? "No answers match your search." : "No approved answers yet. Verify AI answers in the forum to build the library."}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
