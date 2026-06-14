import { useParams, useNavigate } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
} as const;

interface TopicInsight {
  id: string;
  name: string;
  questionCount: number;
  status: "needs-attention" | "proficient";
  engagementScore: number;
  positives: string[];
  concerns: string[];
  recommendations: string[];
}

const topicInsights: Record<string, TopicInsight> = {
  "topic-1": {
    id: "topic-1",
    name: "Recursion & Iteration",
    questionCount: 28,
    status: "needs-attention",
    engagementScore: 72,
    positives: [
      "Students are actively engaging and asking clarifying questions in the forum.",
      "Peer-to-peer explanations are emerging — some students are effectively teaching others.",
      "Questions show students are attempting problems before asking for help.",
    ],
    concerns: [
      "High volume of similar questions suggests the initial lecture explanation didn't land for a significant portion of the class.",
      "Students are confusing base cases and recursive cases — a foundational conceptual gap.",
      "Stack overflow concerns repeat across threads, indicating performance trade-offs are not understood.",
    ],
    recommendations: [
      "Dedicate 20–30 minutes in the next lecture to a live side-by-side coding walkthrough of recursion vs. iteration.",
      "Post a supplementary video showing the call stack visualization step by step.",
      "Create a short formative quiz to gauge comprehension before the next graded assignment.",
    ],
  },
  "topic-2": {
    id: "topic-2",
    name: "Data Structures",
    questionCount: 22,
    status: "proficient",
    engagementScore: 91,
    positives: [
      "Students are demonstrating strong understanding with mostly higher-order clarification questions.",
      "Cross-referencing of textbook pages and lecture notes shows students are using all resources well.",
      "The quality of peer answers on data structure threads is notably high — strong class-wide knowledge.",
    ],
    concerns: [
      "Tree traversal (inorder, preorder, postorder) is generating more confusion than other subtopics.",
      "A few students appear to be struggling silently — no forum posts but may be falling behind.",
      "Hash table collision handling questions suggest this subtopic needs more dedicated classroom time.",
    ],
    recommendations: [
      "Continue the current teaching approach — it is working well for the vast majority of students.",
      "Add a brief tree traversal review exercise at the start of the next lab session.",
      "Proactively reach out to students with no forum engagement to check their understanding.",
    ],
  },
  "topic-3": {
    id: "topic-3",
    name: "Development Environment",
    questionCount: 18,
    status: "needs-attention",
    engagementScore: 61,
    positives: [
      "Students who resolved their setup issues are helping others — strong community support.",
      "Specific error messages are being shared, making class-wide diagnosis easier.",
      "Most setup questions appear concentrated in the first 2 weeks — students are getting unblocked.",
    ],
    concerns: [
      "Students falling behind on setup may be missing early assignments entirely without realizing it.",
      "Platform inconsistencies (Windows vs. Mac vs. Linux) are causing disproportionate confusion.",
      "The current setup guide has gaps — multiple students reporting the same undocumented steps.",
    ],
    recommendations: [
      "Update the setup guide with platform-specific screenshots and common troubleshooting steps.",
      "Create a short video walkthrough for the 3 most common setup failure points.",
      "Host a 30-minute virtual drop-in session for students still having environment issues.",
    ],
  },
  "topic-4": {
    id: "topic-4",
    name: "Exam Preparation",
    questionCount: 14,
    status: "needs-attention",
    engagementScore: 68,
    positives: [
      "Students are proactively seeking exam guidance well in advance — excellent engagement.",
      "Questions about exam scope show students are reading the syllabus and thinking critically.",
      "Study group formation threads indicate students are self-organizing effectively.",
    ],
    concerns: [
      "Uncertainty about exam format is creating widespread anxiety that may impact performance.",
      "Students are unclear on which lecture topics are in scope — the syllabus may need clarification.",
      "No practice materials appear to be available yet, which students are requesting repeatedly.",
    ],
    recommendations: [
      "Release a detailed study guide with topic coverage percentages at least 2 weeks before the exam.",
      "Post 5–10 practice problems with solutions to give students a reliable calibration point.",
      "Hold a dedicated exam review session and record it for students who cannot attend live.",
    ],
  },
};

