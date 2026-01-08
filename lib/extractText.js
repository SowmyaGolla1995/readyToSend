import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractText(filePath) {
  const lower = filePath.toLowerCase();

  // PDF: skip for now (we’ll re-enable later once stable)
  if (lower.endsWith(".pdf")) {
    return "";
  }

  // Images: use OpenAI Vision OCR
  if (lower.match(/\.(png|jpg|jpeg|webp)$/)) {
    const b64 = fs.readFileSync(filePath, { encoding: "base64" });
    const mime =
      lower.endsWith(".png") ? "image/png" :
      lower.endsWith(".webp") ? "image/webp" :
      "image/jpeg";

    const res = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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

    return res.choices[0].message.content || "";
  }

  return "";
}
