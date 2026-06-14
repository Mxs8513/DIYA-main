import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../../lib/api";
import type { AnalysisResult } from "../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const staticTopicData = [
  { id: "topic-1", name: "Recursion & Iteration", value: 28, status: "needs-attention" },
  { id: "topic-2", name: "Data Structures", value: 22, status: "proficient" },
  { id: "topic-3", name: "Development Environment", value: 18, status: "needs-attention" },
  { id: "topic-4", name: "Exam Preparation", value: 14, status: "needs-attention" },
];

const COLORS = {
  "needs-attention": "#DC3545",
  "proficient": "#7A9B76",
};

const staticInsights = [
  { topic: "Recursion & Iteration", status: "needs-attention", insight: "High volume of questions indicates students struggling with fundamental concepts. Consider dedicating extra lecture time or hosting a review session.", recommendation: "Schedule 2-hour workshop on recursion patterns and practice problems", questions: 18 },
  { topic: "Development Environment", status: "needs-attention", insight: "Multiple setup-related questions suggest initial configuration barriers. Many students may be falling behind due to technical issues.", recommendation: "Create step-by-step setup guide with video walkthrough", questions: 10 },
  { topic: "Exam Preparation", status: "needs-attention", insight: "Students seeking clarification on exam scope and format. Proactive communication could reduce anxiety and improve performance.", recommendation: "Release comprehensive study guide 2 weeks before exam date", questions: 8 },
  { topic: "Data Structures", status: "proficient", insight: "Students demonstrating strong understanding with mostly clarification questions. This topic is well-covered in current curriculum.", recommendation: "Continue current teaching approach", questions: 5 },
];

