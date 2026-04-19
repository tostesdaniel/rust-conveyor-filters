import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_MS = 5 * 60 * 1000;

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function verifyPaynowSignature({
  rawBody,
  signatureHeader,
  timestampHeader,
  secret,
  now = Date.now(),
}: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  now?: number;
}): VerifyResult {
  if (!signatureHeader || !timestampHeader) {
    return { ok: false, reason: "Missing PayNow signature headers" };
  }

  const timestamp = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: "Invalid PayNow timestamp" };
  }

  if (Math.abs(now - timestamp) > TOLERANCE_MS) {
    return { ok: false, reason: "PayNow timestamp out of tolerance" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(signatureHeader, "base64");
  } catch {
    return { ok: false, reason: "Invalid PayNow signature encoding" };
  }

  if (provided.length !== expected.length) {
    return { ok: false, reason: "PayNow signature length mismatch" };
  }

  if (!timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "PayNow signature mismatch" };
  }

  return { ok: true };
}
