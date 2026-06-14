import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { api, getUser, type Reply } from "../../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

export function StudentForumThreadPage() {
  const { groupId, questionId } = useParams<{ groupId: string; questionId: string }>();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [questionTitle, setQuestionTitle] = useState("Loading…");
  const [questionAuthor, setQuestionAuthor] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!questionId) return;
    api.forum.getQuestion(questionId)
      .then(data => {
        setQuestionTitle(data.title);
        setQuestionAuthor(data.author_name);
        setQuestionBody(data.body);
        setAiAnswer(data.ai_answer);
        setAiStatus(data.ai_status);
        setReplies(data.replies ?? []);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [questionId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !questionId || sending) return;
    setSending(true);
    try {
      const newReply = await api.forum.reply(questionId, text);
      setReplies(prev => [...prev, newReply]);
      setDraft("");
      setImagePreview(undefined);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
        height: "100vh",
      }}
    >
      <Sidebar activeId="groups" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Hero / question banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "32px 48px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}/forum`)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.75)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Forum
          </button>

          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            {questionAuthor ? `Asked by ${questionAuthor}` : "Loading…"}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.25,
              letterSpacing: -0.5,
            }}
          >
            {questionTitle}
          </div>
          {questionBody && (
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 8, lineHeight: 1.5 }}>
              {questionBody}
            </div>
          )}
        </div>

        {/* replies area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* AI answer banner */}
          {aiAnswer && (aiStatus === "verified" || aiStatus === "pending") && (
            <div
              style={{
                backgroundColor: aiStatus === "verified" ? "rgba(122,155,118,0.08)" : "rgba(162,34,55,0.04)",
                border: aiStatus === "verified" ? `1px solid ${palette.sage}` : "1px solid rgba(162,34,55,0.15)",
                borderRadius: 16,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: aiStatus === "verified" ? palette.sage : palette.deepBurgundy,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {aiStatus === "verified" && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {aiStatus === "verified" ? "AI Answer — Verified by Professor" : "AI Answer — Awaiting Review"}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#111", whiteSpace: "pre-wrap" }}>
                {aiAnswer}
              </div>
            </div>
          )}

          {!loading && replies.length === 0 && !aiAnswer && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: "32px",
                textAlign: "center",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                color: "rgba(92,30,38,0.4)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              No replies yet — be the first to respond!
            </div>
          )}

          {replies.map((r) => {
            const isSelf = currentUser && r.user_id === currentUser.id;
            const isProf = r.author_role === "professor";
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
                    padding: "12px 16px",
                    borderRadius: 16,
                    borderBottomRightRadius: isSelf ? 4 : 16,
                    borderBottomLeftRadius: isSelf ? 16 : 4,
                    backgroundColor: isSelf
                      ? "rgba(162,34,55,0.08)"
                      : isProf
                      ? "rgba(122,155,118,0.12)"
                      : "#fff",
                    border: isSelf
                      ? "1px solid rgba(162,34,55,0.2)"
                      : isProf
                      ? `1px solid ${palette.sage}`
                      : "1px solid #ddd",
                    boxShadow: isProf
                      ? "0 2px 16px rgba(122,155,118,0.18)"
                      : "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isProf ? palette.sage : palette.deepBurgundy,
                      }}
                    >
                      {isSelf ? "You" : r.author_name}
                    </span>
                    {isProf && !isSelf && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#fff",
                          backgroundColor: palette.sage,
                          padding: "1px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Professor
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: "#111" }}>{r.body}</div>
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, textAlign: "right" }}>
                    {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* image preview strip */}
        {imagePreview && (
          <div style={{ padding: "6px 48px 0", display: "flex", alignItems: "center", gap: 8 }}>
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
            borderTop: "1px solid rgba(214,214,214,0.4)",
            padding: "14px 48px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            backgroundColor: "#fff",
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
              fontFamily: "inherit",
            }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            aria-label="Send reply"
            style={{
              background: palette.crimson,
              border: "none",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              opacity: !draft.trim() || sending ? 0.5 : 1,
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
