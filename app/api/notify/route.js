export const runtime = "nodejs";

import fs from "fs";
import path from "path";

function isValidEmail(email) {
  if (!email) return false;
  const e = String(email).trim();
  return e.includes("@") && e.includes(".");
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!isValidEmail(email)) {
      return new Response("Invalid email", { status: 400 });
    }

    // MVP storage: write to local file (works locally; on Vercel it’s ephemeral)
    // For production, replace with a DB (Supabase/Firebase) or an email tool (Mailchimp/Beehiiv).
    const outDir = path.join(process.cwd(), "data");
    const outPath = path.join(outDir, "waitlist.txt");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    fs.appendFileSync(outPath, `${new Date().toISOString()}  ${email}\n`);

    return new Response("ok", { status: 200 });
  } catch {
    return new Response("Bad request", { status: 400 });
  }
}

