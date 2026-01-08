import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getExt(filename) {
  const f = filename || "";
  const i = f.lastIndexOf(".");
  return i >= 0 ? f.slice(i).toLowerCase() : "";
}

function extractFileNames(allText) {
  // Matches lines like: === FILE: something ===
  const re = /^=== FILE:\s*(.+?)\s*===\s*$/gim;
  const names = [];
  let m;
  while ((m = re.exec(allText)) !== null) {
    names.push(m[1].trim());
  }
  return names;
}

export async function organize(allText) {
  const originals = extractFileNames(allText);
  const originalsBlock = originals.length
    ? originals.map((n) => `- ${n}`).join("\n")
    : "(none found)";

  const prompt = `
Return ONLY valid JSON with this exact shape:
{
  "summary_for_recipient": "string",
  "timeline": [{"date_or_period":"string","event":"string"}],
  "folders": ["Income","Expenses","Bank_Statements","Emails","Contracts","IDs","Medical","Education","Other","Unsorted"],
  "file_plan": [
    {
      "original":"string",
      "folder":"string",
      "new_name":"string",
      "reason":"string"
    }
  ]
}

CRITICAL RULES:
- Create exactly ONE file_plan entry for EACH original filename listed below.
- "original" MUST exactly match one of the originals (character-for-character).
- "folder" MUST be exactly one of the values in "folders".
- If not confident, choose folder="Unsorted".
- "new_name" MUST keep the SAME file extension as the original (e.g., .jpg stays .jpg).
- "new_name" should be short, readable, and avoid special characters. Use underscores if needed.
- "reason" must be 5-12 words, describing why that folder was chosen.
- No advice. No new facts. Only organize provided content.

ORIGINAL FILENAMES (must cover all of them):
${originalsBlock}

CONTENT:
${allText}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0].message.content || "{}";

  // Hard validation: ensure file_plan covers every original; else fallback to Unsorted plan
  try {
    const parsed = JSON.parse(raw);
    const plan = Array.isArray(parsed.file_plan) ? parsed.file_plan : [];
    const seen = new Set(plan.map((p) => p?.original).filter(Boolean));

    const fixedPlan = originals.map((orig) => {
      const ext = getExt(orig);
      const found = plan.find((p) => p?.original === orig);
      if (found && typeof found.new_name === "string") {
        const nn = found.new_name.trim();
        const nnExt = getExt(nn);
        return {
          original: orig,
          folder: found.folder || "Unsorted",
          new_name: nnExt === ext ? nn : (nn + ext),
          reason: found.reason || "No reason provided",
        };
      }
      // fallback entry
      const base = orig.replace(ext, "").slice(0, 40) || "file";
      return {
        original: orig,
        folder: "Unsorted",
        new_name: `${base}${ext}`,
        reason: "Insufficient signal to classify confidently",
      };
    });

    const out = {
      summary_for_recipient: parsed.summary_for_recipient || "",
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      folders: [
        "Income","Expenses","Bank_Statements","Emails","Contracts","IDs","Medical","Education","Other","Unsorted"
      ],
      file_plan: fixedPlan,
    };

    return JSON.stringify(out);
  } catch {
    // Total fallback
    const folders = ["Income","Expenses","Bank_Statements","Emails","Contracts","IDs","Medical","Education","Other","Unsorted"];
    const file_plan = originals.map((orig) => {
      const ext = getExt(orig);
      const base = orig.replace(ext, "").slice(0, 40) || "file";
      return {
        original: orig,
        folder: "Unsorted",
        new_name: `${base}${ext}`,
        reason: "Failed to parse model output",
      };
    });

    return JSON.stringify({
      summary_for_recipient: "",
      timeline: [],
      folders,
      file_plan,
    });
  }
}
