import { useState } from "react";

type StudentPopUpProps = {
  adminName: string;
  groupName: string;
  onAccept: () => void;
  onDecline: () => void;
};

const palette = {
  burgundy: "#5C1E26",
  sage: "#7A9B76",
  lightGray: "#D6D6D6",
} as const;

export function StudentPopUp({
  adminName = "Prof. A",
  groupName = "CS 1337 — Computer Science I",
  onAccept = () => {},
  onDecline = () => {},
}: StudentPopUpProps) {
  const [hoveredBtn, setHoveredBtn] = useState<"accept" | "decline" | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: "32px 36px",
          width: 420,
          maxWidth: "90vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            backgroundColor: "rgba(122,155,118,0.14)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 18px auto",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={palette.sage} strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" stroke={palette.sage} strokeWidth="2" />
            <path d="M19 8v6m3-3h-6" stroke={palette.sage} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: palette.burgundy,
            marginBottom: 6,
          }}
        >
          Group Invite
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(0,0,0,0.6)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          <span style={{ fontWeight: 700, color: palette.burgundy }}>{adminName}</span>
          {" has invited you to join"}
          <br />
          <span style={{ fontWeight: 700, color: palette.burgundy }}>{groupName}</span>
        </div>

        <div
          style={{
            height: 1,
            backgroundColor: palette.lightGray,
            margin: "0 0 24px 0",
          }}
        />

        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <button
            type="button"
            onClick={onAccept}
            onMouseEnter={() => setHoveredBtn("accept")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 32px",
              borderRadius: 10,
              border: "none",
              backgroundColor: hoveredBtn === "accept" ? "#6b8e68" : palette.sage,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background-color 120ms ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Accept
          </button>

          <button
            type="button"
            onClick={onDecline}
            onMouseEnter={() => setHoveredBtn("decline")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 32px",
              borderRadius: 10,
              border: "none",
              backgroundColor: hoveredBtn === "decline" ? "#9a1c2a" : "#b22534",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background-color 120ms ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
