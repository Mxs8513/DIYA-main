import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { api, type Group, type OHRequest } from "../../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(39,1,21,0.15)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  color: "#111",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: palette.deepBurgundy,
  marginBottom: 6,
  display: "block",
};

export function StudentOfficeHours() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [requests, setRequests] = useState<OHRequest[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [meetingType, setMeetingType] = useState<"online" | "in-person" | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    api.groups.list()
      .then(gs => {
        setGroups(gs);
        if (gs.length > 0) {
          const firstId = String(gs[0].id);
          setSelectedGroupId(firstId);
          return api.requests.list(firstId);
        }
        return [] as OHRequest[];
      })
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }, []);

  // Reload requests when selected group changes
  useEffect(() => {
    if (!selectedGroupId) return;
    api.requests.list(selectedGroupId).then(setRequests).catch(() => {});
  }, [selectedGroupId]);

  const canSubmit = selectedGroupId && subject.trim() && description.trim() && date && startTime && meetingType;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    const preferredTime = `${date} ${startTime}${duration ? ` (${duration})` : ""} — ${meetingType === "online" ? "Online" : "In-Person"}`;
    try {
      const newReq = await api.requests.create(selectedGroupId, subject.trim(), description.trim(), preferredTime);
      setRequests(prev => [newReq, ...prev]);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubject("");
    setDescription("");
    setDate("");
    setStartTime("");
    setDuration("");
    setMeetingType("");
    setSubmitted(false);
    setSubmitError("");
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "rgba(39,1,21,0.06)", text: "rgba(39,1,21,0.55)", label: "Pending" },
    approved: { bg: "rgba(122,155,118,0.12)", text: palette.sage, label: "Approved" },
    completed: { bg: "rgba(122,155,118,0.12)", text: palette.sage, label: "Completed" },
    rejected: { bg: "rgba(162,34,55,0.08)", text: palette.crimson, label: "Declined" },
  };

  const confirmedCount = requests.filter(r => r.status === "approved" || r.status === "completed").length;
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <Sidebar activeId="request" />

      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero Section */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "56px 64px 52px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            Student Portal
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            Office Hours
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 52,
            }}
          >
            Request a meeting with your professor or teaching assistant.
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Total Requests", value: requests.length, color: "#fff" },
              { label: "Approved", value: confirmedCount, color: "rgba(255,255,255,0.9)" },
              { label: "Pending", value: pendingCount, color: "rgba(255,255,255,0.9)" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: i < 2 ? 40 : 0,
                  marginRight: i < 2 ? 40 : 0,
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}
              >
                <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "48px 64px 56px" }}>
          {/* Request Form */}
          {!submitted ? (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                maxWidth: 660,
                marginBottom: 40,
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.crimson }} />
              <div style={{ padding: "28px 32px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 4 }}>
                  New Request
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.55)", marginBottom: 24 }}>
                  Fill out the form below to request a meeting.
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Course / Group *</label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    disabled={loadingGroups}
                  >
                    {loadingGroups && <option value="">Loading groups…</option>}
                    {groups.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.name} — {g.professor_name}
                      </option>
                    ))}
                    {!loadingGroups && groups.length === 0 && (
                      <option value="">No groups found — join a group first</option>
                    )}
                  </select>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Subject *</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Help with Assignment 3"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>What is this request for? *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe why you'd like to meet..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Proposed Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Start Time *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select duration</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="60 min">60 min</option>
                      <option value="60+ min">60+ min</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Meeting Type *</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["online", "in-person"] as const).map((type) => {
                      const isSelected = meetingType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMeetingType(type)}
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            borderRadius: 10,
                            border: isSelected ? `2px solid ${palette.sage}` : "1px solid rgba(39,1,21,0.15)",
                            backgroundColor: isSelected ? "rgba(122,155,118,0.08)" : "#fff",
                            color: isSelected ? palette.sage : palette.deepBurgundy,
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            {type === "online" ? (
                              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            ) : (
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                          </svg>
                          {type === "online" ? "Online Meeting" : "In-Person Meeting"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {submitError && (
                  <div style={{ marginBottom: 14, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                    {submitError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: canSubmit ? palette.crimson : "rgba(162,34,55,0.25)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
                    marginTop: 6,
                  }}
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                maxWidth: 660,
                marginBottom: 40,
                textAlign: "center",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "32px 32px" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    backgroundColor: "rgba(122,155,118,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 8 }}>
                  Request Submitted!
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(92,30,38,0.6)", lineHeight: 1.5, marginBottom: 20 }}>
                  Your office hours request has been sent. Your professor will review and respond soon.
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: "12px 28px",
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: palette.crimson,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          )}

          {/* Past requests */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -1,
              marginBottom: 24,
            }}
          >
            Your Requests
          </div>

          {requests.length === 0 && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: "24px 28px",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                color: "rgba(92,30,38,0.5)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              No requests yet. Submit your first one above.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {requests.map((req) => {
              const sc = statusColors[req.status] ?? statusColors.pending;
              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ height: 4, backgroundColor: req.status === "approved" || req.status === "completed" ? palette.sage : req.status === "rejected" ? palette.crimson : "rgba(39,1,21,0.15)" }} />
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: palette.deepBurgundy }}>
                          {req.subject}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginTop: 2 }}>
                          {req.preferred_time}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "4px 12px",
                          borderRadius: 8,
                          backgroundColor: sc.bg,
                          color: sc.text,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        {sc.label}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        backgroundColor: "rgba(39,1,21,0.03)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(17,17,17,0.7)",
                        lineHeight: 1.5,
                      }}
                    >
                      {req.description}
                    </div>

                    {req.scheduled_at && (
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: palette.sage }}>
                        Scheduled: {new Date(req.scheduled_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
