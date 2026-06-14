import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

// ─── Animation Hook ────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor" opacity="0" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "AI Self-Check",
    desc: "Upload your assignment rubric and work. Get an instant AI-powered grade estimate with detailed improvement suggestions before submission.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Smart Forum",
    desc: "Post questions to your class forum. AI generates draft answers instantly — professors review and verify before students see them.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Engagement Analytics",
    desc: "Professors get AI-driven insights into which topics students struggle with most, enabling proactive support before issues compound.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Office Hours",
    desc: "Students request office hours with context. Professors approve and schedule directly through Google Calendar or Outlook.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Class Groups",
    desc: "Organized class spaces where students and professors collaborate. Join with an invite code and stay connected with your entire class.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Verified Answers",
    desc: "Every AI-generated answer is reviewed by a professor before being shared. Students always get accurate, professor-approved guidance.",
  },
];

const studentSteps = [
  { num: "01", title: "Join your class", body: "Enter the invite code from your professor to join your class group instantly." },
  { num: "02", title: "Ask anything", body: "Post questions to the class forum and get an AI-drafted answer, verified by your professor." },
  { num: "03", title: "Check your work", body: "Upload your rubric and assignment. Get AI feedback on your grade before you submit." },
  { num: "04", title: "Book office hours", body: "Request a meeting directly through D.I.Y.A and get a scheduled slot from your professor." },
];

const professorSteps = [
  { num: "01", title: "Create your group", body: "Set up a class group and share the invite code with your students in seconds." },
  { num: "02", title: "Review AI answers", body: "AI drafts answers to student questions. Approve, edit, or reject before they're visible." },
  { num: "03", title: "See engagement data", body: "AI surfaces which topics your students struggle with most, ranked by urgency." },
  { num: "04", title: "Manage requests", body: "Approve office hour requests and sync with Google Calendar or Outlook." },
];