export function AnalysisPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const topicData = aiResult
    ? aiResult.topics.map((t, i) => ({ id: t.id || `ai-${i}`, name: t.name, value: t.count, status: t.status }))
    : staticTopicData;
  const aiInsights = aiResult
    ? aiResult.topics.map(t => ({ topic: t.name, status: t.status, insight: t.insight, recommendation: t.recommendation, questions: t.count }))
    : staticInsights;

  const needsAttentionCount = topicData.filter(t => t.status === "needs-attention").length;

  const handleGenerateAI = async () => {
    if (!groupName) return;
    setLoadingAI(true);
    setAiError(null);
    try {
      const result = await api.ai.analysis(groupName);
      setAiResult(result);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setLoadingAI(false);
    }
  };

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
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: palette.crimson,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            AI-Powered Insights
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            Course Analysis
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(92,30,38,0.55)",
              marginBottom: 52,
            }}
          >
            Insights derived from student questions and engagement patterns
          </div>

          {/* AI Refresh button */}
          <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={loadingAI}
              style={{
                padding: "10px 22px", borderRadius: 10, border: "none", cursor: loadingAI ? "not-allowed" : "pointer",
                backgroundColor: loadingAI ? "rgba(162,34,55,0.3)" : palette.crimson, color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              {loadingAI ? "Generating AI Analysis…" : aiResult ? "Refresh AI Analysis" : "Generate Live AI Analysis"}
            </button>
            {aiResult && (
              <span style={{ fontSize: 12, color: palette.sage, fontWeight: 600 }}>
                ✓ Live AI data · {aiResult.total_questions} questions analyzed
              </span>
            )}
            {aiError && (
              <span style={{ fontSize: 12, color: palette.crimson, fontWeight: 600 }}>
                ⚠ {aiError}
              </span>
            )}
            {!aiResult && !loadingAI && (
              <span style={{ fontSize: 12, color: "rgba(92,30,38,0.5)", fontWeight: 500 }}>
                Showing demo data · Start backend &amp; add API key for live AI
              </span>
            )}
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Questions Analyzed", value: aiResult?.total_questions ?? 82, color: palette.crimson },
              { label: "Topics Identified", value: topicData.length, color: palette.sage },
              { label: "Need Attention", value: needsAttentionCount, color: "#DC3545" },
              { label: "Students Engaged", value: 128, color: palette.deepBurgundy },
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
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: -1.5,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(92,30,38,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts + Summary */}
        <div style={{ padding: "48px 64px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 40 }}>
            {/* Pie Chart Card */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.crimson }} />
              <div style={{ padding: "28px 32px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 8 }}>
                  Question Distribution
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.5)", marginBottom: 24 }}>
                  Click a segment to explore that topic
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topicData.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={COLORS[entry.status as keyof typeof COLORS]}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/analysis/${groupName}/topic/${entry.id}`)}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, backgroundColor: "#DC3545", borderRadius: 4 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>Needs Attention</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, backgroundColor: palette.sage, borderRadius: 4 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>Proficient</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary Card */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "28px 32px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 24 }}>
                  AI Summary
                </div>

                <div
                  style={{
                    padding: "18px 20px",
                    backgroundColor: "rgba(162,34,55,0.04)",
                    borderLeft: `4px solid ${palette.crimson}`,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy, lineHeight: 1.7 }}>
                    Based on <strong>82 student questions</strong> analyzed over 2 weeks, the AI identified <strong>3 critical areas</strong> requiring immediate attention.
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  Priority Topics
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {[
                    { name: "Recursion & Iteration", count: 18, color: "#DC3545" },
                    { name: "Dev Environment Setup", count: 10, color: "#DC3545" },
                    { name: "Exam Preparation", count: 8, color: "#DC3545" },
                  ].map((item) => (
                    <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: palette.deepBurgundy }}>{item.name}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.count}</span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: "14px 16px",
                    backgroundColor: "rgba(122,155,118,0.08)",
                    borderLeft: `4px solid ${palette.sage}`,
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: palette.sage, marginBottom: 6 }}>✓ Positive Indicators</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.6 }}>
                    Data Structures comprehension is strong. Career-focused questions indicate high student engagement.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Topic Insights */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -1,
              marginBottom: 24,
            }}
          >
            Topic Insights
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {aiInsights.map((insight, idx) => {
              const isNeedsAttention = insight.status === "needs-attention";
              const accentColor = isNeedsAttention ? "#DC3545" : palette.sage;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ height: 5, backgroundColor: accentColor }} />
                  <div style={{ padding: "24px 28px 28px" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <button
                        type="button"
                        onClick={() => {
                          const t = topicData.find(t => t.name === insight.topic);
                          if (t) navigate(`/analysis/${groupName}/topic/${t.id}`);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          fontSize: 17,
                          fontWeight: 800,
                          color: palette.darkest,
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          textUnderlineOffset: 3,
                          fontFamily: "inherit",
                          letterSpacing: -0.3,
                          textAlign: "left",
                        }}
                      >
                        {insight.topic}
                      </button>
                      <span
                        style={{
                          padding: "4px 12px",
                          backgroundColor: isNeedsAttention ? "rgba(220,53,69,0.1)" : "rgba(122,155,118,0.12)",
                          color: accentColor,
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 8,
                          textTransform: "uppercase" as const,
                          letterSpacing: 0.5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isNeedsAttention ? "⚠ Attention" : "✓ Strong"}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 900, color: accentColor }}>
                        {insight.questions}
                      </span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.65, marginBottom: 16 }}>
                      {insight.insight}
                    </div>

                    <div
                      style={{
                        padding: "12px 16px",
                        backgroundColor: isNeedsAttention ? "rgba(220,53,69,0.04)" : "rgba(122,155,118,0.06)",
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                        Recommended Action
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>
                        {insight.recommendation}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const t = topicData.find(t => t.name === insight.topic);
                        if (t) navigate(`/analysis/${groupName}/topic/${t.id}`);
                      }}
                      style={{
                        marginTop: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: palette.crimson,
                        fontFamily: "inherit",
                      }}
                    >
                      View Full Analysis
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "40px 64px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            D.I.Y.A Analysis Engine
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>
            {needsAttentionCount} topic{needsAttentionCount !== 1 ? "s" : ""} need your attention.
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
            Click any topic above to see detailed class insights, concerns, and recommendations.
          </div>
        </div>
      </main>
    </div>
  );
}
