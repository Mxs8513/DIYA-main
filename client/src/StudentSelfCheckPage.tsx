import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface Improvement {
  section: string;
  suggestion: string;
}

interface GradeReport {
  id: number;
  assignmentName: string;
  rubricName: string;
  potentialGrade: string;
  letterGrade: string;
  improvements: Improvement[];
  timestamp: Date;
}

const mockImprovements: Improvement[][] = [
  [
    { section: "Thesis Statement", suggestion: "Your thesis is too broad. Narrow it down to a specific argument that can be supported with evidence from the text." },
    { section: "Evidence & Citations", suggestion: "You reference sources but don't properly cite them in APA format. Add in-text citations for each claim." },
    { section: "Conclusion", suggestion: "The conclusion simply restates the introduction. Synthesize your arguments and explain the broader implications." },
  ],
  [
    { section: "Code Structure", suggestion: "Functions exceed 40 lines. Break them into smaller, single-responsibility helper functions for readability." },
    { section: "Edge Cases", suggestion: "Your solution doesn't handle empty input or negative numbers. Add validation checks at the start of each function." },
    { section: "Documentation", suggestion: "Missing docstrings on public methods. Add brief descriptions of parameters and return values." },
    { section: "Testing", suggestion: "Only 2 of 5 required test cases are covered. Add tests for boundary conditions and error paths." },
  ],
  [
    { section: "Methodology", suggestion: "The experimental setup lacks a control group. Describe how you isolated the variable being tested." },
    { section: "Data Analysis", suggestion: "Raw data is presented but not analyzed. Include statistical measures like mean, standard deviation, and p-values." },
    { section: "Figures & Tables", suggestion: "Graphs are missing axis labels and units. Each figure should have a descriptive caption." },
  ],
];

function generateMockReport(assignmentName: string, rubricName: string): GradeReport {
  const grades = [
    { potentialGrade: "92/100", letterGrade: "A-" },
    { potentialGrade: "85/100", letterGrade: "B" },
    { potentialGrade: "78/100", letterGrade: "C+" },
    { potentialGrade: "88/100", letterGrade: "B+" },
    { potentialGrade: "95/100", letterGrade: "A" },
  ];
  const pick = grades[Math.floor(Math.random() * grades.length)];
  const improvements = mockImprovements[Math.floor(Math.random() * mockImprovements.length)];
  return {
    id: Date.now(),
    assignmentName,
    rubricName,
    potentialGrade: pick.potentialGrade,
    letterGrade: pick.letterGrade,
    improvements,
    timestamp: new Date(),
  };
}

const demoHistory: GradeReport[] = [
  {
    id: 1,
    assignmentName: "Essay_Draft_1.pdf",
    rubricName: "Essay_Rubric.pdf",
    potentialGrade: "82/100",
    letterGrade: "B-",
    improvements: mockImprovements[0],
    timestamp: new Date("2026-03-08T10:30:00"),
  },
  {
    id: 2,
    assignmentName: "Lab3_Code.py",
    rubricName: "Lab3_Grading_Guide.pdf",
    potentialGrade: "91/100",
    letterGrade: "A-",
    improvements: mockImprovements[1],
    timestamp: new Date("2026-03-05T14:15:00"),
  },
];

const topicDistributionData = [
  { id: "data-structures", label: "Data Structures", count: 24, trend: "rising" as const },
  { id: "projects", label: "Projects & Assignments", count: 22, trend: "rising" as const },
  { id: "oop", label: "Object-Oriented Programming", count: 19, trend: "steady" as const },
  { id: "recursion", label: "Recursion", count: 18, trend: "rising" as const },
  { id: "debugging", label: "Debugging & Testing", count: 15, trend: "rising" as const },
  { id: "algorithms", label: "Algorithms", count: 13, trend: "declining" as const },
  { id: "iteration", label: "Iteration", count: 11, trend: "steady" as const },
];

const trendDot = {
  rising: palette.sage,
  steady: "#8B7355",
  declining: palette.crimson,
};

