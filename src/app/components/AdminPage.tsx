import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { api } from "../../lib/api";
import type { AdminMetrics, QueueHealth, AIUsageSummary } from "../../lib/api";

const p = { crimson: "#a22237", sage: "#7A9B76" } as const;

function MetricTile({ label, value, sub, accent, icon }: { label: string; value: string | number; sub?: string; accent?: string; icon?: string }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      {icon && <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || "#111", letterSpacing: -0.8, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.06)", overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} />
    </div>
  );
}

// Sparkline using SVG
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = 40;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={p.crimson} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Request Type Breakdown ───────────────────────────────────────────────────
function RequestTypeTable({ rows }: { rows: AdminMetrics['requestsByType'] }) {
  if (!rows.length) return <div style={{ fontSize: 13, color: "#888", padding: "20px 0" }}>No data yet.</div>;
  const maxCount = Math.max(...rows.map(r => r.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(r => (
        <div key={r.request_type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 160, fontSize: 13, fontWeight: 600, color: "#333", flexShrink: 0 }}>{r.request_type}</div>
          <MiniBar pct={(r.count / maxCount) * 100} color={p.crimson} />
          <div style={{ width: 40, fontSize: 13, fontWeight: 700, color: "#111", textAlign: "right" }}>{r.count}</div>
          <div style={{ width: 70, fontSize: 12, color: "#888" }}>{r.avg_latency ? `${Math.round(r.avg_latency)}ms` : '—'}</div>
          {r.errors > 0 && <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>{r.errors} err</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Daily Activity Chart ─────────────────────────────────────────────────────
function ActivityChart({ data }: { data: AdminMetrics['dailyActivity'] }) {
  if (!data.length) return <div style={{ fontSize: 13, color: "#888" }}>No activity yet.</div>;
  const maxReqs = Math.max(...data.map(d => d.requests), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {data.map(d => (
        <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 0 }}>
          <div style={{ width: "100%", backgroundColor: p.crimson, borderRadius: "3px 3px 0 0", opacity: 0.85, height: `${(d.requests / maxReqs) * 64}px`, minHeight: 2 }} title={`${d.requests} requests`} />
          {d.errors > 0 && <div style={{ width: "100%", backgroundColor: "#dc2626", borderRadius: "0 0 3px 3px", height: 3 }} />}
          <div style={{ fontSize: 9, color: "#999", whiteSpace: "nowrap", overflow: "hidden" }}>{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Queue Health Alerts ──────────────────────────────────────────────────────
function HealthAlert({ icon, label, value, urgent }: { icon: string; label: string; value: number; urgent?: boolean }) {
  if (value === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", backgroundColor: urgent ? "rgba(220,38,38,0.05)" : "rgba(245,158,11,0.05)", border: `1px solid ${urgent ? "rgba(220,38,38,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1, fontSize: 13, color: "#333" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: urgent ? "#dc2626" : "#f59e0b" }}>{value}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AdminPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [health, setHealth] = useState<QueueHealth | null>(null);
  const [serverHealth, setServerHealth] = useState<{ status: string; ai_enabled: boolean; version: string } | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [m, h, s, u] = await Promise.all([
      api.admin.metrics().catch(() => null),
      api.admin.queueHealth().catch(() => null),
      api.health().catch(() => null),
      api.admin.aiUsage().catch(() => null),
    ]);
    setMetrics(m);
    setHealth(h);
    setServerHealth(s);
    setAiUsage(u);
    setLastUpdated(new Date());
    setLoading(false);
  }

  const totalAlerts = (health?.unresolved || 0) + (health?.criticalClusters || 0) + (health?.pendingReview || 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f8f8", fontFamily: "Inter, system-ui, sans-serif" }}>
      <ProfessorSidebar activeId="admin" groupName={groupName} />
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <div style={{ backgroundColor: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "28px 40px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.crimson, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>System Observability</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: -0.5, margin: 0 }}>Admin Dashboard</h1>
              <p style={{ fontSize: 14, color: "#888", marginTop: 6 }}>
                AI request monitoring, workflow health, and system metrics.
                {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {serverHealth && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: "rgba(122,155,118,0.1)", borderRadius: 8, border: "1px solid rgba(122,155,118,0.25)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: p.sage }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: p.sage }}>v{serverHealth.version || '2.0'} online</span>
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>AI: {serverHealth.ai_enabled ? 'enabled' : 'disabled'}</span>
                </div>
              )}
              <button onClick={loadData} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", backgroundColor: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 40px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>Loading metrics…</div>
          ) : (
            <>
              {/* Queue health alerts */}
              {health && totalAlerts > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>⚠ Action Required</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <HealthAlert icon="🔴" label="Unresolved escalations in workflow queue" value={health.unresolved} urgent />
                    <HealthAlert icon="🟠" label="Critical confusion clusters without intervention" value={health.criticalClusters} urgent />
                    <HealthAlert icon="🟡" label="AI answers pending professor review" value={health.pendingReview} />
                    <HealthAlert icon="📝" label="Draft interventions not yet sent" value={health.draftInterventions} />
                  </div>
                </div>
              )}

              {/* Live AI spend & caps (cost controls) */}
              {aiUsage && (
                <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "22px 26px", border: "1px solid rgba(0,0,0,0.07)", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>Live AI Spend &amp; Caps</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color: aiUsage.aiEnabled ? p.sage : "#888", backgroundColor: aiUsage.aiEnabled ? "rgba(122,155,118,0.12)" : "rgba(0,0,0,0.05)" }}>
                      {aiUsage.aiEnabled ? "LIVE AI ON" : "LIVE AI OFF"}
                    </span>
                    {aiUsage.publicDemoMode && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color: "#b45309", backgroundColor: "rgba(245,158,11,0.12)" }}>PUBLIC DEMO MODE</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Defense-in-depth budget + rate caps. Estimated from token usage.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                    <MetricTile label="Spend Today" value={`$${aiUsage.todaySpendUsd.toFixed(4)}`} sub={`of $${aiUsage.dailyBudgetUsd.toFixed(2)} budget`} accent={p.crimson} />
                    <MetricTile label="Remaining Today" value={`$${aiUsage.remainingDailyUsd.toFixed(4)}`} accent={p.sage} />
                    <MetricTile label="Spend This Month" value={`$${aiUsage.monthlySpendUsd.toFixed(4)}`} sub={`of $${aiUsage.monthlyBudgetUsd.toFixed(2)} budget`} />
                    <MetricTile label="AI Calls Today" value={aiUsage.todayCalls} />
                    <MetricTile label="Blocked Today" value={aiUsage.blockedToday} accent={aiUsage.blockedToday > 0 ? "#dc2626" : "#111"} sub="hit a cap" />
                  </div>
                  {aiUsage.dailyBudgetUsd > 0 && (
                    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "#888", width: 110 }}>Daily budget used</span>
                      <MiniBar pct={(aiUsage.todaySpendUsd / aiUsage.dailyBudgetUsd) * 100} color={p.crimson} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#111", width: 40, textAlign: "right" }}>{Math.round((aiUsage.todaySpendUsd / aiUsage.dailyBudgetUsd) * 100)}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* AI metrics summary */}
              {metrics && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
                    <MetricTile icon="🤖" label="Total AI Requests" value={metrics.totalRequests.toLocaleString()} sub="all time" />
                    <MetricTile icon="📈" label="Requests (24h)" value={metrics.requests24h} accent={p.crimson} />
                    <MetricTile icon="⚡" label="Avg Latency" value={metrics.avgLatency ? `${metrics.avgLatency}ms` : '—'} sub="7-day window" />
                    <MetricTile icon="❌" label="Errors (7d)" value={metrics.failedRequests} accent={metrics.failedRequests > 0 ? "#dc2626" : "#111"} />
                    <MetricTile icon="🎯" label="Escalation Rate" value={`${metrics.escalationRate}%`} sub="of all questions" />
                    <MetricTile icon="♻️" label="Duplicate Rate" value={`${metrics.duplicateRate}%`} accent={p.sage} sub="auto-routed" />
                  </div>

                  {/* Charts row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                    <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "24px 26px", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>AI Request Volume</div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Last 7 days · bar height = requests</div>
                      <ActivityChart data={metrics.dailyActivity} />
                    </div>

                    <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "24px 26px", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>Requests by Type</div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>7-day breakdown with avg latency</div>
                      <RequestTypeTable rows={metrics.requestsByType} />
                    </div>
                  </div>

                  {/* Token usage */}
                  <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "24px 26px", border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 16 }}>Resource Usage (7d)</div>
                    <div style={{ display: "flex", gap: 32 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Total Tokens Used</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{metrics.totalTokens.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Avg Tokens/Request</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>
                          {metrics.totalRequests > 0 ? Math.round(metrics.totalTokens / metrics.totalRequests) : '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Success Rate</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: p.sage }}>
                          {metrics.totalRequests > 0 ? `${Math.round(((metrics.totalRequests - metrics.failedRequests) / metrics.totalRequests) * 100)}%` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!metrics && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>No metrics yet</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>AI metrics will appear here as the system processes requests.</div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
