import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProfessorSidebar } from "./ProfessorSidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface Appointment {
  id: number;
  studentName: string;
  email: string;
  date: string;
  time: string;
  reason: string;
  status: "confirmed" | "pending" | "completed";
}

const appointments: Appointment[] = [
  { id: 1, studentName: "Sarah Johnson", email: "sarah.j@university.edu", date: "2026-03-20", time: "2:00 PM", reason: "Discuss final project requirements", status: "confirmed" },
  { id: 2, studentName: "Michael Chen", email: "m.chen@university.edu", date: "2026-03-22", time: "10:00 AM", reason: "Questions about midterm exam", status: "confirmed" },
  { id: 3, studentName: "Emily Rodriguez", email: "emily.r@university.edu", date: "2026-03-21", time: "3:30 PM", reason: "Help with recursion concepts", status: "pending" },
  { id: 4, studentName: "David Kim", email: "david.kim@university.edu", date: "2026-03-23", time: "11:00 AM", reason: "Career opportunities discussion", status: "confirmed" },
  { id: 5, studentName: "Jessica Lee", email: "jessica.l@university.edu", date: "2026-03-24", time: "1:00 PM", reason: "Assignment 3 clarification", status: "pending" },
  { id: 6, studentName: "Ryan Martinez", email: "ryan.m@university.edu", date: "2026-03-25", time: "4:00 PM", reason: "Resume review and internship advice", status: "confirmed" },
  { id: 7, studentName: "Olivia Brown", email: "olivia.b@university.edu", date: "2026-03-19", time: "9:30 AM", reason: "Data structures extra help", status: "completed" },
  { id: 8, studentName: "James Wilson", email: "j.wilson@university.edu", date: "2026-03-27", time: "2:30 PM", reason: "Research opportunities in AI", status: "confirmed" },
];

