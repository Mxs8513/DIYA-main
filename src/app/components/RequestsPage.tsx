import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { api, type OHRequest } from "../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

// Professor view rows also carry the student's email (joined server-side).
type ProfRequest = OHRequest & { student_email?: string };

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  pending: { text: "Pending", color: palette.crimson, bg: "rgba(162,34,55,0.08)" },
  approved: { text: "Approved", color: "#2f7d32", bg: "rgba(47,125,50,0.1)" },
  rejected: { text: "Declined", color: "#b3261e", bg: "rgba(179,38,30,0.1)" },
  completed: { text: "Completed", color: palette.deepBurgundy, bg: "rgba(92,30,38,0.08)" },
};

// Build a Google Calendar "create event" link from whatever fields we have.
// preferred_time is free text, so this is a convenience pre-fill, not a hard booking.
function buildGoogleCalendarUrl(req: ProfRequest): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Office Hours — ${req.student_name}`,
    details: `${req.subject}\n\n${req.description || ""}\n\nPreferred: ${req.preferred_time || "n/a"}`,
  });
  if (req.student_email) params.set("add", req.student_email);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function RequestsPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const [requests, setRequests] = useState<ProfRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const group = await api.groups.byName(decodeURIComponent(groupName!));
        const list = await api.requests.list(group.id);
        if (active) setRequests(list as ProfRequest[]);
      } catch (e: any) {
        if (active) setError(e?.message || "Could not load requests.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [groupName]);

  async function updateStatus(id: number, status: "approved" | "rejected" | "completed") {
    setBusyId(id);
    const prev = requests;
    // optimistic update
    setRequests(rs => rs.map(r => (r.id === id ? { ...r, status } : r)));
    try {
      await api.requests.update(id, status);
    } catch (e: any) {
      setRequests(prev); // rollback
      setError(e?.message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  const pending = requests.filter(r => r.status === "pending");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, sans-serif", display: "flex" }}>
      <ProfessorSidebar activeId="requests" groupName={groupName} />

      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero */}
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Office Hours</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>Appointment Requests</div>
          <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 52 }}>Review and schedule student meetings</div>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Pending Requests", value: pending.length, color: palette.crimson },
              { label: "Total Requests", value: requests.length, color: palette.sage },
              { label: "Approved", value: requests.filter(r => r.status === "approved").length, color: palette.deepBurgundy },
            ].map((stat, i) => (
              <div key={stat.label} style={{ flex: 1, paddingRight: i < 2 ? 40 : 0, marginRight: i < 2 ? 40 : 0, borderRight: i < 2 ? "1px solid rgba(214,214,214,0.5)" : "none" }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>{loading ? "—" : stat.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ padding: "48px 64px" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: palette.darkest, letterSpacing: -1, marginBottom: 28 }}>Incoming Requests</div>

          {error && (
            <div style={{ backgroundColor: "rgba(179,38,30,0.08)", border: "1px solid rgba(179,38,30,0.25)", color: "#b3261e", padding: "14px 20px", borderRadius: 12, marginBottom: 20, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 120, borderRadius: 20, backgroundColor: "#ece4e8" }} />)}
            </div>
          ) : requests.length === 0 ? (
            <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: "48px 40px", textAlign: "center", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ color: palette.darkest, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>No office-hour requests yet</div>
              <div style={{ color: "rgba(92,30,38,0.5)", fontSize: 14 }}>When students request a meeting, it will appear here.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {requests.map(req => {
                const badge = STATUS_LABEL[req.status] || STATUS_LABEL.pending;
                return (
                  <div key={req.id} style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                    <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
                      {/* Left: info */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, fontWeight: 800 }}>
                            {req.student_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div style={{ fontSize: 17, fontWeight: 800, color: palette.darkest }}>{req.student_name}</div>
                            {req.student_email && <div style={{ fontSize: 13, color: "rgba(92,30,38,0.5)" }}>{req.student_email}</div>}
                          </div>
                          <span style={{ marginLeft: 8, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: badge.color, backgroundColor: badge.bg, textTransform: "uppercase", letterSpacing: 0.5 }}>{badge.text}</span>
                        </div>

                        <div style={{ fontSize: 15, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 6 }}>{req.subject}</div>
                        {req.description && <div style={{ fontSize: 14, color: "rgba(92,30,38,0.7)", lineHeight: 1.6, fontStyle: "italic", marginBottom: 8 }}>"{req.description}"</div>}
                        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.45)" }}>
                          Preferred: {req.preferred_time || "flexible"}
                          {req.scheduled_at ? ` · Scheduled: ${new Date(req.scheduled_at).toLocaleString()}` : ""}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 150 }}>
                        {req.status === "pending" && (
                          <>
                            <button onClick={() => updateStatus(req.id, "approved")} disabled={busyId === req.id}
                              style={{ padding: "11px 16px", background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: busyId === req.id ? 0.6 : 1 }}>
                              ✓ Accept
                            </button>
                            <button onClick={() => updateStatus(req.id, "rejected")} disabled={busyId === req.id}
                              style={{ padding: "9px 16px", background: "transparent", color: "#DC3545", border: "1.5px solid rgba(220,53,69,0.35)", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              ✗ Decline
                            </button>
                          </>
                        )}
                        {req.status === "approved" && (
                          <button onClick={() => updateStatus(req.id, "completed")} disabled={busyId === req.id}
                            style={{ padding: "9px 16px", background: "transparent", color: palette.deepBurgundy, border: "1.5px solid rgba(92,30,38,0.3)", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            Mark Completed
                          </button>
                        )}
                        <a href={buildGoogleCalendarUrl(req)} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 12, backgroundColor: "rgba(66,133,244,0.08)", border: "1.5px solid rgba(66,133,244,0.25)", color: "#4285F4", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                          📅 Google Cal
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Banner */}
        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 64px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{decodeURIComponent(groupName || "")}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>{pending.length} student{pending.length !== 1 ? "s" : ""} waiting to meet with you.</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>Accept or decline — students are notified instantly.</div>
        </div>
      </main>
    </div>
  );
}
