import { useEffect, useRef, useState, useCallback, type ChangeEvent } from "react";
import { Sidebar } from "./Sidebar";
import { api } from "../../../lib/api";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

function PencilEditIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AvatarCircle({
  size,
  imageUrl,
  emptyLabel,
}: {
  size: number;
  imageUrl: string | null;
  emptyLabel?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundColor: "rgba(120, 120, 120, 0.28)",
        border: "1px solid rgba(39, 1, 21, 0.15)",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span
          style={{
            fontSize: Math.max(11, size / 10),
            fontWeight: 600,
            color: palette.deepBurgundy,
            opacity: 0.65,
            padding: 8,
            textAlign: "center",
          }}
        >
          {emptyLabel ?? "Photo"}
        </span>
      )}
    </div>
  );
}

export function StudentProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState("");
  const [draftStudentName, setDraftStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    api.auth.me().then(user => {
      setStudentName(user.name);
      setDraftStudentName(user.name);
      setEmail(user.email);
    }).catch(() => {});
  }, []);
  const [isEditingName, setIsEditingName] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const draftUrlRef = useRef<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);
  draftUrlRef.current = draftUrl;
  avatarUrlRef.current = avatarUrl;

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  const openEditor = () => {
    setDraftUrl(avatarUrl);
    setDraftFile(avatarFile);
    setEditorOpen(true);
  };

  const revokeIfOrphanDraft = (url: string | null, baseUrl: string | null) => {
    if (url && url.startsWith("blob:") && url !== baseUrl) {
      URL.revokeObjectURL(url);
    }
  };

  const closeEditorDiscard = useCallback(() => {
    const d = draftUrlRef.current;
    const a = avatarUrlRef.current;
    revokeIfOrphanDraft(d, a);
    setEditorOpen(false);
    setDraftUrl(null);
    setDraftFile(null);
  }, []);

  const handleModalFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setDraftFile(file);
    setDraftUrl((prev) => {
      revokeIfOrphanDraft(prev, avatarUrlRef.current);
      return URL.createObjectURL(file);
    });
    event.target.value = "";
  };

  const handleEditorSave = () => {
    if (!draftFile) {
      setEditorOpen(false);
      return;
    }
    if (avatarUrl && avatarUrl !== draftUrl) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarUrl(draftUrl);
    setAvatarFile(draftFile);
    setEditorOpen(false);
    setDraftUrl(null);
    setDraftFile(null);
    // avatar saved locally
  };

  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditorDiscard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen, closeEditorDiscard]);

  const MODAL_AVATAR = 168;
  const PAGE_AVATAR = 120;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <Sidebar activeId="profile" />

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
            Profile
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 52,
            }}
          >
            Manage your personal information and account settings.
          </div>

          {/* Avatar + name display in hero */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <AvatarCircle size={PAGE_AVATAR} imageUrl={avatarUrl} emptyLabel="Add photo" />
              <button
                type="button"
                aria-label="Edit profile photo"
                onClick={(e) => { e.stopPropagation(); openEditor(); }}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.4)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <PencilEditIcon color={palette.deepBurgundy} />
              </button>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>
                {studentName}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
                {email}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "48px 64px 56px" }}>
          <div style={{ maxWidth: 720 }}>
            {/* Basic Information Card */}
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
                  Basic Information
                </div>

                {/* Student Name row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    borderBottom: "1px solid rgba(39,1,21,0.08)",
                    paddingBottom: 16,
                    marginBottom: 16,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>Student Name</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {isEditingName ? (
                      <>
                        <input
                          value={draftStudentName}
                          onChange={(e) => setDraftStudentName(e.target.value)}
                          style={{
                            minWidth: 200,
                            maxWidth: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(39,1,21,0.2)",
                            outline: "none",
                            fontSize: 14,
                          }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const trimmed = draftStudentName.trim();
                            if (!trimmed) return;
                            try {
                              await api.auth.updateProfile({ name: trimmed });
                            } catch { /* ignore */ }
                            setStudentName(trimmed);
                            setDraftStudentName(trimmed);
                            setIsEditingName(false);
                          }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "none",
                            backgroundColor: palette.sage,
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDraftStudentName(studentName); setIsEditingName(false); }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(39,1,21,0.2)",
                            backgroundColor: "transparent",
                            color: palette.deepBurgundy,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{studentName}</span>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(39,1,21,0.2)",
                            backgroundColor: "rgba(255,255,255,0.7)",
                            color: palette.deepBurgundy,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Edit name
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Email row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    borderBottom: "1px solid rgba(39,1,21,0.08)",
                    paddingBottom: 16,
                    marginBottom: 16,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>Email</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{email}</div>
                </div>

                {/* Notifications row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>Notifications</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      aria-pressed={notificationsEnabled}
                      onClick={() => setNotificationsEnabled((v) => !v)}
                      style={{
                        width: 52,
                        height: 30,
                        borderRadius: 999,
                        border: "1px solid rgba(39,1,21,0.2)",
                        backgroundColor: notificationsEnabled ? "rgba(122,155,118,0.95)" : "rgba(140,140,140,0.35)",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 150ms ease",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: notificationsEnabled ? 25 : 3,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          backgroundColor: "#fff",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                          transition: "left 150ms ease",
                        }}
                      />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 13, color: notificationsEnabled ? palette.sage : "rgba(39,1,21,0.55)" }}>
                      {notificationsEnabled ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Photo editor modal */}
      {editorOpen && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(39, 1, 21, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditorDiscard(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-photo-editor-title"
            style={{
              width: "min(400px, 100%)",
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              border: "1px solid rgba(214,214,214,0.5)",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              id="profile-photo-editor-title"
              style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 18 }}
            >
              Update profile photo
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleModalFileChange}
            />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <AvatarCircle size={MODAL_AVATAR} imageUrl={draftUrl} emptyLabel="Preview" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: palette.crimson,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Choose image
                </button>
                <button
                  type="button"
                  onClick={handleEditorSave}
                  disabled={!draftFile}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: `1px solid ${palette.lightGray}`,
                    backgroundColor: draftFile ? palette.sage : "rgba(122,155,118,0.35)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: draftFile ? "pointer" : "not-allowed",
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeEditorDiscard}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: `1px solid rgba(39,1,21,0.2)`,
                    backgroundColor: "transparent",
                    color: palette.deepBurgundy,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
