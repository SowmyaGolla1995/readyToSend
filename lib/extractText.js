import OpenAI from "openai";
import pdfParse from "pdf-parse"; // npm i pdf-parse

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extFromName(name = "") {
  const lower = name.toLowerCase();
  const idx = lower.lastIndexOf(".");
  return idx >= 0 ? lower.slice(idx) : "";
}

function mimeFromExt(ext) {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg"; // jpg/jpeg default
}

// bytes: Buffer
export async function extractTextFromBytes(bytes, filename = "upload") {
  const ext = extFromName(filename);

  // PDF: extract embedded text (fast). For scanned PDFs, you’d need per-page OCR (heavier).
  if (ext === ".pdf") {
    try {
      const parsed = await pdfParse(bytes);
      return parsed?.text || "";
    } catch {
      return "";
    }
  }

  // Images: OCR via OpenAI Vision
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    const b64 = bytes.toString("base64");
    const mime = mimeFromExt(ext);

    const res = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all readable text from this image. Return only the text." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
          ],
        },
      ],
    });

    return res.choices?.[0]?.message?.content || "";
  }

  return "";
}
