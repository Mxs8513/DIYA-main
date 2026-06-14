import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { api } from "../../lib/api";
import type { ConfusionCluster, Intervention, InterventionRec } from "../../lib/api";

const p = { crimson: "#a22237", burgundy: "#5C1E26", dark: "#270115", sage: "#7A9B76" } as const;

const SEVERITY_CONFIG = {
  critical: { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Critical" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "High" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Medium" },
  low:      { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "Low" },
};

const STATUS_CONFIG = {
  open:               { color: "#dc2626", bg: "rgba(220,38,38,0.08)", label: "Open" },
  intervention_sent:  { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "Intervened" },
  resolved:           { color: p.sage, bg: "rgba(122,155,118,0.1)", label: "Resolved" },
};

function SeverityBadge({ sev }: { sev: string }) {
  const c = SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.low;
  return <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: c.color, backgroundColor: c.bg }}>{c.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  return <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: c.color, backgroundColor: c.bg }}>{c.label}</span>;
}

// ─── Cluster Card ─────────────────────────────────────────────────────────────
function ClusterCard({ cluster, onIntervene, onResolve }: { cluster: ConfusionCluster; onIntervene: (c: ConfusionCluster) => void; onResolve: (id: number) => void }) {
  const [rec, setRec] = useState<InterventionRec | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const sev = SEVERITY_CONFIG[cluster.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.low;

  const fetchRecommendation = async () => {
    setLoadingRec(true);
    try {
      const { recommendation } = await api.clusters.recommend(cluster.id);
      setRec(recommendation);
    } catch { /* ignore */ }
    setLoadingRec(false);
  };

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 14, border: `1px solid ${cluster.severity === 'critical' ? "rgba(220,38,38,0.2)" : "rgba(0,0,0,0.07)"}`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      {(cluster.severity === 'critical' || cluster.severity === 'high') && (
        <div style={{ height: 3, backgroundColor: sev.color }} />
      )}
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <SeverityBadge sev={cluster.severity} />
              <StatusBadge status={cluster.status} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>{cluster.topic}</h3>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: sev.color, letterSpacing: -1.5, lineHeight: 1 }}>{cluster.question_count}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>questions</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          First seen {new Date(cluster.first_seen).toLocaleDateString()} · Last activity {new Date(cluster.last_seen).toLocaleDateString()}
        </div>

        {rec && (
          <div style={{ padding: "12px 14px", backgroundColor: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>AI Recommendation</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 4 }}>{rec.title}</div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{rec.content}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cluster.status === 'open' && (
            <>
              {!rec && (
                <button onClick={fetchRecommendation} disabled={loadingRec} style={btn("transparent", "#6b7280", "rgba(107,114,128,0.08)")}>
                  {loadingRec ? "Getting AI rec…" : "Get AI Recommendation"}
                </button>
              )}
              <button onClick={() => onIntervene(cluster)} style={btn("transparent", p.crimson, "rgba(162,34,55,0.08)")}>
                Create Intervention
              </button>
            </>
          )}
          {cluster.status !== 'resolved' && (
            <button onClick={() => onResolve(cluster.id)} style={btn("transparent", p.sage, "rgba(122,155,118,0.1)")}>
              Mark Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function btn(bg: string, border: string, hbg: string): React.CSSProperties {
  return { padding: "7px 16px", borderRadius: 8, border: `1.5px solid ${border}`, backgroundColor: bg, color: border, fontSize: 13, fontWeight: 700, cursor: "pointer" };
}

// ─── Create Intervention Modal ────────────────────────────────────────────────
function CreateInterventionModal({
  cluster, groupId, onClose, onCreated,
}: {
  cluster: ConfusionCluster; groupId: number | string; onClose: () => void; onCreated: () => void;
}) {
  const [type, setType] = useState("announcement");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateDraft = async () => {
    setGenLoading(true);
    try {
      const { announcement } = await api.interventions.generateAnnouncement(cluster.id, cluster.topic, `${cluster.question_count} students have asked questions about this topic.`);
      setContent(announcement);
      if (!title) setTitle(`Class Update: ${cluster.topic}`);
    } catch { /* ignore */ }
    setGenLoading(false);
  };

  const handleSave = async () => {
    if (!title || !content) { alert("Title and content required"); return; }
    setSaving(true);
    try {
      await api.interventions.create(groupId, { type, title, content, cluster_id: cluster.id, topic: cluster.topic } as any);
      onCreated();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create intervention');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>Create Intervention</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>For: <strong>{cluster.topic}</strong> ({cluster.question_count} questions)</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#888", fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
              <option value="announcement">Class Announcement</option>
              <option value="review_session">Review Session</option>
              <option value="office_hours">Office Hours Push</option>
              <option value="resource">Resource Link</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={`Addressing: ${cluster.topic}`} style={inputStyle} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Content</label>
              <button onClick={generateDraft} disabled={genLoading} style={{ fontSize: 12, fontWeight: 600, color: p.crimson, border: `1px solid ${p.crimson}`, backgroundColor: "transparent", padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}>
                {genLoading ? "Generating…" : "✨ AI Draft"}
              </button>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Write your message to students…" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "11px", backgroundColor: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save Intervention"}
          </button>
          <button onClick={onClose} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "#666", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", outline: "none" };

// ─── Intervention History Row ─────────────────────────────────────────────────
function InterventionRow({ iv, onStatusChange }: { iv: Intervention; onStatusChange: (id: number, s: string) => void }) {
  const typeIcon: Record<string, string> = { announcement: "📢", review_session: "📚", office_hours: "🕒", resource: "🔗" };
  const effectiveness = iv.effectiveness != null ? Math.round(iv.effectiveness) : null;

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 22, flexShrink: 0 }}>{typeIcon[iv.type] || "📌"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 3 }}>{iv.title}</div>
        <div style={{ fontSize: 12, color: "#888" }}>{new Date(iv.created_at).toLocaleDateString()} · {iv.type.replace(/_/g, ' ')}</div>
      </div>
      {effectiveness != null && (
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: effectiveness > 30 ? p.sage : "#f59e0b" }}>{effectiveness}%</div>
          <div style={{ fontSize: 10, color: "#888" }}>effectiveness</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: iv.status === 'sent' ? "rgba(122,155,118,0.1)" : iv.status === 'tracked' ? "rgba(59,130,246,0.1)" : "rgba(107,114,128,0.1)", color: iv.status === 'sent' ? p.sage : iv.status === 'tracked' ? "#2563eb" : "#6b7280" }}>
          {iv.status}
        </span>
        {iv.status === 'draft' && (
          <button onClick={() => onStatusChange(iv.id, 'sent')} style={{ ...btn("transparent", p.sage, "rgba(122,155,118,0.1)"), fontSize: 12 }}>Mark Sent</button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function InterventionPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const [clusters, setClusters] = useState<ConfusionCluster[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clusters' | 'interventions'>('clusters');
  const [modalCluster, setModalCluster] = useState<ConfusionCluster | null>(null);
  const [groupId, setGroupId] = useState<number | string | null>(null);

  useEffect(() => { if (groupName) loadData(); }, [groupName]);

  async function loadData() {
    setLoading(true);
    try {
      const group = await api.groups.byName(groupName!).catch(() => null);
      const id = group?.id ?? groupName!;
      setGroupId(id);
      const [c, i] = await Promise.all([api.clusters.list(id).catch(() => []), api.interventions.list(id).catch(() => [])]);
      setClusters(c);
      setInterventions(i);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveCluster(clusterId: number) {
    await api.clusters.updateStatus(clusterId, 'resolved').catch(() => {});
    await loadData();
  }

  async function handleInterventionStatusChange(id: number, status: string) {
    await api.interventions.updateStatus(id, status).catch(() => {});
    await loadData();
  }

  const openCount = clusters.filter(c => c.status === 'open').length;
  const criticalCount = clusters.filter(c => c.severity === 'critical' && c.status === 'open').length;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
    backgroundColor: active ? "#111" : "transparent", color: active ? "#fff" : "#666",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f8f8", fontFamily: "Inter, system-ui, sans-serif" }}>
      <ProfessorSidebar activeId="interventions" groupName={groupName} />
      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "28px 40px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.crimson, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Operational Intelligence</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: -0.5, margin: 0 }}>Interventions</h1>
              <p style={{ fontSize: 14, color: "#666", marginTop: 6 }}>
                {criticalCount > 0 && <span style={{ color: "#dc2626", fontWeight: 700 }}>{criticalCount} critical clusters require attention · </span>}
                Track confusion patterns and manage proactive interventions.
              </p>
            </div>
            {openCount > 0 && (
              <div style={{ padding: "12px 20px", backgroundColor: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626", letterSpacing: -1 }}>{openCount}</div>
                <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>open clusters</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "28px 40px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 24, backgroundColor: "#f0f0f0", padding: 4, borderRadius: 10, width: "fit-content" }}>
            <button style={tabStyle(activeTab === 'clusters')} onClick={() => setActiveTab('clusters')}>
              Confusion Clusters {criticalCount > 0 && <span style={{ marginLeft: 6, padding: "1px 7px", backgroundColor: "#dc2626", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>{criticalCount}</span>}
            </button>
            <button style={tabStyle(activeTab === 'interventions')} onClick={() => setActiveTab('interventions')}>
              Intervention History
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>Loading…</div>
          ) : activeTab === 'clusters' ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
              {clusters.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#888", gridColumn: "1/-1" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#444" }}>No confusion clusters yet</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Clusters auto-detect as students post questions.</div>
                </div>
              ) : (
                clusters.map(c => (
                  <ClusterCard key={c.id} cluster={c} onIntervene={setModalCluster} onResolve={handleResolveCluster} />
                ))
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {interventions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>No interventions created yet.</div>
              ) : (
                interventions.map(iv => (
                  <InterventionRow key={iv.id} iv={iv} onStatusChange={handleInterventionStatusChange} />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {modalCluster && groupId && (
        <CreateInterventionModal
          cluster={modalCluster}
          groupId={groupId}
          onClose={() => setModalCluster(null)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}
