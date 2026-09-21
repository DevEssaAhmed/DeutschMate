import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RateBucket = { count: number; resetAt: number };
const buckets = new Map<string, RateBucket>();
const LIMIT = 12;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > LIMIT;
}

function extractAudio(payload: any) {
  if (payload?.output_audio?.data) {
    return {
      data: payload.output_audio.data as string,
      mimeType: payload.output_audio.mime_type || "audio/wav",
    };
  }

  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const content = steps[i]?.content;
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (item?.type === "audio" && typeof item?.data === "string") {
        return { data: item.data, mimeType: item.mime_type || "audio/wav" };
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json({ error: "Too many listening-audio requests. Please try again shortly." }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini audio is not configured on this deployment yet." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, 9000) : "";
  if (!text) return NextResponse.json({ error: "Listening text is required." }, { status: 400 });

  const spokenText = text
    .replace(/^[A-ZÄÖÜ]:\s*/gm, "")
    .replace(/^Sprecher\/in:\s*/gm, "")
    .trim();

  const input = [
    "Synthesize the following German listening exercise in natural Standard German (de-DE).",
    "Keep a realistic conversational pace and clear articulation. Do not read stage directions or speaker labels.",
    "Use natural sentence rhythm rather than a robotic teaching voice.",
    "",
    "TRANSCRIPT:",
    spokenText,
  ].join("\n");

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.1-flash-tts-preview",
        input,
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [{ voice: "Kore" }],
        },
        store: false,
      }),
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = typeof payload?.error?.message === "string" ? payload.error.message : "Gemini speech generation failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const audio = extractAudio(payload);
    if (!audio) return NextResponse.json({ error: "Gemini returned no audio." }, { status: 502 });

    return NextResponse.json(audio, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not reach Gemini speech generation." }, { status: 502 });
  }
}
