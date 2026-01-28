"use client";
import { useMemo, useRef, useState } from "react";
const isMobile = typeof window !== "undefined" && window.innerWidth < 900;

export default function Home() {
  const [files, setFiles] = useState([]); // array of File
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState(""); // "", "ok", "err", "loading"

  const addInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const MAX_MB_PER_FILE = 5;
  const MAX_BYTES = MAX_MB_PER_FILE * 1024 * 1024;
  const MAX_FILES_SOFT = 100; // should match server MAX_FILES

  function dedupeByNameAndSize(arr) {
    const seen = new Set();
    const out = [];
    for (const f of arr) {
      const key = `${f.name}__${f.size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
    }
    return out;
  }

  function totalSizeMB(arr) {
    const total = arr.reduce((sum, f) => sum + (f?.size || 0), 0);
    return Math.round((total / (1024 * 1024)) * 10) / 10;
  }

  function formatCount(n) {
    return n === 1 ? "1 file" : `${n} files`;
  }

  function validateFilesOrSetError(fileList) {
    setError("");
    setWarning("");
    setSuccessNote("");

    if (!fileList) return null;
    const incoming = Array.from(fileList);

    const tooBig = incoming.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setError(`Max ${MAX_MB_PER_FILE}MB per file. “${tooBig.name}” is too large.`);
      return null;
    }

    return incoming;
  }

  // mode: "add" | "replace"
  function applyFiles(fileList, mode = "add") {
    const incoming = validateFilesOrSetError(fileList);
    if (!incoming) return;

    const merged =
      mode === "add"
        ? dedupeByNameAndSize([...files, ...incoming])
        : dedupeByNameAndSize(incoming);

    if (merged.length > MAX_FILES_SOFT) {
      setError(`Too many files selected (${merged.length}). Please keep it under ${MAX_FILES_SOFT} per run.`);
      return;
    }

    const size = totalSizeMB(merged);
    if (merged.length > 75) {
      setWarning("Large batches can be slower. Consider splitting into 2–3 runs.");
    } else if (size > 80) {
      setWarning("Big upload size. If it fails, try fewer files per run.");
    }

    setFiles(merged);
  }

  const fileCount = files.length;
  const sizeMB = useMemo(() => totalSizeMB(files), [files]);

  const fileNamesPreview = useMemo(() => {
    if (!files.length) return [];
    return files.map((f) => f.name).slice(0, 10);
  }, [files]);

  async function handleNotify() {
    setNotifyStatus("");
    const email = notifyEmail.trim();
    if (!email || !email.includes("@")) {
      setNotifyStatus("err");
      return;
    }

    try {
      setNotifyStatus("loading");
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();
      setNotifyStatus("ok");
      setNotifyEmail("");
    } catch {
      setNotifyStatus("err");
    }
  }

  async function handleGenerate() {
    if (!files.length || error) return;

    setLoading(true);
    setSuccessNote("");
    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);

      const res = await fetch("/api/generate", { method: "POST", body: formData });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Could not generate ZIP. Try fewer/smaller files.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "ReadyToSend.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccessNote("Packet generated. Check your Downloads folder.");
    } catch (e) {
      alert(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = !!fileCount && !loading && !error;

  const IconDoc = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 3h6l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );

  const step = !fileCount ? 1 : loading ? 2 : 3;

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(246,247,251,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e6e7ee",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <div>
              <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>ReadyToSend</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                Send-ready document packets in one ZIP
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {["No login", "Delete after ZIP", "Privacy-first"].map((t) => (
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

      {/* Main */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: isMobile ? "18px 14px 50px" : "28px 20px 70px",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
          color: "#111",
        }}
      >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.25fr 0.75fr",
          gap: 18,
          alignItems: "start",
        }}
      >

          {/* Left */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e6e7ee",
              borderRadius: 20,
              padding: 22,
              boxShadow: "0 10px 26px rgba(17,17,17,0.07)",
            }}
          >
            {/* Conversion header */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#333",
                background: "#f3f4f7",
                border: "1px solid #e7e8ef",
                padding: "6px 10px",
                borderRadius: 999,
                marginBottom: 12,
                fontWeight: 800,
              }}
            >
              ✓ Built for accountants, lawyers, immigration packets, and client handoffs
            </div>

            {/* UPDATED headline + subhead (value framing) */}
            <h1 style={{ fontSize: 32, margin: "10px 0 8px", lineHeight: 1.12 }}>
              Send documents once —{" "}
              <span style={{ textDecoration: "underline", textDecorationThickness: 3 }}>
                correctly, clearly, professionally
              </span>
              .
            </h1>

            <div style={{ marginTop: 8, fontSize: 14, color: "#333", fontWeight: 800 }}>
              No follow-ups. No “can you rename this?”. No confusion.
            </div>

            <p style={{ margin: "10px 0 0", color: "#444", fontSize: 14, lineHeight: 1.7 }}>
              Upload files → we create a folder plan → rename files → generate a ZIP with
              summary + timeline + file plan.
            </p>

            {/* Step indicator */}
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {[
                { n: 1, label: "Add files" },
                { n: 2, label: "Generate plan" },
                { n: 3, label: "Download ZIP" },
              ].map((s) => (
                <div
                  key={s.n}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 10px",
                    borderRadius: 999,
                    border: "1px solid #e6e7ee",
                    background: s.n === step ? "#111" : "#fff",
                    color: s.n === step ? "#fff" : "#333",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 8,
                      display: "grid",
                      placeItems: "center",
                      background: s.n === step ? "#fff" : "#f3f4f7",
                      color: s.n === step ? "#111" : "#333",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {s.n}
                  </span>
                  {s.label}
                </div>
              ))}
            </div>

            {/* Upload area */}
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                applyFiles(e.dataTransfer.files, "add");
              }}
              onClick={() => addInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") addInputRef.current?.click();
              }}
              style={{
                border: `2px dashed ${isDragOver ? "#111" : "#c9c9d6"}`,
                padding: 20,
                borderRadius: 18,
                background: isDragOver ? "#f1f2f6" : "#fafafe",
                marginTop: 16,
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    background: "#f3f4f7",
                    border: "1px solid #e1e2ea",
                    color: "#555",
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                  }}
                  aria-hidden="true"
                >
                  <IconDoc />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 2 }}>
                    {isDragOver ? "Drop to add files" : "Drag & drop files here"}
                  </div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    Click anywhere in this box to add files. Add more anytime.
                  </div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
                    Supported: JPG, PNG, PDF • Max {MAX_MB_PER_FILE}MB per file
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => addInputRef.current?.click()}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #d9d9e3",
                      background: "#111",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    Add files
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        files.length &&
                        !confirm("This will replace your current selection. Continue?")
                      )
                        return;
                      replaceInputRef.current?.click();
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #d9d9e3",
                      background: "#fff",
                      color: "#111",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                    title="Replaces your current selection"
                  >
                    Start over (Replace all)…
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      setError("");
                      setWarning("");
                      setSuccessNote("");
                    }}
                    disabled={!fileCount || loading}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #d9d9e3",
                      background: "#fff",
                      color: "#111",
                      cursor: !fileCount || loading ? "not-allowed" : "pointer",
                      fontSize: 13,
                      fontWeight: 900,
                      opacity: !fileCount || loading ? 0.6 : 1,
                    }}
                  >
                    Clear selection
                  </button>
                </div>

                <input
                  ref={addInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    applyFiles(e.target.files, "add");
                    e.target.value = "";
                  }}
                />
                <input
                  ref={replaceInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    applyFiles(e.target.files, "replace");
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {/* Selected + alerts */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: "#333" }}>
                {fileCount ? (
                  <div style={{ fontWeight: 900 }}>
                    {formatCount(fileCount)} selected • {sizeMB}MB total
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>No files selected yet.</div>
                )}
              </div>

              {fileCount ? (
                <div style={{ marginTop: 8, color: "#555", fontSize: 13 }}>
                  {fileNamesPreview.map((n) => (
                    <div key={n} style={{ display: "flex", gap: 8 }}>
                      <span aria-hidden="true">•</span>
                      <span>{n}</span>
                    </div>
                  ))}
                  {fileCount > 10 ? <div style={{ marginTop: 4 }}>• …</div> : null}
                </div>
              ) : null}

              {error ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#fff3f4",
                    border: "1px solid #ffd0d5",
                    color: "#8a0010",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              ) : null}

              {warning ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#fff8e6",
                    border: "1px solid #ffe1a6",
                    color: "#6b4e00",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  {warning}
                </div>
              ) : null}

              {successNote ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#effaf1",
                    border: "1px solid #c8f0d0",
                    color: "#0f5a1a",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  {successNote}
                </div>
              ) : null}
            </div>

            {/* CTA */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 10,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <div style={{ minWidth: 240 }}>
                {/* UPDATED pricing anchor */}
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                  Typical value: <b>$9 per packet</b> • Free during MVP
                </div>

                {/* UPDATED CTA text */}
                <button
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #111",
                    background: canGenerate ? "#111" : "#ddd",
                    color: canGenerate ? "#fff" : "#666",
                    cursor: canGenerate ? "pointer" : "not-allowed",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  {loading ? "Preparing packet…" : "Create send-ready packet"}
                </button>

                {/* UPDATED guarantee/trust snippet */}
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#f7f9ff",
                    border: "1px solid #dde3ff",
                    color: "#1a2b6b",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  If the output isn’t useful, don’t use it. No account, no lock-in.
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid #e6e7ee",
                  background: "#fff",
                  color: "#444",
                  fontSize: 12,
                  lineHeight: 1.55,
                }}
              >
                <div style={{ fontWeight: 900, color: "#111", marginBottom: 3 }}>
                  Trust & privacy
                </div>
                <div>
                  Use it for documents you’d share with a service provider. Temporary
                  processing files are deleted after ZIP generation.
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e6e7ee",
                borderRadius: 20,
                padding: 18,
                boxShadow: "0 10px 26px rgba(17,17,17,0.07)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Who this is for</div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>
                Tax prep • Immigration packets • Legal packets • Freelancers • Client
                handoff • Personal records
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e6e7ee",
                borderRadius: 20,
                padding: 18,
                boxShadow: "0 10px 26px rgba(17,17,17,0.07)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>What you get</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#444" }}>
                <li>ReadyToSend.zip with folders + renamed files</li>
                <li>Overview summary for the recipient</li>
                <li>Timeline of key events (if found)</li>
                <li>File plan explaining each decision</li>
              </ul>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e6e7ee",
                borderRadius: 20,
                padding: 18,
                boxShadow: "0 10px 26px rgba(17,17,17,0.07)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                Why people reuse it
              </div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>
                Every time you need to send documents, you want them to look organized.
                This creates the same clean packet every time.
              </div>
            </div>

            <div
              style={{
                background: "#111",
                color: "#fff",
                borderRadius: 20,
                padding: 18,
                boxShadow: "0 10px 26px rgba(17,17,17,0.2)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Want faster + unlimited?</div>
              <div style={{ fontSize: 13, color: "#ddd", lineHeight: 1.6 }}>
                Paid plan will include higher batch limits, faster processing, and saved folder preferences.
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <input
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    outline: "none",
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={handleNotify}
                  disabled={notifyStatus === "loading"}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #fff",
                    background: "#fff",
                    color: "#111",
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: notifyStatus === "loading" ? "not-allowed" : "pointer",
                    opacity: notifyStatus === "loading" ? 0.7 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {notifyStatus === "loading" ? "Saving…" : "Notify me"}
                </button>
              </div>

              {notifyStatus === "ok" ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "#b7ffbf", fontWeight: 800 }}>
                  Added. You’ll be notified when plans launch.
                </div>
              ) : null}

              {notifyStatus === "err" ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "#ffb7b7", fontWeight: 800 }}>
                  Enter a valid email and try again.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 18,
            fontSize: 12,
            color: "#777",
            display: "flex",
            gap: 12,
          }}
        >
          <span>© {new Date().getFullYear()} ReadyToSend. MVP.</span>
          <a href="/privacy" style={{ color: "#555" }}>
            Privacy
          </a>
          <a href="/terms" style={{ color: "#555" }}>
            Terms
          </a>
        </div>
      </div>
    </div>
  );
}
