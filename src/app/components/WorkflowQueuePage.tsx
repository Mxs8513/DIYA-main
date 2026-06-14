import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { api } from "../../lib/api";
import type { WorkflowItem, WorkflowSummary } from "../../lib/api";

const p = { crimson: "#a22237", burgundy: "#5C1E26", dark: "#270115", sage: "#7A9B76", cream: "#FBF5F0" } as const;

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ score }: { score: number | null | undefined }) {
  if (score == null) return <span style={{ fontSize: 11, color: "#999" }}>—</span>;
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? p.sage : pct >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 6, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
    </div>
  );
}

// ─── Routing Badge ────────────────────────────────────────────────────────────
function RoutingBadge({ decision }: { decision: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    duplicate: { label: "Duplicate", bg: "rgba(245,158,11,0.12)", color: "#d97706" },
    low_confidence: { label: "Low Confidence", bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
    escalated: { label: "Escalated", bg: "rgba(162,34,55,0.1)", color: p.crimson },
    normal: { label: "Normal", bg: "rgba(122,155,118,0.1)", color: p.sage },
  };
  const c = cfg[decision] || cfg.normal;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 6, backgroundColor: c.bg, color: c.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
      {c.label}
    </span>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    escalated: { label: "Needs Review", bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
    processed: { label: "Processed", bg: "rgba(122,155,118,0.1)", color: p.sage },
    resolved: { label: "Resolved", bg: "rgba(59,130,246,0.1)", color: "#2563eb" },
    auto_resolved: { label: "Auto-Resolved", bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  };
  const c = cfg[status] || cfg.processed;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 6, backgroundColor: c.bg, color: c.color, fontSize: 11, fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent || "#111", letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Queue Item ───────────────────────────────────────────────────────────────
function QueueItemRow({ item, onAction, loading }: { item: WorkflowItem; onAction: (id: number, action: string, aiStatus?: string) => void; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isEscalated = item.status === 'escalated';

  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: 12, border: `1px solid ${isEscalated ? "rgba(239,68,68,0.2)" : "rgba(0,0,0,0.07)"}`,
      boxShadow: "0 1px 8px rgba(0,0,0,0.04)", overflow: "hidden",
    }}>
      {isEscalated && <div style={{ height: 3, backgroundColor: "#ef4444" }} />}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <RoutingBadge decision={item.routing_decision} />
            <StatusPill status={item.status} />
            {item.topic && (
              <span style={{ fontSize: 11, color: "#888", fontWeight: 600, padding: "2px 8px", backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 4 }}>
                {item.topic}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 3, lineHeight: 1.3 }}>{item.title}</div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
            <span>by {item.student_name}</span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
            {item.confidence_score != null && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Confidence: <ConfidenceBar score={item.confidence_score} />
              </span>
            )}
          </div>
          {item.escalation_reason && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
              ⚠ {item.escalation_reason}
            </div>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2, transition: "transform 150ms", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", color: "#888" }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "12px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Student Question</div>
              <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, backgroundColor: "rgba(0,0,0,0.02)", padding: "10px 14px", borderRadius: 8 }}>{item.body}</div>
            </div>
            {item.ai_answer && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8 }}>AI Draft Answer</div>
                  {item.ai_status && <StatusPill status={item.ai_status === 'pending' ? 'escalated' : item.ai_status === 'verified' ? 'resolved' : 'processed'} />}
                  {item.rag_sources && (() => {
                    try {
                      const sources: string[] = JSON.parse(item.rag_sources);
                      if (sources.length > 0) return (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", padding: "2px 8px", borderRadius: 20 }}>
                          📚 Based on: {sources.join(', ')}
                        </span>
                      );
                    } catch { return null; }
                  })()}
                </div>
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, backgroundColor: "rgba(122,155,118,0.05)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(122,155,118,0.2)" }}>{item.ai_answer}</div>
              </div>
            )}
          </div>

          {isEscalated && (
            <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              <button onClick={() => onAction(item.id, 'approve', 'verified')} disabled={loading} style={actionBtn("#fff", p.sage, "rgba(122,155,118,0.12)")}>
                ✓ Approve Answer
              </button>
              <button onClick={() => onAction(item.id, 'reject', 'rejected')} disabled={loading} style={actionBtn("#fff", "#dc2626", "rgba(239,68,68,0.08)")}>
                ✕ Reject Answer
              </button>
              <button onClick={() => onAction(item.id, 'resolve')} disabled={loading} style={actionBtn("#fff", "#6b7280", "rgba(107,114,128,0.08)")}>
                Mark Reviewed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function actionBtn(color: string, border: string, bg: string): React.CSSProperties {
  return { padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${border}`, backgroundColor: bg, color: border, fontSize: 13, fontWeight: 700, cursor: "pointer" };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function WorkflowQueuePage() {
  const { groupName } = useParams<{ groupName: string }>();
  const [queueItems, setQueueItems] = useState<WorkflowItem[]>([]);
  const [historyItems, setHistoryItems] = useState<WorkflowItem[]>([]);
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupName) return;
    loadData();
  }, [groupName]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const group = await api.groups.byName(groupName!).catch(() => null);
      const id = group?.id ?? groupName;
      if (group) setGroupId(group.id);

      const [q, h, s] = await Promise.all([
        api.workflow.queue(id).catch(() => []),
        api.workflow.history(id).catch(() => []),
        api.workflow.summary(id).catch(() => null),
      ]);
      setQueueItems(q);
      setHistoryItems(h);
      setSummary(s);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(itemId: number, action: string, aiStatus?: string) {
    setActionLoading(true);
    try {
      await api.workflow.resolve(itemId, action, aiStatus);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
    backgroundColor: active ? "#111" : "transparent", color: active ? "#fff" : "#666",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f8f8", fontFamily: "Inter, system-ui, sans-serif" }}>
      <ProfessorSidebar activeId="workflow" groupName={groupName} />
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <div style={{ backgroundColor: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "28px 40px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.crimson, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>AI Workflow Engine</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: -0.5, margin: 0 }}>Workflow Queue</h1>
              <p style={{ fontSize: 14, color: "#666", marginTop: 6 }}>Review AI-escalated questions, approve answers, and resolve routing decisions.</p>
            </div>
            <button onClick={loadData} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", backgroundColor: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ padding: "28px 40px" }}>
          {error && (
            <div style={{ marginBottom: 20, padding: "12px 16px", backgroundColor: "#fff0f2", border: "1px solid #f9a8b4", borderRadius: 8, fontSize: 13, color: p.crimson }}>
              {error} — Start the backend server to enable workflow features.
            </div>
          )}

          {/* Summary row */}
          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
              <SummaryCard label="Needs Review" value={summary.escalated} accent={summary.escalated > 0 ? "#dc2626" : "#111"} sub="escalated items" />
              <SummaryCard label="This Week" value={summary.questionsThisWeek} sub="new questions" />
              <SummaryCard label="AI Accept Rate" value={summary.acceptanceRate != null ? `${summary.acceptanceRate}%` : "—"} accent={p.sage} sub="verified vs rejected" />
              <SummaryCard label="Avg Confidence" value={summary.avgConfidence != null ? `${summary.avgConfidence}%` : "—"} sub="AI self-score" />
              <SummaryCard label="Duplicates Caught" value={summary.duplicates} sub="auto-routed" />
              <SummaryCard label="Approved Library" value={summary.approvedAnswers} sub="reusable answers" />
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, backgroundColor: "#f0f0f0", padding: 4, borderRadius: 10, width: "fit-content" }}>
            <button style={tabStyle(activeTab === 'queue')} onClick={() => setActiveTab('queue')}>
              Needs Review {queueItems.length > 0 && <span style={{ marginLeft: 6, padding: "1px 7px", backgroundColor: "#ef4444", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>{queueItems.length}</span>}
            </button>
            <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
              All Workflow Items
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888", fontSize: 14 }}>Loading workflow data…</div>
          ) : activeTab === 'queue' ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {queueItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#444" }}>Queue is clear</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>No items currently need review.</div>
                </div>
              ) : (
                queueItems.map(item => (
                  <QueueItemRow key={item.id} item={item} onAction={handleAction} loading={actionLoading} />
                ))
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {historyItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#888", fontSize: 14 }}>No workflow history yet.</div>
              ) : (
                historyItems.map(item => (
                  <div key={item.id} style={{ backgroundColor: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <RoutingBadge decision={item.routing_decision} />
                    <StatusPill status={item.status} />
                    {item.topic && <span style={{ fontSize: 11, color: "#888", padding: "2px 8px", backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 4 }}>{item.topic}</span>}
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#333", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    <ConfidenceBar score={item.confidence_score} />
                    <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap" }}>{new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
