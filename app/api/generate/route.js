export const runtime = "nodejs";

import JSZip from "jszip";
import { extractTextFromBytes } from "../../../lib/extractText"; // <-- update import
import { organize } from "../../../lib/organize";

function sanitizeName(name) {
  return (name || "file").replace(/[^\w.\-]+/g, "_");
}

function ensureExt(original, suggested) {
  const o = original || "";
  const s = suggested || "";
  const oExt = o.includes(".") ? "." + o.split(".").pop() : "";
  const sExt = s.includes(".") ? "." + s.split(".").pop() : "";
  if (!oExt) return s;
  if (!sExt) return s + oExt;
  if (oExt.toLowerCase() !== sExt.toLowerCase()) {
    return s.replace(new RegExp(sExt.replace(".", "\\.") + "$", "i"), oExt);
  }
  return s;
}

function uniquePath(used, folder, filename) {
  let base = filename;
  let ext = "";
  if (filename.includes(".")) {
    ext = "." + filename.split(".").pop();
    base = filename.slice(0, -ext.length);
  }

  let candidate = `${folder}/${filename}`;
  let i = 1;
  while (used.has(candidate)) {
    candidate = `${folder}/${base}_${i}${ext}`;
    i++;
  }
  used.add(candidate);
  return candidate;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("AI request timed out")), ms);
    promise
      .then((res) => {
        clearTimeout(id);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

// Concurrency limiter to speed up OCR but not overload
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;

  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

export async function POST(request) {
  const formData = await request.formData();
  const files = formData.getAll("files");

  const MAX_MB_PER_FILE = 5;
  const MAX_BYTES = MAX_MB_PER_FILE * 1024 * 1024;

  // Keep your server safety cap
  const MAX_FILES = 100;

  // Keep your combined extracted text guard
  const MAX_TEXT_CHARS = 30000;

  // Tune this for speed vs reliability
  const EXTRACT_CONCURRENCY = 4;

  if (!files || files.length === 0) {
    return new Response("No files uploaded", { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return new Response(
      `Too many files: ${files.length}. Max ${MAX_FILES} per run. Please split into smaller batches.`,
      { status: 400 }
    );
  }

  for (const f of files) {
    if (typeof f?.size === "number" && f.size > MAX_BYTES) {
      return new Response(
        `File too large: ${f.name}. Max ${MAX_MB_PER_FILE}MB per file.`,
        { status: 400 }
      );
    }
  }

  console.log("generate: start", { files: files.length });

  // 1) Read bytes + extract text in parallel
  let extracted;
  try {
    extracted = await mapLimit(files, EXTRACT_CONCURRENCY, async (file) => {
      if (!file || typeof file.arrayBuffer !== "function") return null;

      const bytes = Buffer.from(await file.arrayBuffer());
      const safeName = sanitizeName(file.name || "upload");

      // IMPORTANT: This calls your OCR/PDF extractor
      const text = await extractTextFromBytes(bytes, safeName);

      return { safeName, bytes, text: text || "" };
    });
  } catch (err) {
    console.log("generate: extract_error", { message: String(err?.message || err) });
    return new Response("Failed to extract text from one or more files.", { status: 500 });
  }

  // 2) Build combinedText with a running length check (fast fail)
  const fileBytesByName = new Map();
  let combinedText = "";

  for (const item of extracted) {
    if (!item) continue;

    fileBytesByName.set(item.safeName, item.bytes);

    const nextChunk = `\n\n=== FILE: ${item.safeName} ===\n${item.text}`;
    if (combinedText.length + nextChunk.length > MAX_TEXT_CHARS) {
      console.log("generate: reject_text_limit", {
        limit: MAX_TEXT_CHARS,
        files: files.length,
      });
      return new Response(
        `Total extracted text exceeds limit (${MAX_TEXT_CHARS} characters). Please upload fewer or smaller files.`,
        { status: 400 }
      );
    }

    combinedText += nextChunk;
  }

  // 3) Organize with timeout
  let aiOutput;
  try {
    aiOutput = await withTimeout(organize(combinedText), 45000);
  } catch (err) {
    console.log("generate: timeout_or_ai_error", { message: String(err?.message || err) });
    return new Response(
      "The request took too long. Please try fewer or smaller files.",
      { status: 408 }
    );
  }

  // 4) Parse AI response (fallback)
  let parsed;
  try {
    parsed = JSON.parse(aiOutput);
  } catch {
    parsed = {
      summary_for_recipient: aiOutput,
      timeline: [],
      file_plan: [],
      folders: [
        "Income",
        "Expenses",
        "Bank_Statements",
        "Emails",
        "Contracts",
        "IDs",
        "Medical",
        "Education",
        "Other",
        "Unsorted",
      ],
    };
  }

  const planMap = new Map();
  for (const p of parsed.file_plan || []) {
    if (!p?.original) continue;
    planMap.set(p.original, {
      folder: sanitizeName(p.folder || "Unsorted"),
      newName: sanitizeName(p.new_name || p.original),
    });
  }

  // 5) Zip
  const zip = new JSZip();

  zip.file("Overview_Summary.txt", parsed.summary_for_recipient || "No summary generated.");

  const timelineLines = (parsed.timeline || []).map(
    (t) => `- ${t.date_or_period}: ${t.event}`
  );
  zip.file("Timeline.txt", timelineLines.length ? timelineLines.join("\n") : "No timeline found.");

  const folders = (parsed.folders || [
    "Income",
    "Expenses",
    "Bank_Statements",
    "Emails",
    "Contracts",
    "IDs",
    "Medical",
    "Education",
    "Other",
    "Unsorted",
  ]).map(sanitizeName);

  for (const f of folders) zip.folder(f);

  const usedPaths = new Set();

  for (const [originalName, bytes] of fileBytesByName.entries()) {
    const rec = planMap.get(originalName);

    const folder = rec?.folder && folders.includes(rec.folder) ? rec.folder : "Unsorted";
    let newName = rec?.newName ? rec.newName : originalName;

    newName = sanitizeName(ensureExt(originalName, newName));
    const fullPath = uniquePath(usedPaths, folder, newName);
    zip.file(fullPath, bytes);
  }

  zip.file(
    "Folders.txt",
    folders.length
      ? folders.join("\n")
      : "Income\nExpenses\nBank_Statements\nEmails\nContracts\nIDs\nMedical\nEducation\nOther\nUnsorted"
  );

  zip.file(
    "File_Plan.txt",
    (parsed.file_plan || []).length
      ? parsed.file_plan
          .map((p) => `${p.original} -> ${p.folder}/${p.new_name} (${p.reason})`)
          .join("\n")
      : "No file plan generated."
  );

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  console.log("generate: success", { files: files.length });

  return new Response(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="ReadyToSend.zip"',
    },
  });
}
