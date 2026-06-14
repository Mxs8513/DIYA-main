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

interface TopicInsight {
  id: string;
  name: string;
  questionCount: number;
  trend: "rising" | "steady" | "declining";
  engagementScore: number;
  positives: string[];
  concerns: string[];
  recommendations: string[];
}

const topicData: Record<string, TopicInsight> = {
  recursion: {
    id: "recursion",
    name: "Recursion",
    questionCount: 18,
    trend: "rising",
    engagementScore: 87,
    positives: [
      "Strong peer-to-peer explanation happening in the forum — students are teaching each other effectively.",
      "Professor responses on recursion threads have been detailed and well-received with high upvote counts.",
      "Students are drawing analogies (e.g. Russian nesting dolls) showing genuine conceptual understanding.",
    ],
    concerns: [
      "Multiple students asking the same base-case questions suggests the concept was not fully clarified in lecture.",
      "Some students are confusing recursion with iteration — a conceptual gap that needs bridging.",
      "Stack overflow concerns come up repeatedly, indicating performance implications are not well understood.",
    ],
    recommendations: [
      "Review recursion lecture slides and practice with simple examples (factorial, Fibonacci) before moving to complex trees.",
      "Visualize the call stack using a step-through debugger to see how frames build up and unwind.",
      "Attend office hours if still unclear on base cases — this is a foundational concept for the rest of the course.",
    ],
  },
  "data-structures": {
    id: "data-structures",
    name: "Data Structures",
    questionCount: 24,
    trend: "rising",
    engagementScore: 92,
    positives: [
      "Students are making connections between different data structures (arrays vs. linked lists, stacks vs. queues).",
      "Good cross-referencing of textbook pages — indicates students are completing assigned readings.",
      "AI-verified answers on linked list questions suggest strong understanding from top contributors.",
    ],
    concerns: [
      "Tree traversal (inorder, preorder, postorder) has the most unanswered questions — a clear knowledge gap.",
      "Hash table collision resolution strategies are generating confusion across multiple threads.",
      "Time complexity analysis for data structure operations is frequently misunderstood or omitted.",
    ],
    recommendations: [
      "Draw out tree structures by hand before writing code — visualizing traversal order helps significantly.",
      "Practice implementing each data structure from scratch to understand its behavior and performance trade-offs.",
      "Use Big-O cheat sheets to cross-check your complexity analysis before submitting assignments.",
    ],
  },
  iteration: {
    id: "iteration",
    name: "Iteration",
    questionCount: 11,
    trend: "steady",
    engagementScore: 74,
    positives: [
      "Most loop-related questions have been answered quickly, showing solid peer knowledge in the forum.",
      "Students are asking good edge-case questions (empty arrays, off-by-one) — shows critical thinking.",
      "Nested loop questions tend to get thorough explanations covering both correctness and efficiency.",
    ],
    concerns: [
      "Off-by-one errors are a recurring theme — students are not consistently testing boundary conditions.",
      "Some students confuse while and do-while semantics, especially around initial condition checks.",
      "Loop invariant reasoning is rarely mentioned, which may cause issues in more formal algorithm courses.",
    ],
    recommendations: [
      "Always write a test case for empty input and a single-element case when writing loops.",
      "Trace through loops manually with a small example before running code to catch off-by-one errors.",
      "Review the difference between pre-condition and post-condition loops with the course notes.",
    ],
  },
  debugging: {
    id: "debugging",
    name: "Debugging & Testing",
    questionCount: 15,
    trend: "rising",
    engagementScore: 81,
    positives: [
      "Students are sharing debugging strategies (print statements, breakpoints) with each other effectively.",
      "Testing discussions show growing awareness of edge cases and boundary conditions.",
      "Questions about unit testing suggest students are thinking about code quality proactively.",
    ],
    concerns: [
      "Many students rely solely on print statements rather than using a proper debugger.",
      "Test coverage is low in submitted assignments — only happy-path tests are typically written.",
      "Error message interpretation is a common struggle — students don't know how to read full stack traces.",
    ],
    recommendations: [
      "Set up a debugger in your IDE and learn to set breakpoints — it is far more powerful than print statements.",
      "Write tests for failure cases, not just success cases — think about what could go wrong.",
      "When you see an error, read the full stack trace from top to bottom — the root cause is usually in your own code.",
    ],
  },
  oop: {
    id: "oop",
    name: "Object-Oriented Programming",
    questionCount: 19,
    trend: "steady",
    engagementScore: 78,
    positives: [
      "Inheritance concepts are well understood at a high level, with solid forum participation.",
      "Students are connecting OOP principles to real-world examples in their questions.",
      "Encapsulation and access modifiers are being discussed correctly in most threads.",
    ],
    concerns: [
      "Polymorphism is generating the most confusion — especially runtime vs. compile-time polymorphism.",
      "Abstract classes vs. interfaces remains a persistent point of confusion across the class.",
      "Students are over-using inheritance where composition would be more appropriate.",
    ],
    recommendations: [
      "Build small demo programs that demonstrate each OOP pillar in isolation before combining them.",
      "Practice the 'is-a' vs. 'has-a' test to decide between inheritance and composition.",
      "Re-read the interface vs. abstract class section in the textbook — the distinction is critical for the final project.",
    ],
  },
  projects: {
    id: "projects",
    name: "Projects & Assignments",
    questionCount: 22,
    trend: "rising",
    engagementScore: 95,
    positives: [
      "High engagement on project-related threads shows students are taking assignments seriously.",
      "Students are proactively asking about requirements and clarifications early — good planning behavior.",
      "Collaboration on debugging project-specific issues is strong and consistently productive.",
    ],
    concerns: [
      "Many deadline-related questions suggest some students are not tracking due dates proactively.",
      "Scope creep questions indicate students are struggling to define the minimum viable deliverable.",
      "Code submission format questions are recurring — submission guidelines may need more visibility.",
    ],
    recommendations: [
      "Set personal deadlines 2 days before the actual deadline to give yourself buffer for unexpected bugs.",
      "Re-read the project spec at least 3 times before starting to ensure you understand all requirements.",
      "Ask clarifying questions during lecture or office hours rather than waiting until the day before submission.",
    ],
  },
  algorithms: {
    id: "algorithms",
    name: "Algorithms",
    questionCount: 13,
    trend: "declining",
    engagementScore: 69,
    positives: [
      "Students are referencing lecture examples in forum answers, showing good retention from class.",
      "Sorting algorithm comparisons (bubble vs. merge vs. quick) are generating quality discussions.",
      "Some students are going beyond requirements by analyzing average-case vs. worst-case complexity.",
    ],
    concerns: [
      "Search algorithm questions (binary search, BFS, DFS) are going unanswered more than average.",
      "Greedy vs. dynamic programming trade-offs are frequently confused — a key gap for the final exam.",
      "Engagement is declining week-over-week, which may indicate this section is moving too fast.",
    ],
    recommendations: [
      "Practice tracing through algorithms on paper with small inputs before implementing them in code.",
      "Focus extra time on dynamic programming — it is historically the hardest topic on the final exam.",
      "Form a study group specifically for algorithm practice — peer explanation is very effective here.",
    ],
  },
};

