export default function Privacy() {
  const year = new Date().getFullYear();
  const lastUpdated = "Jan 27, 2026"; // update when you change this page

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        color: "#111",
      }}
    >
      {/* Simple top bar (matches your site) */}
      <div
        style={{
          borderBottom: "1px solid #e6e7ee",
          background: "rgba(246,247,251,0.92)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "#111",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 12,
                background: "#111",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 14,
              }}
              aria-hidden="true"
            >
              R
            </div>
            <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>ReadyToSend</div>
          </a>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["No login", "Privacy-first"].map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 12,
                  color: "#333",
                  padding: "6px 10px",
                  border: "1px solid #e0e0ea",
                  borderRadius: 999,
                  background: "#fff",
                  fontWeight: 800,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 50px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e6e7ee",
            borderRadius: 20,
            padding: 22,
            boxShadow: "0 10px 26px rgba(17,17,17,0.07)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>
            Privacy Policy
          </h1>

          <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
            Last updated: <b>{lastUpdated}</b>
          </div>

          <p style={{ marginTop: 14, color: "#444", fontSize: 14, lineHeight: 1.7 }}>
            ReadyToSend processes the files you upload only to generate your organized ZIP
            (folders, renamed files, summary, timeline, and file plan).
          </p>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <Section title="What we collect">
              <ul style={ulStyle}>
                <li>
                  <b>Your uploaded files</b> (e.g., PDFs, images) are received by our
                  server to extract text and generate your ZIP.
                </li>
                <li>
                  <b>Basic technical logs</b> (e.g., errors, timing) may be captured to
                  keep the service reliable.
                </li>
              </ul>
            </Section>

            <Section title="How we use your data">
              <ul style={ulStyle}>
                <li>To extract text from your files.</li>
                <li>To generate an organization plan and your ZIP output.</li>
                <li>To troubleshoot reliability issues (e.g., timeouts, failures).</li>
              </ul>
            </Section>

            <Section title="File retention & deletion">
              <ul style={ulStyle}>
                <li>
                  We create temporary processing files during ZIP generation and delete
                  them after generation completes.
                </li>
                <li>
                  Do not upload anything you wouldn’t share with a typical service
                  provider.
                </li>
              </ul>
            </Section>

            <Section title="Accounts & tracking">
              <ul style={ulStyle}>
                <li>No user accounts.</li>
                <li>No ads.</li>
                <li>No selling of your data.</li>
              </ul>
            </Section>

            <Section title="Third-party services">
              <ul style={ulStyle}>
                <li>
                  Hosting/provider logs and infrastructure may process requests to run
                  the service (standard web hosting behavior).
                </li>
                <li>
                  If you use AI services via API in your backend, those providers may
                  process extracted text as part of the request.
                </li>
              </ul>
            </Section>

            {/* <Section title="Contact">
              <div style={{ color: "#444", fontSize: 14, lineHeight: 1.7 }}>
                For questions, add a real support email address here once you have it
                (example: <b>support@yourdomain.com</b>).
              </div>
            </Section> */}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "#777" }}>
          © {year} ReadyToSend.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #e6e7ee",
        borderRadius: 16,
        padding: 16,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

const ulStyle = {
  margin: 0,
  paddingLeft: 18,
  color: "#444",
  fontSize: 14,
  lineHeight: 1.7,
};