export function TopicDetailPage() {
  const { groupName, topicId } = useParams<{ groupName: string; topicId: string }>();
  const navigate = useNavigate();

  const topic = topicId ? topicInsights[topicId] ?? null : null;

  if (!topic) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, sans-serif" }}>
        <ProfessorSidebar activeId="analysis" groupName={groupName} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 20 }}>Topic not found.</div>
          <button
            type="button"
            onClick={() => navigate(`/analysis/${groupName}`)}
            style={{ padding: "12px 28px", borderRadius: 12, border: "none", backgroundColor: palette.crimson, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            Back to Analysis
          </button>
        </main>
      </div>
    );
  }

  const isAttention = topic.status === "needs-attention";
  const statusColor = isAttention ? "#DC3545" : palette.sage;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "#111",
        display: "flex",
      }}
    >
      <ProfessorSidebar activeId="analysis" groupName={groupName} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          style={{
            padding: "56px 64px 52px",
            borderBottom: "1px solid rgba(39,1,21,0.08)",
            background: "#fff",
          }}
        >
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate(`/analysis/${groupName}`)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(92,30,38,0.5)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 32,
              letterSpacing: 0.2,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Analysis
          </button>

          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 999,
              backgroundColor: isAttention ? "rgba(220,53,69,0.08)" : "rgba(122,155,118,0.1)",
              border: `1px solid ${isAttention ? "rgba(220,53,69,0.2)" : "rgba(122,155,118,0.25)"}`,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: statusColor,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, letterSpacing: 0.4 }}>
              {isAttention ? "Needs Attention" : "Proficient"}
            </span>
          </div>

          {/* Big title */}
          <h1
            style={{
              margin: 0,
              fontSize: 72,
              fontWeight: 900,
              color: palette.crimson,
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 28,
            }}
          >
            {topic.name}
          </h1>

          {/* Stat row */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 900, color: palette.deepBurgundy, lineHeight: 1, letterSpacing: -1.5 }}>
                {topic.questionCount}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginTop: 4, letterSpacing: 0.2 }}>
                Forum questions
              </div>
            </div>
            <div style={{ width: 1, backgroundColor: "rgba(39,1,21,0.1)", alignSelf: "stretch" }} />
            <div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: -1.5,
                  color: topic.engagementScore >= 85 ? palette.sage : topic.engagementScore >= 70 ? "#8B7355" : "#DC3545",
                }}
              >
                {topic.engagementScore}%
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginTop: 4, letterSpacing: 0.2 }}>
                Engagement score
              </div>
            </div>
            <div style={{ width: 1, backgroundColor: "rgba(39,1,21,0.1)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: 48, fontWeight: 900, color: statusColor, lineHeight: 1, letterSpacing: -1.5 }}>
                {topic.concerns.length}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginTop: 4, letterSpacing: 0.2 }}>
                Active concerns
              </div>
            </div>
          </div>
        </section>

        {/* ── THREE FULL-WIDTH INSIGHT SECTIONS ────────────────── */}
        <section style={{ padding: "0 64px 64px", flex: 1 }}>

          {/* Grid of 3 large cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
              paddingTop: 48,
            }}
          >

            {/* POSITIVES */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Colored top bar */}
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "32px 32px 36px" }}>
                {/* Icon + title */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: "rgba(122,155,118,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111", letterSpacing: -0.4 }}>Positives</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: palette.sage, marginTop: 2 }}>What's going well</div>
                  </div>
                </div>
                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {topic.positives.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          backgroundColor: "rgba(122,155,118,0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "rgba(17,17,17,0.7)", lineHeight: 1.6 }}>{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CONCERNS */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ height: 5, backgroundColor: "#DC3545" }} />
              <div style={{ padding: "32px 32px 36px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: "rgba(220,53,69,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v4M12 17h.01" stroke="#DC3545" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#DC3545" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111", letterSpacing: -0.4 }}>Concerns</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#DC3545", marginTop: 2 }}>Areas of struggle</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {topic.concerns.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          backgroundColor: "rgba(220,53,69,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="#DC3545" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "rgba(17,17,17,0.7)", lineHeight: 1.6 }}>{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RECOMMENDATIONS */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.crimson }} />
              <div style={{ padding: "32px 32px 36px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: "rgba(162,34,55,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111", letterSpacing: -0.4 }}>Recommendations</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: palette.crimson, marginTop: 2 }}>Action items</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {topic.recommendations.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div
                        style={{
                          minWidth: 28,
                          height: 28,
                          borderRadius: 999,
                          background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#fff",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {i + 1}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "rgba(17,17,17,0.7)", lineHeight: 1.6 }}>{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM SUMMARY BANNER ───────────────────────────── */}
          <div
            style={{
              marginTop: 32,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
              padding: "40px 48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Class Snapshot
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.35, letterSpacing: -0.4 }}>
                {topic.name}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginTop: 10, lineHeight: 1.6, maxWidth: 560 }}>
                {topic.questionCount} questions analyzed &mdash; engagement at{" "}
                <strong style={{ color: "#fff" }}>{topic.engagementScore}%</strong>.{" "}
                {isAttention
                  ? "Immediate instructor action is recommended to address the concerns above."
                  : "The class is performing well on this topic — maintain current approach."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/analysis/${groupName}`)}
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                backdropFilter: "blur(8px)",
              }}
            >
              ← Back to Analysis
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