export function CalendarPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 17));
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const confirmedCount = appointments.filter(a => a.status === "confirmed").length;
  const pendingCount = appointments.filter(a => a.status === "pending").length;

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return palette.sage;
      case "pending": return "#FFA500";
      case "completed": return "#6C757D";
      default: return palette.crimson;
    }
  };

  const renderMonthView = () => {
    const days = [];
    const totalSlots = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - firstDayOfMonth + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
      const dayAppointments = isCurrentMonth ? getAppointmentsForDate(date) : [];
      const isToday = isCurrentMonth && dayNumber === 17;

      days.push(
        <div
          key={i}
          style={{
            minHeight: 110,
            border: "1px solid rgba(214,214,214,0.25)",
            padding: "10px",
            backgroundColor: isCurrentMonth ? (isToday ? "rgba(162,34,55,0.03)" : "#fff") : "rgba(214,214,214,0.06)",
            cursor: isCurrentMonth ? "pointer" : "default",
          }}
        >
          {isCurrentMonth && (
            <>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: isToday ? 900 : 600,
                  color: isToday ? palette.crimson : palette.deepBurgundy,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isToday ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: palette.crimson,
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {dayNumber}
                  </span>
                ) : dayNumber}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {dayAppointments.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "4px 8px",
                      backgroundColor: getStatusColor(apt.status),
                      color: "white",
                      borderRadius: 6,
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {apt.time} · {apt.studentName.split(" ")[0]}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: palette.crimson }}>
                    +{dayAppointments.length - 2} more
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          backgroundColor: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(214,214,214,0.3)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
        }}
      >
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              padding: "14px",
              backgroundColor: palette.darkest,
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(2026, 2, 16);
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.getDate() === 17;

      weekDays.push(
        <div key={i} style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              padding: "14px",
              backgroundColor: isToday ? palette.crimson : palette.darkest,
              color: "white",
              textAlign: "center",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
              {dayNames[date.getDay()]}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{date.getDate()}</div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(214,214,214,0.3)",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              padding: "12px 8px",
              minHeight: 280,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {dayAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setSelectedAppointment(apt)}
                style={{
                  padding: "10px",
                  backgroundColor: getStatusColor(apt.status),
                  color: "white",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 2 }}>{apt.time}</div>
                <div style={{ opacity: 0.9, fontSize: 10 }}>{apt.studentName}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", gap: 10 }}>
        {weekDays}
      </div>
    );
  };

  const renderDayView = () => {
    const today = new Date(2026, 2, 17);
    const todayAppointments = getAppointmentsForDate(today);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(214,214,214,0.3)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            padding: "24px 32px",
            background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
            color: "white",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>
            {dayNames[today.getDay()]}, March {today.getDate()}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4, opacity: 0.85 }}>
            {todayAppointments.length} appointment{todayAppointments.length !== 1 ? "s" : ""} scheduled
          </div>
        </div>
        <div style={{ padding: "16px 24px" }}>
          {hours.map((hour) => {
            const timeStr = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`;
            const hourAppointments = todayAppointments.filter((apt) => {
              const aptHour = parseInt(apt.time.split(":")[0]);
              const isPM = apt.time.includes("PM");
              const hour24 = isPM && aptHour !== 12 ? aptHour + 12 : !isPM && aptHour === 12 ? 0 : aptHour;
              return hour24 === hour;
            });

            return (
              <div
                key={hour}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: 16,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(214,214,214,0.2)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(92,30,38,0.45)", paddingTop: 4 }}>
                  {timeStr}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {hourAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      style={{
                        padding: "14px 18px",
                        backgroundColor: getStatusColor(apt.status),
                        color: "white",
                        borderRadius: 12,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
                        {apt.time} · {apt.studentName}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}>{apt.reason}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, opacity: 0.75 }}>{apt.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
      <ProfessorSidebar activeId="calendar" groupName={groupName} />

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
            Schedule
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
            Appointment Calendar
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(92,30,38,0.55)",
              marginBottom: 52,
            }}
          >
            Manage your student meetings and schedule
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Total Appointments", value: appointments.length, color: palette.crimson },
              { label: "Confirmed", value: confirmedCount, color: palette.sage },
              { label: "Pending", value: pendingCount, color: "#FFA500" },
              { label: "Completed", value: appointments.filter(a => a.status === "completed").length, color: "#6C757D" },
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

        {/* Calendar Controls */}
        <div style={{ padding: "32px 64px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={previousMonth}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#fff",
                  border: "1.5px solid rgba(214,214,214,0.5)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <ChevronLeft size={18} color={palette.deepBurgundy} />
              </button>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: palette.darkest,
                  letterSpacing: -0.8,
                  minWidth: 240,
                }}
              >
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button
                onClick={nextMonth}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#fff",
                  border: "1.5px solid rgba(214,214,214,0.5)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <ChevronRight size={18} color={palette.deepBurgundy} />
              </button>
            </div>

            {/* View Toggle */}
            <div
              style={{
                display: "flex",
                backgroundColor: "#fff",
                padding: 4,
                borderRadius: 14,
                border: "1.5px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                gap: 4,
              }}
            >
              {(["month", "week", "day"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "8px 22px",
                    backgroundColor: view === v ? palette.crimson : "transparent",
                    color: view === v ? "white" : palette.deepBurgundy,
                    border: "none",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 150ms ease",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginBottom: 20,
              padding: "12px 20px",
              backgroundColor: "#fff",
              borderRadius: 12,
              border: "1px solid rgba(214,214,214,0.25)",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}
          >
            {[
              { label: "Confirmed", color: palette.sage },
              { label: "Pending", color: "#FFA500" },
              { label: "Completed", color: "#6C757D" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: 4 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Calendar Views */}
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </div>

        {/* Bottom Banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "40px 64px",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            {decodeURIComponent(groupName || "")}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
            {confirmedCount} confirmed meetings this month.
          </div>
        </div>
      </main>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div
          onClick={() => setSelectedAppointment(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              overflow: "hidden",
              maxWidth: 480,
              width: "90%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ height: 6, backgroundColor: getStatusColor(selectedAppointment.status) }} />
            <div style={{ padding: "32px" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: palette.darkest, letterSpacing: -0.8, marginBottom: 24 }}>
                Appointment Details
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Student
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: palette.darkest, marginBottom: 2 }}>
                    {selectedAppointment.studentName}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>
                    {selectedAppointment.email}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Date & Time
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: palette.deepBurgundy }}>
                    {new Date(selectedAppointment.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at {selectedAppointment.time}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Reason
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: palette.deepBurgundy, fontStyle: "italic" }}>
                    "{selectedAppointment.reason}"
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Status
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      backgroundColor: getStatusColor(selectedAppointment.status),
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 8,
                      textTransform: "capitalize",
                    }}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                style={{
                  marginTop: 24,
                  width: "100%",
                  padding: "14px",
                  background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
