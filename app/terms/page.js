export default function Terms() {
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
      {/* Top bar (matches your site) */}
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
            {["MVP", "No login"].map((t) => (
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
            Terms of Service
          </h1>

          <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
            Last updated: <b>{lastUpdated}</b>
          </div>

          <p style={{ marginTop: 14, color: "#444", fontSize: 14, lineHeight: 1.7 }}>
            By using ReadyToSend, you agree to these Terms. If you don’t agree, do not
            use the service.
          </p>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <Section title="What the service does">
              <div style={p}>
                ReadyToSend helps you generate an organized ZIP packet from the files you
                upload. The output may include folders, renamed files, summaries, timelines,
                and an organization plan.
              </div>
            </Section>

            <Section title="MVP / “as is”">
              <div style={p}>
                This is an MVP provided <b>“as is”</b> and <b>“as available”</b>.
                We do not guarantee uninterrupted operation, error-free results, or that the
                output will meet your needs.
              </div>
            </Section>

            <Section title="Your responsibilities">
              <ul style={ulStyle}>
                <li>
                  <b>Review everything</b> before sending to anyone. You are responsible for
                  verifying filenames, folders, summaries, and timelines.
                </li>
                <li>
                  You are responsible for complying with applicable laws and any contractual
                  or professional obligations (e.g., client confidentiality).
                </li>
              </ul>
            </Section>

            <Section title="Do not upload sensitive information">
              <div style={p}>
                Do not upload highly sensitive information (e.g., passwords, private keys,
                full SSNs, bank login credentials, medical records you would not share with a
                typical service provider).
              </div>
            </Section>

            <Section title="Intellectual property">
              <ul style={ulStyle}>
                <li>You retain your rights to the files you upload.</li>
                <li>
                  You grant us a limited right to process your uploaded content solely to
                  operate the service and generate your ZIP output.
                </li>
              </ul>
            </Section>

            <Section title="Limitation of liability">
              <div style={p}>
                To the maximum extent permitted by law, ReadyToSend will not be liable for
                any indirect, incidental, special, consequential, or punitive damages, or any
                loss of data, profits, or business arising from your use of the service.
              </div>
            </Section>

            <Section title="Changes">
              <div style={p}>
                We may update these Terms from time to time. The “Last updated” date will
                change when we do. Continued use after changes means you accept the updated
                Terms.
              </div>
            </Section>

            <Section title="Contact">
              <div style={p}>
                For questions, add a real support email address here once you have it
                (example: <b>support@yourdomain.com</b>).
              </div>
            </Section>
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

const p = { color: "#444", fontSize: 14, lineHeight: 1.7, margin: 0 };

const ulStyle = {
  margin: 0,
  paddingLeft: 18,
  color: "#444",
  fontSize: 14,
  lineHeight: 1.7,
};

