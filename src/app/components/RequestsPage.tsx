import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface AppointmentRequest {
  id: number;
  studentName: string;
  email: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  timestamp: string;
}

function buildGoogleCalendarUrl(req: AppointmentRequest): string {
  const dateStr = req.requestedDate.replace(/-/g, "");
  const [timePart, ampm] = req.requestedTime.split(" ");
  const [hourStr, minStr] = timePart.split(":");
  let hour = parseInt(hourStr);
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  const startTime = `${dateStr}T${String(hour).padStart(2, "0")}${minStr}00`;
  const endHour = hour + 1;
  const endTime = `${dateStr}T${String(endHour).padStart(2, "0")}${minStr}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Office Hours — ${req.studentName}`,
    dates: `${startTime}/${endTime}`,
    details: req.reason,
    add: req.email,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookUrl(req: AppointmentRequest): string {
  const [timePart, ampm] = req.requestedTime.split(" ");
  const [hourStr, minStr] = timePart.split(":");
  let hour = parseInt(hourStr);
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  const startISO = `${req.requestedDate}T${String(hour).padStart(2, "0")}:${minStr}:00`;
  const endISO = `${req.requestedDate}T${String(hour + 1).padStart(2, "0")}:${minStr}:00`;
  const params = new URLSearchParams({
    subject: `Office Hours — ${req.studentName}`,
    startdt: startISO,
    enddt: endISO,
    body: req.reason,
    to: req.email,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function RequestsPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [showReschedule, setShowReschedule] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([
    { id: 1, studentName: "Sarah Johnson", email: "sarah.j@university.edu", requestedDate: "2026-03-20", requestedTime: "2:00 PM", reason: "Discuss final project requirements and timeline", timestamp: "1 hour ago" },
    { id: 2, studentName: "Michael Chen", email: "m.chen@university.edu", requestedDate: "2026-03-22", requestedTime: "10:00 AM", reason: "Questions about the midterm exam material", timestamp: "3 hours ago" },
    { id: 3, studentName: "Emily Rodriguez", email: "emily.r@university.edu", requestedDate: "2026-03-21", requestedTime: "3:30 PM", reason: "Need help understanding recursion concepts from last lecture", timestamp: "5 hours ago" },
    { id: 4, studentName: "David Kim", email: "david.kim@university.edu", requestedDate: "2026-03-23", requestedTime: "11:00 AM", reason: "Want to discuss career opportunities in computer science", timestamp: "8 hours ago" },
    { id: 5, studentName: "Jessica Lee", email: "jessica.l@university.edu", requestedDate: "2026-03-24", requestedTime: "1:00 PM", reason: "Need clarification on assignment 3 requirements", timestamp: "12 hours ago" },
    { id: 6, studentName: "Ryan Martinez", email: "ryan.m@university.edu", requestedDate: "2026-03-25", requestedTime: "4:00 PM", reason: "Seeking advice on internship applications and resume review", timestamp: "1 day ago" },
    { id: 7, studentName: "Olivia Brown", email: "olivia.b@university.edu", requestedDate: "2026-03-26", requestedTime: "9:30 AM", reason: "Struggling with data structures concepts, need extra help", timestamp: "1 day ago" },
    { id: 8, studentName: "James Wilson", email: "j.wilson@university.edu", requestedDate: "2026-03-27", requestedTime: "2:30 PM", reason: "Want to discuss research opportunities in AI and machine learning", timestamp: "2 days ago" },
  ]);

  const handleApproveAppointment = (id: number) => {
    setAppointmentRequests(appointmentRequests.filter(req => req.id !== id));
    alert("Appointment approved! Confirmation sent to student.");
  };

  const handleRejectAppointment = (id: number) => {
    setAppointmentRequests(appointmentRequests.filter(req => req.id !== id));
    alert("Appointment rejected.");
  };

  const handleReschedule = (id: number) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select a date and time");
      return;
    }
    setAppointmentRequests(appointmentRequests.filter(req => req.id !== id));
    alert(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
    setShowReschedule(null);
    setRescheduleDate("");
    setRescheduleTime("");
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
      <ProfessorSidebar activeId="requests" groupName={groupName} />

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
            Office Hours
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
            Appointment Requests
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(92,30,38,0.55)",
              marginBottom: 52,
            }}
          >
            Review and schedule student meetings
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Pending Requests", value: appointmentRequests.length, color: palette.crimson },
              { label: "This Week", value: 5, color: palette.sage },
              { label: "Next Week", value: 3, color: palette.deepBurgundy },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: i < 2 ? 40 : 0,
                  marginRight: i < 2 ? 40 : 0,
                  borderRight: i < 2 ? "1px solid rgba(214,214,214,0.5)" : "none",
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

        {/* Requests List */}
        <div style={{ padding: "48px 64px" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -1,
              marginBottom: 28,
            }}
          >
            Incoming Requests
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {appointmentRequests.map((req) => (
              <div key={req.id}>
                <div
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                  <div
                    style={{
                      padding: "24px 32px",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 24,
                      alignItems: "start",
                    }}
                  >
                    {/* Left: Student Info */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 18,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {req.studentName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: palette.darkest, letterSpacing: -0.3 }}>
                            {req.studentName}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>
                            {req.email}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 14px",
                          backgroundColor: "rgba(162,34,55,0.06)",
                          borderRadius: 10,
                          marginBottom: 12,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke={palette.crimson} strokeWidth="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: 14, fontWeight: 700, color: palette.crimson }}>
                          {new Date(req.requestedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })} · {req.requestedTime}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: palette.deepBurgundy,
                          lineHeight: 1.6,
                          fontStyle: "italic",
                          marginBottom: 8,
                        }}
                      >
                        "{req.reason}"
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>
                        Requested {req.timestamp}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                      <button
                        onClick={() => handleApproveAppointment(req.id)}
                        style={{
                          padding: "11px 16px",
                          background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
                          color: "white",
                          border: "none",
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 8px rgba(122,155,118,0.3)",
                        }}
                      >
                        ✓ Accept
                      </button>
                      <a
                        href={buildGoogleCalendarUrl(req)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "9px 12px",
                          borderRadius: 12,
                          backgroundColor: "rgba(66,133,244,0.08)",
                          border: "1.5px solid rgba(66,133,244,0.25)",
                          color: "#4285F4",
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        Google Cal
                      </a>
                      <a
                        href={buildOutlookUrl(req)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "9px 12px",
                          borderRadius: 12,
                          backgroundColor: "rgba(0,120,212,0.07)",
                          border: "1.5px solid rgba(0,120,212,0.22)",
                          color: "#0078D4",
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        Outlook
                      </a>
                      <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "9px 12px",
                          borderRadius: 12,
                          backgroundColor: "rgba(52,168,83,0.08)",
                          border: "1.5px solid rgba(52,168,83,0.25)",
                          color: "#34A853",
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Meet
                      </a>
                      <button
                        onClick={() => setShowReschedule(showReschedule === req.id ? null : req.id)}
                        style={{
                          padding: "9px 16px",
                          background: "transparent",
                          color: palette.crimson,
                          border: "1.5px solid rgba(162,34,55,0.3)",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔄 Reschedule
                      </button>
                      <button
                        onClick={() => handleRejectAppointment(req.id)}
                        style={{
                          padding: "9px 16px",
                          background: "transparent",
                          color: "#DC3545",
                          border: "1.5px solid rgba(220,53,69,0.35)",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reschedule Panel */}
                {showReschedule === req.id && (
                  <div
                    style={{
                      marginTop: 12,
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ height: 4, backgroundColor: palette.crimson }} />
                    <div style={{ padding: "20px 32px" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: palette.darkest, marginBottom: 16 }}>
                        Propose New Time
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 14, alignItems: "end" }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                            Date
                          </label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                            Time
                          </label>
                          <input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        <button
                          onClick={() => handleReschedule(req.id)}
                          style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          Send Proposal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
            {decodeURIComponent(groupName || "")}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>
            {appointmentRequests.length} students waiting to meet with you.
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
            Add to Google Calendar or Outlook with one click.
          </div>
        </div>
      </main>
    </div>
  );
}