const trendConfig = {
  rising: { label: "Trending Up", color: palette.sage, bg: "rgba(122,155,118,0.12)", icon: "↑" },
  steady: { label: "Steady", color: "#8B7355", bg: "rgba(139,115,85,0.12)", icon: "→" },
  declining: { label: "Needs Attention", color: palette.crimson, bg: "rgba(162,34,55,0.1)", icon: "↓" },
};

export function TopicAnalysisPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const topic = topicId ? (topicData[topicId] ?? null) : null;

  if (!topic) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, sans-serif" }}>
        <Sidebar activeId="selfcheck" />
        <main style={{ flex: 1, padding: "48px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 16 }}>
            Topic not found.
          </div>
          <button
            type="button"
            onClick={() => navigate("/self-check")}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              backgroundColor: palette.crimson,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Self-Check
          </button>
        </main>
      </div>
    );
  }

  const trend = trendConfig[topic.trend];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: "#111",
        display: "flex",
      }}
    >
      <Sidebar activeId="selfcheck" />

      <main style={{ flex: 1, padding: "32px 40px 56px 32px", boxSizing: "border-box", overflowY: "auto" }}>
        <div style={{ maxWidth: 1100 }}>

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/self-check")}
            style={{
              background: "none",
              border: "none",
              color: palette.crimson,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 20,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Analysis
          </button>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                color: palette.crimson,
                fontSize: 42,
                fontWeight: 850,
                letterSpacing: -1,
                lineHeight: 1.1,
                marginBottom: 14,
              }}
            >
              {topic.name}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(39,1,21,0.07)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: palette.deepBurgundy,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 7.5A4.5 4.5 0 0110.5 3h3A4.5 4.5 0 0118 7.5v3A4.5 4.5 0 0113.5 15H11l-4.5 3V15A4.5 4.5 0 016 10.5v-3z"
                    stroke={palette.deepBurgundy} strokeWidth="2" strokeLinejoin="round"
                  />
                </svg>
                {topic.questionCount} forum questions
              </div>

              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: trend.bg,
                  fontSize: 13,
                  fontWeight: 700,
                  color: trend.color,
                }}
              >
                {trend.icon} {trend.label}
              </div>

              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(122,155,118,0.1)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: palette.sage,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={palette.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {topic.engagementScore}% engagement
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "rgba(39,1,21,0.1)", marginBottom: 32 }} />

          {/* 3-column insight grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 22,
              marginBottom: 36,
            }}
          >
            {/* Positives */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: "24px 26px",
                border: `1.5px solid rgba(122,155,118,0.35)`,
                boxShadow: "0 4px 20px rgba(122,155,118,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(122,155,118,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: palette.sage }}>Positives</div>
                  <div style={{ fontSize: 11, color: "rgba(122,155,118,0.7)", fontWeight: 600 }}>What's going well</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topic.positives.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      borderRadius: 10,
                      backgroundColor: "rgba(122,155,118,0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: palette.sage,
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "rgba(17,17,17,0.75)", lineHeight: 1.55 }}>
                      {p}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Concerns */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: "24px 26px",
                border: `1.5px solid rgba(162,34,55,0.2)`,
                boxShadow: "0 4px 20px rgba(162,34,55,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(162,34,55,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4M12 17h.01" stroke={palette.crimson} strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={palette.crimson} strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: palette.crimson }}>Concerns</div>
                  <div style={{ fontSize: 11, color: "rgba(162,34,55,0.6)", fontWeight: 600 }}>Areas of struggle</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topic.concerns.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      borderRadius: 10,
                      backgroundColor: "rgba(162,34,55,0.04)",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: palette.crimson,
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "rgba(17,17,17,0.75)", lineHeight: 1.55 }}>
                      {c}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: "24px 26px",
                border: `1.5px solid rgba(92,30,38,0.15)`,
                boxShadow: "0 4px 20px rgba(39,1,21,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(92,30,38,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: palette.deepBurgundy }}>Recommendations</div>
                  <div style={{ fontSize: 11, color: "rgba(92,30,38,0.55)", fontWeight: 600 }}>How to improve</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topic.recommendations.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      borderRadius: 10,
                      backgroundColor: "rgba(39,1,21,0.03)",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 999,
                        backgroundColor: "rgba(92,30,38,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: palette.deepBurgundy,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "rgba(17,17,17,0.75)", lineHeight: 1.55 }}>
                      {r}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary banner */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: "22px 28px",
              border: "1px solid rgba(214,214,214,0.4)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 9l-5 5-2-2-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 4 }}>
                Class Snapshot — {topic.name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.65)", lineHeight: 1.5 }}>
                Based on {topic.questionCount} forum questions, the class engagement score for this topic is{" "}
                <strong style={{ color: topic.engagementScore >= 85 ? palette.sage : topic.engagementScore >= 70 ? "#8B7355" : palette.crimson }}>
                  {topic.engagementScore}%
                </strong>
                . Focus on the concerns above to improve your understanding before the next assessment.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
