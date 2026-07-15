import { NextResponse } from "next/server";
import { requireApiSecret } from "@/lib/api/auth";
import { AppError, toErrorResponse } from "@/lib/api/errors";
import { getClientIp, rateLimit } from "@/lib/api/rateLimit";
import { requireString } from "@/lib/api/validate";
import { config } from "@/lib/config";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    requireApiSecret(request);

    const ip = getClientIp(request);
    rateLimit(
      `contact:${ip}`,
      config.rateLimitContactPerHour,
      60 * 60 * 1000,
      "Too many contact submissions. Try again later.",
    );

    const formData = await request.formData();
    const name = requireString(formData.get("name"), "name", 120);
    const email = requireString(formData.get("email"), "email", 200);
    const message = requireString(formData.get("message"), "message", 5000);

    if (!EMAIL_RE.test(email)) {
      throw new AppError("Invalid email address", 400, "VALIDATION_ERROR");
    }

    // No mail provider configured yet — accept and log for local/dev use.
    console.info("Contact form submission", {
      name,
      email,
      message: message.slice(0, 500),
      ip,
      at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
