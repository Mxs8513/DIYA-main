import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { api, type Reply } from "../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

export function QuestionDetailPage() {
  const { groupName, questionId } = useParams<{ groupName: string; questionId: string }>();
  const navigate = useNavigate();

  const [questionTitle, setQuestionTitle] = useState("Loading…");
  const [questionBody, setQuestionBody] = useState("");
  const [questionAuthor, setQuestionAuthor] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("pending");
  const [ragSources, setRagSources] = useState<string[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  const [manualAnswer, setManualAnswer] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!questionId) return;
    api.forum.getQuestion(questionId)
      .then(data => {
        setQuestionTitle(data.title);
        setQuestionBody(data.body);
        setQuestionAuthor(data.author_name);
        setAiAnswer(data.ai_answer);
        setAiStatus(data.ai_status);
        if (data.rag_sources) {
          try { setRagSources(JSON.parse(data.rag_sources)); } catch { /* ignore */ }
        }
        setReplies(data.replies ?? []);
      })
      .catch(() => navigate(`/forum/${groupName}`))
      .finally(() => setLoading(false));
  }, [questionId]);

  const handleVerify = async (status: "verified" | "rejected") => {
    if (!questionId) return;
    try {
      await api.forum.updateAIStatus(questionId, status);
      setAiStatus(status);
    } catch { /* ignore */ }
  };

  const handleSubmitManualAnswer = async () => {
    if (!manualAnswer.trim() || !questionId || submitting) return;
    setSubmitting(true);
    try {
      const newReply = await api.forum.reply(questionId, manualAnswer.trim());
      setReplies(prev => [...prev, newReply]);
      setManualAnswer("");
      setShowManualInput(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const statusColor = aiStatus === "verified" ? palette.sage : aiStatus === "rejected" ? "#DC3545" : palette.crimson;

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
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <button
            onClick={() => navigate(`/forum/${groupName}`)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", padding: 0, marginBottom: 24, fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.5)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Forum
          </button>

          <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
            Question Discussion
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, color: palette.darkest, letterSpacing: -2, lineHeight: 1.1, marginBottom: 12, maxWidth: 900 }}>
            {loading ? "Loading…" : questionTitle}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>
            Asked by {questionAuthor} · {decodeURIComponent(groupName || "")}
          </div>
          {questionBody && (
            <div style={{ marginTop: 12, fontSize: 15, color: "rgba(92,30,38,0.65)", lineHeight: 1.6, maxWidth: 800 }}>
              {questionBody}
            </div>
          )}
        </div>

        <div style={{ padding: "48px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
            {/* Left: AI Answer + Replies */}
            <div>
              {/* AI Answer card */}
              {aiAnswer && (
                <div style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)", marginBottom: 24 }}>
                  <div style={{ height: 4, backgroundColor: statusColor }} />
                  <div style={{ padding: "24px 28px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(162,34,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          🤖
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: palette.crimson }}>AI Assistant</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>
                            {aiStatus === "verified" ? "✓ Verified by professor" : aiStatus === "rejected" ? "✗ Rejected" : "⏳ Awaiting review"}
                          </div>
                        </div>
                      </div>
                      {(aiStatus === "pending" || aiStatus === "generating") && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleVerify("verified")}
                            style={{ padding: "6px 14px", background: palette.sage, color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            ✓ Verify
                          </button>
                          <button
                            onClick={() => { handleVerify("rejected"); setShowManualInput(true); }}
                            style={{ padding: "6px 14px", background: "transparent", color: "#DC3545", border: "1.5px solid #DC3545", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            ✗ Reject & Reply
                          </button>
                        </div>
                      )}
                    </div>
                    {ragSources.length > 0 && (
                      <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 700, color: "#6366f1" }}>
                        📚 Based on: {ragSources.join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {aiAnswer}
                    </div>
                  </div>
                </div>
              )}

              {/* Student replies */}
              <div style={{ fontSize: 24, fontWeight: 900, color: palette.darkest, letterSpacing: -0.8, marginBottom: 24 }}>
                Discussion ({replies.length} {replies.length === 1 ? "reply" : "replies"})
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {replies.map((reply) => (
                  <div key={reply.id} style={{ backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 4, backgroundColor: palette.lightGray }} />
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(214,214,214,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          👤
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: palette.darkest }}>{reply.author_name}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>
                            {new Date(reply.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.65 }}>
                        {reply.body}
                      </div>
                    </div>
                  </div>
                ))}

                {!loading && replies.length === 0 && !aiAnswer && (
                  <div style={{ textAlign: "center", padding: "32px", backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 2px 24px rgba(0,0,0,0.06)", color: "rgba(92,30,38,0.4)", fontSize: 14, fontWeight: 600 }}>
                    No replies yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Professor Action Panel */}
            <div style={{ position: "sticky", top: 32 }}>
              <div style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.08)", marginBottom: 16 }}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                <div style={{ padding: "24px" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: palette.darkest, marginBottom: 16 }}>Professor Actions</div>
                  <button
                    onClick={() => setShowManualInput(true)}
                    style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}
                  >
                    ✏️ Write Custom Answer
                  </button>
                  <button
                    onClick={() => navigate(`/forum/${groupName}`)}
                    style={{ width: "100%", padding: "12px", background: "transparent", color: palette.deepBurgundy, border: "1.5px solid rgba(92,30,38,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    ← Back to Forum
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                  Thread Stats
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>Total replies</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.crimson }}>{replies.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>AI status</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, textTransform: "capitalize" }}>{aiStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Answer Input */}
          {showManualInput && (
            <div style={{ marginTop: 32, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.12)" }}>
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "28px 32px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.darkest, marginBottom: 16 }}>
                  👨‍🏫 Your Manual Response
                </div>
                <textarea
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{ width: "100%", minHeight: 140, padding: "14px 16px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 12, fontSize: 15, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none", color: palette.deepBurgundy, lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button
                    onClick={handleSubmitManualAnswer}
                    disabled={submitting}
                    style={{ padding: "12px 24px", background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    {submitting ? "Submitting…" : "Submit Answer"}
                  </button>
                  <button
                    onClick={() => setShowManualInput(false)}
                    style={{ padding: "12px 24px", background: "transparent", color: palette.deepBurgundy, border: "1.5px solid rgba(92,30,38,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "36px 64px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
            {decodeURIComponent(groupName || "")}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
            Keep the conversation going — students are watching.
          </div>
        </div>
      </main>
    </div>
  );
}