// ─── Section Components ────────────────────────────────────────────────────────
function FadeSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function FeatureCard({ feature, delay }: { feature: typeof features[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <FadeSection delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "32px 28px",
          borderRadius: 18,
          backgroundColor: hovered ? "#fff" : "rgba(255,255,255,0.6)",
          border: "1px solid rgba(0,0,0,0.07)",
          backdropFilter: "blur(12px)",
          boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.1)" : "0 2px 12px rgba(0,0,0,0.04)",
          transition: "all 0.3s ease",
          cursor: "default",
        }}
      >
        <div style={{ color: "#a22237", marginBottom: 16 }}>{feature.icon}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 8, letterSpacing: "-0.01em" }}>{feature.title}</div>
        <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{feature.desc}</div>
      </div>
    </FadeSection>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif", color: "#111", overflowX: "hidden" }}>

      {/* ── Sticky Nav ── */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 60px)",
        backgroundColor: scrolled ? "rgba(255,255,255,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "none",
        transition: "background-color 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
      }}>
        <span style={{
          fontFamily: "Italiana, serif",
          fontSize: 22,
          fontWeight: 400,
          color: scrolled ? "#270115" : "#fff",
          letterSpacing: "0.04em",
          transition: "color 0.3s ease",
        }}>
          D.I.Y.A
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            to="/login"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: scrolled ? "#270115" : "rgba(255,255,255,0.9)",
              textDecoration: "none",
              padding: "7px 16px",
              borderRadius: 980,
              transition: "all 0.2s ease",
            }}
          >
            Log in
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              padding: "7px 18px",
              borderRadius: 980,
              backgroundColor: "#a22237",
              transition: "background-color 0.2s ease",
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: "100svh",
        background: "linear-gradient(160deg, #270115 0%, #5C1E26 35%, #8f3d48 65%, #a22237 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px clamp(20px, 6vw, 80px) 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80vw",
          height: "60vh",
          background: "radial-gradient(ellipse, rgba(251,245,240,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          fontSize: "clamp(11px, 1.4vw, 14px)",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(251,245,240,0.6)",
          marginBottom: 28,
        }}>
          AI-Powered Academic Support
        </div>

        <h1 style={{
          margin: "0 0 28px",
          fontSize: "clamp(44px, 7.5vw, 96px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: "#fff",
          maxWidth: 900,
        }}>
          The bridge between<br />
          <span style={{ color: "rgba(251,245,240,0.75)" }}>students and professors.</span>
        </h1>

        <p style={{
          margin: "0 0 48px",
          fontSize: "clamp(16px, 2vw, 22px)",
          fontWeight: 400,
          color: "rgba(251,245,240,0.65)",
          lineHeight: 1.55,
          maxWidth: 580,
        }}>
          D.I.Y.A connects your class with AI-assisted forums, instant assignment feedback, and smarter office hours.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to="/signup"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#270115",
              textDecoration: "none",
              padding: "14px 36px",
              borderRadius: 980,
              backgroundColor: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            Get started free
          </Link>
          <Link
            to="/login"
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              padding: "14px 36px",
              borderRadius: 980,
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              letterSpacing: "-0.01em",
            }}
          >
            Log in
          </Link>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.4 }}>
          <span style={{ fontSize: 11, color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase" }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── Tagline Strip ── */}
      <section style={{
        backgroundColor: "#f5f5f7",
        padding: "80px clamp(20px, 6vw, 80px)",
        textAlign: "center",
      }}>
        <FadeSection>
          <p style={{
            fontSize: "clamp(24px, 3.5vw, 44px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "#111",
            maxWidth: 800,
            margin: "0 auto",
          }}>
            Built for how modern classes actually work.
          </p>
          <p style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "#555",
            maxWidth: 560,
            margin: "20px auto 0",
            lineHeight: 1.6,
          }}>
            Real AI. Real answers. Professor-verified. D.I.Y.A turns every question into a learning moment — for the whole class.
          </p>
        </FadeSection>
      </section>

      {/* ── Features Grid ── */}
      <section style={{
        backgroundColor: "#fff",
        padding: "100px clamp(20px, 6vw, 80px)",
      }}>
        <FadeSection>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a22237", marginBottom: 14 }}>Features</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#111", margin: 0 }}>
              Everything your class needs
            </h2>
          </div>
        </FadeSection>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
          maxWidth: 1100,
          margin: "0 auto",
        }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ── For Students ── */}
      <section style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #270115 50%, #1a1a2e 100%)",
        padding: "100px clamp(20px, 6vw, 80px)",
        color: "#fff",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeSection>
            <div style={{ marginBottom: 60 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(251,245,240,0.5)", marginBottom: 14 }}>For Students</div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                Study smarter, not harder.
              </h2>
              <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "rgba(251,245,240,0.6)", marginTop: 16, maxWidth: 500, lineHeight: 1.6 }}>
                From AI-powered self-grading to instant answers — D.I.Y.A helps you stay on top of your coursework.
              </p>
            </div>
          </FadeSection>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            {studentSteps.map((s, i) => (
              <FadeSection key={s.num} delay={i * 80}>
                <div style={{ padding: "28px 24px", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "rgba(162,34,55,0.7)", marginBottom: 14, letterSpacing: "-0.02em" }}>{s.num}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </FadeSection>
            ))}
          </div>
          <FadeSection delay={400}>
            <div style={{ marginTop: 52 }}>
              <Link
                to="/signup"
                style={{
                  display: "inline-block",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#270115",
                  textDecoration: "none",
                  padding: "13px 32px",
                  borderRadius: 980,
                  backgroundColor: "#fff",
                }}
              >
                Join as student
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── For Professors ── */}
      <section style={{
        backgroundColor: "#f5f5f7",
        padding: "100px clamp(20px, 6vw, 80px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeSection>
            <div style={{ marginBottom: 60 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a22237", marginBottom: 14 }}>For Professors</div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#111", margin: 0 }}>
                Teach with confidence.
              </h2>
              <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "#555", marginTop: 16, maxWidth: 500, lineHeight: 1.6 }}>
                AI handles the first pass. You stay in control — reviewing, approving, and acting on real engagement data.
              </p>
            </div>
          </FadeSection>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            {professorSteps.map((s, i) => (
              <FadeSection key={s.num} delay={i * 80}>
                <div style={{
                  padding: "28px 24px",
                  borderRadius: 16,
                  backgroundColor: "#fff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "rgba(162,34,55,0.35)", marginBottom: 14, letterSpacing: "-0.02em" }}>{s.num}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </FadeSection>
            ))}
          </div>
          <FadeSection delay={400}>
            <div style={{ marginTop: 52 }}>
              <Link
                to="/signup"
                style={{
                  display: "inline-block",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  textDecoration: "none",
                  padding: "13px 32px",
                  borderRadius: 980,
                  backgroundColor: "#a22237",
                }}
              >
                Join as professor
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: "linear-gradient(135deg, #270115 0%, #a22237 100%)",
        padding: "100px clamp(20px, 6vw, 80px)",
        textAlign: "center",
        color: "#fff",
      }}>
        <FadeSection>
          <div style={{ fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 20 }}>
            Ready to transform your class?
          </div>
          <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "rgba(251,245,240,0.65)", marginBottom: 44, maxWidth: 480, margin: "0 auto 44px" }}>
            Join thousands of students and professors already using D.I.Y.A to make learning more effective.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/signup"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#a22237",
                textDecoration: "none",
                padding: "15px 40px",
                borderRadius: 980,
                backgroundColor: "#fff",
              }}
            >
              Create your account
            </Link>
            <Link
              to="/login"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
                padding: "15px 40px",
                borderRadius: 980,
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              Sign in
            </Link>
          </div>
        </FadeSection>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        backgroundColor: "#1d1d1f",
        padding: "40px clamp(20px, 6vw, 80px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
      }}>
        <span style={{ fontFamily: "Italiana, serif", fontSize: 20, color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em" }}>D.I.Y.A</span>
        <span>Digital Intake Yielding Answers · © {new Date().getFullYear()}</span>
        <div style={{ display: "flex", gap: 24 }}>
          <Link to="/login" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Log in</Link>
          <Link to="/signup" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