function TopicDistribution() {
  const navigate = useNavigate();
  const maxCount = Math.max(...topicDistributionData.map((t) => t.count));
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 32, marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy }}>
            Question Distribution by Topic
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(92,30,38,0.55)", marginTop: 2 }}>
            Click a topic to view positives, concerns, and recommendations
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(92,30,38,0.5)",
          }}
        >
          {(["rising", "steady", "declining"] as const).map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: trendDot[t], display: "inline-block" }} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: "20px 24px",
          border: "1px solid rgba(214,214,214,0.4)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.07)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {topicDistributionData.map((topic) => {
          const isHovered = hoveredId === topic.id;
          const pct = Math.round((topic.count / maxCount) * 100);
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => navigate(`/analysis/topic/${topic.id}`)}
              onMouseEnter={() => setHoveredId(topic.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 5 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isHovered ? 800 : 700,
                    color: isHovered ? palette.crimson : palette.deepBurgundy,
                    transition: "color 120ms ease",
                    minWidth: 210,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    textDecoration: isHovered ? "underline" : "none",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      backgroundColor: trendDot[topic.trend],
                      flexShrink: 0,
                    }}
                  />
                  {topic.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(92,30,38,0.45)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                  {topic.count} questions
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ opacity: isHovered ? 1 : 0.3, transition: "opacity 120ms ease", flexShrink: 0 }}
                >
                  <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(39,1,21,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 4,
                    backgroundColor: isHovered ? palette.crimson : trendDot[topic.trend],
                    transition: "background-color 120ms ease",
                    opacity: isHovered ? 1 : 0.7,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StudentSelfCheckPage() {
  const navigate = useNavigate();
  const rubricInputRef = useRef<HTMLInputElement>(null);
  const workInputRef = useRef<HTMLInputElement>(null);

  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<GradeReport | null>(null);
  const [history, setHistory] = useState<GradeReport[]>(demoHistory);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  const handleAnalyze = () => {
    if (!rubricFile || !workFile) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const report = generateMockReport(workFile.name, rubricFile.name);
      setCurrentReport(report);
      setHistory((prev) => [report, ...prev]);
      setIsAnalyzing(false);
      setRubricFile(null);
      setWorkFile(null);
    }, 2000);
  };

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
      <Sidebar activeId="selfcheck" />

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box", overflowY: "auto" }}>
        <div style={{ maxWidth: 1400 }}>
          <div
            style={{
              color: palette.crimson,
              fontSize: 44,
              fontWeight: 850,
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            Self-Check
          </div>

          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 24,
            }}
          />

          {/* upload section */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: "24px 28px",
              border: "1px solid rgba(214,214,214,0.4)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
              marginBottom: 28,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 4 }}>
              Check Your Work
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.6)", marginBottom: 20 }}>
              Upload your assignment rubric and your work to get an AI-estimated grade report.
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              {/* rubric upload */}
              <div style={{ flex: "1 1 240px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 8 }}>
                  Assignment Rubric
                </div>
                <input
                  ref={rubricInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                  onChange={(e) => setRubricFile(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => rubricInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "28px 16px",
                    borderRadius: 12,
                    border: `2px dashed ${rubricFile ? palette.sage : "rgba(39,1,21,0.2)"}`,
                    backgroundColor: rubricFile ? "rgba(122,155,118,0.06)" : "rgba(39,1,21,0.03)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke={rubricFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke={rubricFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: rubricFile ? palette.sage : palette.deepBurgundy }}>
                    {rubricFile ? rubricFile.name : "Click to upload rubric"}
                  </span>
                </button>
              </div>

              {/* work upload */}
              <div style={{ flex: "1 1 240px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 8 }}>
                  Your Work
                </div>
                <input
                  ref={workInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.py,.java,.js,.ts,.c,.cpp,.zip,.png,.jpg"
                  onChange={(e) => setWorkFile(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => workInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "28px 16px",
                    borderRadius: 12,
                    border: `2px dashed ${workFile ? palette.sage : "rgba(39,1,21,0.2)"}`,
                    backgroundColor: workFile ? "rgba(122,155,118,0.06)" : "rgba(39,1,21,0.03)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke={workFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke={workFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: workFile ? palette.sage : palette.deepBurgundy }}>
                    {workFile ? workFile.name : "Click to upload your work"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!rubricFile || !workFile || isAnalyzing}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "none",
                backgroundColor: rubricFile && workFile && !isAnalyzing ? palette.crimson : "rgba(162,34,55,0.3)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: rubricFile && workFile && !isAnalyzing ? "pointer" : "not-allowed",
              }}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze My Work"}
            </button>
          </div>

          {/* loading state */}
          {isAnalyzing && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: "32px 28px",
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                marginBottom: 28,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 8 }}>
                Analyzing your work...
              </div>
              <div style={{ fontSize: 13, color: "rgba(92,30,38,0.5)" }}>
                Comparing your submission against the rubric criteria
              </div>
              <div
                style={{
                  marginTop: 16,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(39,1,21,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "60%",
                    height: "100%",
                    borderRadius: 2,
                    backgroundColor: palette.crimson,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          )}

          {/* current grade report */}
          {currentReport && !isAnalyzing && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: "24px 28px",
                border: `2px solid ${palette.sage}`,
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                marginBottom: 28,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy }}>
                  Grade Report
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(92,30,38,0.5)",
                  }}
                >
                  {currentReport.timestamp.toLocaleDateString()} at{" "}
                  {currentReport.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                <div
                  style={{
                    flex: "0 0 auto",
                    padding: "16px 24px",
                    borderRadius: 12,
                    backgroundColor: "rgba(122,155,118,0.1)",
                    border: `1px solid ${palette.sage}`,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: palette.sage, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                    Potential Grade
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: palette.deepBurgundy }}>
                    {currentReport.letterGrade}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>
                    {currentReport.potentialGrade}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(39,1,21,0.05)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: palette.deepBurgundy,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinejoin="round" /></svg>
                      {currentReport.assignmentName}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(122,155,118,0.08)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: palette.sage,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke={palette.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={palette.sage} strokeWidth="2" strokeLinejoin="round" /></svg>
                      {currentReport.rubricName}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 800, color: palette.crimson, marginBottom: 12 }}>
                Areas for Improvement
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentReport.improvements.map((imp, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      backgroundColor: "rgba(162,34,55,0.04)",
                      border: "1px solid rgba(162,34,55,0.1)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 4 }}>
                      {imp.section}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(17,17,17,0.7)", lineHeight: 1.5 }}>
                      {imp.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* topic distribution section */}
          <TopicDistribution />

          {/* history section */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 14 }}>
              Past Checks
            </div>

            {history.length === 0 && (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 22,
                  border: "1px solid rgba(214,214,214,0.3)",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                  color: "rgba(92,30,38,0.5)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                No past checks yet. Upload your first assignment above to get started.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map((report) => {
                const isExpanded = expandedHistoryId === report.id;
                return (
                  <div
                    key={report.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 14,
                      border: isExpanded ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedHistoryId(isExpanded ? null : report.id)}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            backgroundColor: "rgba(122,155,118,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            fontWeight: 900,
                            color: palette.deepBurgundy,
                          }}
                        >
                          {report.letterGrade}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: palette.deepBurgundy }}>
                            {report.assignmentName}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginTop: 2 }}>
                            {report.timestamp.toLocaleDateString()} · {report.potentialGrade}
                          </div>
                        </div>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}
                      >
                        <path d="M6 9l6 6 6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: "0 20px 18px" }}>
                        <div style={{ height: 1, backgroundColor: "rgba(39,1,21,0.08)", marginBottom: 14 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: palette.crimson, marginBottom: 10 }}>
                          Areas for Improvement
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {report.improvements.map((imp, i) => (
                            <div
                              key={i}
                              style={{
                                padding: "12px 14px",
                                borderRadius: 8,
                                backgroundColor: "rgba(162,34,55,0.04)",
                                border: "1px solid rgba(162,34,55,0.08)",
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 3 }}>
                                {imp.section}
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(17,17,17,0.65)", lineHeight: 1.5 }}>
                                {imp.suggestion}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
