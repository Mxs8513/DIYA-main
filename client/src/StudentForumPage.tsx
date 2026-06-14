import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface Question {
  id: number;
  author: string;
  question: string;
  replies: number;
  isNew: boolean;
  image?: string;
  aiVerified: boolean;
  upvotes: number;
}

function getTimeAgo(id: number): string {
  const times = ["2 hours ago", "5 hours ago", "1 day ago", "2 days ago", "3 days ago", "1 week ago"];
  return times[id % times.length];
}

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

const groupNames: Record<string, string> = {
  cs1337: "CS 1337 — Computer Science I",
  cs2305: "CS 2305 — Discrete Mathematics",
  math2413: "MATH 2413 — Differential Calculus",
  phys2325: "PHYS 2325 — Mechanics",
  ecs1100: "ECS 1100 — Intro to Engineering",
  cs3341: "CS 3341 — Probability & Statistics",
};

export function StudentForumPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const groupName = groupId ? (groupNames[groupId] ?? groupId) : "Forum";
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newImage, setNewImage] = useState<string | undefined>();
  const [upvotedIds, setUpvotedIds] = useState<Set<number>>(new Set());
  const popupFileRef = useRef<HTMLInputElement>(null);

  const defaultQuestions: Question[] = [
    { id: 1, author: "Student A", question: "Can someone explain the difference between recursion and iteration?", replies: 12, isNew: true, aiVerified: true, upvotes: 24 },
    { id: 2, author: "Student B", question: "What's the best way to approach the final project?", replies: 8, isNew: true, aiVerified: false, upvotes: 18 },
    { id: 3, author: "Student C", question: "Are we allowed to use external libraries for the assignment?", replies: 5, isNew: false, aiVerified: true, upvotes: 11 },
    { id: 4, author: "Student D", question: "When is the deadline for submitting the lab report?", replies: 3, isNew: false, aiVerified: false, upvotes: 7 },
    { id: 5, author: "Student E", question: "How do I set up the development environment for this project?", replies: 15, isNew: false, aiVerified: true, upvotes: 31 },
    { id: 6, author: "Student F", question: "Is there a study guide available for the midterm exam?", replies: 0, isNew: false, aiVerified: false, upvotes: 2 },
  ];

  const studentLabelByIndex: Record<number, string> = {
    1: "Student A", 2: "Student B", 3: "Student C", 4: "Student D", 5: "Student E", 6: "Student F",
  };
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(`forum-questions-${groupId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Question[];
        return parsed.map((q) => {
          if (q.author === "You") return q;
          const label = studentLabelByIndex[q.id];
          if (label) return { ...q, author: label };
          return q;
        });
      } catch { /* ignore */ }
    }
    return defaultQuestions;
  });

  useEffect(() => {
    localStorage.setItem(`forum-questions-${groupId}`, JSON.stringify(questions));
  }, [questions, groupId]);

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    const words = q.split(/\s+/);
    return questions.filter((item) => {
      const title = item.question.toLowerCase();
      return words.some((w) => title.includes(w));
    });
  })();

  const sorted = [...filtered].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return b.upvotes - a.upvotes;
  });

  const handleCreateQuestion = () => {
    const title = newTitle.trim();
    if (!title) return;
    const newQ: Question = {
      id: Date.now(),
      author: "You",
      question: title,
      replies: 0,
      isNew: false,
      image: newImage,
      aiVerified: false,
      upvotes: 0,
    };
    setQuestions((prev) => {
      const updated = [newQ, ...prev];
      localStorage.setItem(`forum-questions-${groupId}`, JSON.stringify(updated));
      return updated;
    });
    setNewTitle("");
    setNewImage(undefined);
    setShowPopup(false);
    navigate(`/groups/${groupId}/forum/${newQ.id}`);
  };

  const handlePopupImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImage(URL.createObjectURL(file));
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", backgroundColor: palette.cream }}>
      <Sidebar activeId="groups" />

      {/* main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "32px 36px 14px 24px",
            borderBottom: "1px solid #e0e0e0",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 850, fontSize: 44, color: palette.deepBurgundy, letterSpacing: -1, lineHeight: 1.1 }}>
            {groupName} Forum Page
          </span>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: palette.crimson }}>
              Ask a new question
            </span>
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                backgroundColor: palette.crimson,
                color: palette.cream,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Create new question"
            >
              +
            </button>
          </div>
        </header>

        {/* content area */}
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
          {/* search bar */}
          <div
            style={{
              width: "min(560px, 100%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid rgba(39,1,21,0.15)",
              backgroundColor: "rgba(39,1,21,0.05)",
            }}
          >
            <SearchIcon color={palette.deepBurgundy} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search questions..."
              aria-label="Search questions"
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

          <div style={{ height: 1, backgroundColor: "rgba(39,1,21,0.12)" }} />

          <div
            style={{
              color: palette.crimson,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {query.trim() && filtered.length !== questions.length
              ? `Showing ${filtered.length} of ${questions.length} questions`
              : `${questions.length} question${questions.length !== 1 ? "s" : ""} asked by your peers`}
          </div>

          {/* question cards — new ones first, outlined in green */}
          {sorted.map((q) => {
            const isQHovered = hoveredId === q.id;
            const borderColor = q.isNew
              ? palette.sage
              : isQHovered
                ? palette.crimson
                : "rgba(214,214,214,0.4)";
            return (
              <div
                key={q.id}
                onClick={() => navigate(`/groups/${groupId}/forum/${q.id}`)}
                onMouseEnter={() => setHoveredId(q.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: "relative",
                  textAlign: "left",
                  backgroundColor: "#fff",
                  border: `2px solid ${borderColor}`,
                  borderRadius: 14,
                  padding: "18px 20px",
                  cursor: "pointer",
                  boxShadow: isQHovered
                    ? "0 12px 36px rgba(0,0,0,0.22)"
                    : "0 4px 18px rgba(0,0,0,0.12)",
                  transform: isQHovered ? "translateY(-2px)" : "translateY(0px)",
                  transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                }}
              >
                {/* NEW badge */}
                {q.isNew && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 14,
                      backgroundColor: palette.sage,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 6,
                      letterSpacing: 0.5,
                    }}
                  >
                    NEW
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    paddingRight: q.isNew ? 50 : 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: -0.2,
                      color: palette.deepBurgundy,
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {q.question}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: palette.deepBurgundy,
                    alignItems: "center",
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
                    <span>{q.author}</span>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 8,
                      backgroundColor: q.replies === 0 ? "rgba(220,53,69,0.1)" : "rgba(92,30,38,0.08)",
                    }}
                  >
                    <ForumIcon color={q.replies === 0 ? "#DC3545" : palette.deepBurgundy} />
                    <span>{q.replies} {q.replies === 1 ? "reply" : "replies"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const alreadyVoted = upvotedIds.has(q.id);
                      setQuestions((prev) =>
                        prev.map((item) =>
                          item.id === q.id
                            ? { ...item, upvotes: item.upvotes + (alreadyVoted ? -1 : 1) }
                            : item
                        )
                      );
                      setUpvotedIds((prev) => {
                        const next = new Set(prev);
                        if (alreadyVoted) next.delete(q.id);
                        else next.add(q.id);
                        return next;
                      });
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: upvotedIds.has(q.id) ? `1px solid ${palette.crimson}` : "none",
                      backgroundColor: upvotedIds.has(q.id) ? "rgba(162,34,55,0.18)" : "rgba(162,34,55,0.08)",
                      color: palette.crimson,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 4l-7 8h4v8h6v-8h4L12 4z" fill={palette.crimson} />
                    </svg>
                    {q.upvotes}
                  </button>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(92,30,38,0.5)",
                      marginLeft: "auto",
                    }}
                  >
                    {getTimeAgo(q.id)}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: palette.crimson }}>
                    View replies
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {q.aiVerified && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: palette.sage,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    This question's AI answer has been verified by the professor.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* new question popup */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => { setShowPopup(false); setNewTitle(""); setNewImage(undefined); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: "28px 28px 22px",
              width: 420,
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 18 }}>
              Ask a Question
            </div>

            
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateQuestion(); }}
              placeholder="What's your question?"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid rgba(39,1,21,0.2)`,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 14,
              }}
            />

            <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy, marginBottom: 6 }}>
              Image (optional)
            </div>
            <input
              ref={popupFileRef}
              type="file"
              accept="image/*"
              onChange={handlePopupImage}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => popupFileRef.current?.click()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid rgba(39,1,21,0.2)`,
                backgroundColor: "transparent",
                color: palette.deepBurgundy,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 6,
              }}
            >
              {newImage ? "Change image" : "Upload image"}
            </button>
            {newImage && (
              <img
                src={newImage}
                alt="Preview"
                style={{ display: "block", maxWidth: "100%", maxHeight: 160, borderRadius: 8, marginTop: 8, marginBottom: 8 }}
              />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => { setShowPopup(false); setNewTitle(""); setNewImage(undefined); }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1px solid rgba(39,1,21,0.2)`,
                  backgroundColor: "transparent",
                  color: palette.deepBurgundy,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateQuestion}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: palette.crimson,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: newTitle.trim() ? 1 : 0.5,
                }}
              >
                Post Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
