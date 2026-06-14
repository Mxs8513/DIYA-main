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

interface Student {
  id: number;
  name: string;
  email: string;
  status: "active" | "pending";
}

export function EditGroupPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Sarah Johnson", email: "sarah.j@university.edu", status: "active" },
    { id: 2, name: "Michael Chen", email: "m.chen@university.edu", status: "active" },
    { id: 3, name: "Emily Rodriguez", email: "emily.r@university.edu", status: "active" },
    { id: 4, name: "David Kim", email: "david.kim@university.edu", status: "active" },
  ]);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [groupNameEdit, setGroupNameEdit] = useState(decodeURIComponent(groupName || ""));
  const [groupDescription, setGroupDescription] = useState("Introduction to Computer Science — Fall 2026");

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;
    const newStudent: Student = {
      id: students.length + 1,
      name: newStudentName,
      email: newStudentEmail,
      status: "pending",
    };
    setStudents([...students, newStudent]);
    setNewStudentName("");
    setNewStudentEmail("");
    setShowAddStudent(false);
  };

  const handleRemoveStudent = (id: number) => {
    if (confirm("Remove this student from the group?")) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const activeCount = students.filter(s => s.status === "active").length;
  const pendingCount = students.filter(s => s.status === "pending").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <ProfessorSidebar activeId="editgroup" groupName={groupName} />

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
            Group Management
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
            Edit Group
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(92,30,38,0.55)",
              marginBottom: 52,
            }}
          >
            Manage students and group settings
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Total Students", value: students.length, color: palette.crimson },
              { label: "Active", value: activeCount, color: palette.sage },
              { label: "Pending", value: pendingCount, color: "#FFA500" },
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

        {/* Content */}
        <div style={{ padding: "48px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
            {/* Group Info Card */}
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
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 24 }}>
                  Group Information
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(92,30,38,0.5)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 8,
                      }}
                    >
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupNameEdit}
                      onChange={(e) => setGroupNameEdit(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1.5px solid rgba(214,214,214,0.5)",
                        borderRadius: 12,
                        fontSize: 15,
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        outline: "none",
                        color: palette.darkest,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(92,30,38,0.5)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 8,
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: 90,
                        padding: "12px 16px",
                        border: "1.5px solid rgba(214,214,214,0.5)",
                        borderRadius: 12,
                        fontSize: 15,
                        fontFamily: "inherit",
                        resize: "vertical",
                        boxSizing: "border-box",
                        outline: "none",
                        color: palette.darkest,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => alert("Settings saved!")}
                    style={{
                      alignSelf: "flex-start",
                      padding: "12px 24px",
                      background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Card */}
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
                  Group Actions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    style={{
                      padding: "16px 20px",
                      background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: "0 2px 12px rgba(122,155,118,0.3)",
                    }}
                  >
                    ➕ Add Students
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to archive this group?")) {
                        alert("Group archived");
                      }
                    }}
                    style={{
                      padding: "16px 20px",
                      backgroundColor: "transparent",
                      color: "#DC3545",
                      border: "2px solid #DC3545",
                      borderRadius: 14,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#DC3545";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#DC3545";
                    }}
                  >
                    🗄️ Archive Group
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add Student Panel */}
          {showAddStudent && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
                marginBottom: 32,
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "28px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, marginBottom: 20 }}>
                  Add New Student
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      Student Name
                    </label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1.5px solid rgba(214,214,214,0.5)",
                        borderRadius: 12,
                        fontSize: 14,
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="student@university.edu"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1.5px solid rgba(214,214,214,0.5)",
                        borderRadius: 12,
                        fontSize: 14,
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={handleAddStudent}
                    style={{
                      padding: "12px 24px",
                      background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Add Student
                  </button>
                  <button
                    onClick={() => setShowAddStudent(false)}
                    style={{
                      padding: "12px 24px",
                      background: "transparent",
                      color: palette.deepBurgundy,
                      border: "1.5px solid rgba(92,30,38,0.2)",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student List */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ height: 5, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
            <div style={{ padding: "28px 32px 32px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 24 }}>
                Student Roster ({students.length})
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {students.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      backgroundColor: student.status === "active" ? "rgba(122,155,118,0.06)" : "rgba(255,165,0,0.05)",
                      borderRadius: 14,
                      border: `1px solid ${student.status === "active" ? "rgba(122,155,118,0.15)" : "rgba(255,165,0,0.2)"}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: palette.darkest, marginBottom: 3 }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>
                        {student.email}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          padding: "5px 12px",
                          backgroundColor: student.status === "active" ? palette.sage : "#FFA500",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 8,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {student.status}
                      </span>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        style={{
                          padding: "7px 14px",
                          background: "transparent",
                          color: "#DC3545",
                          border: "1.5px solid rgba(220,53,69,0.4)",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#DC3545";
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#DC3545";
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
            {students.length} students enrolled and counting.
          </div>
        </div>
      </main>
    </div>
  );
}
