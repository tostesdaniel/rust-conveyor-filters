import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "edge";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Only shape getR2ImageUrl asks for. Without it this route reads the whole bucket.
const KEY_PREFIX = "items";
const ALLOWED_SIZES = new Set(["tiny", "small", "medium", "full"]);
const ALLOWED_IMAGE_NAME = /^[a-z0-9][a-z0-9._-]*\.webp$/i;

function hasControlChar(segment: string): boolean {
  for (let i = 0; i < segment.length; i++) {
    const code = segment.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

function isSafeSegment(segment: string): boolean {
  return (
    segment.length > 0 &&
    !segment.includes("..") &&
    !segment.includes("\\") &&
    !segment.startsWith("/") &&
    !hasControlChar(segment)
  );
}

function resolveKey(path: string[]): string | null {
  if (path.length !== 3) return null;
  if (!path.every(isSafeSegment)) return null;

  const [prefix, size, imageName] = path;
  if (prefix !== KEY_PREFIX) return null;
  if (!ALLOWED_SIZES.has(size)) return null;
  if (!ALLOWED_IMAGE_NAME.test(imageName)) return null;

  return path.join("/");
}

// No per-IP limit: the CDN absorbs repeats, so only the first miss per key hits R2.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const imagePath = resolveKey(path);

  // 404 rather than 403 so this does not confirm what sits outside items/.
  if (!imagePath) {
    return new NextResponse("Image not found", { status: 404 });
  }

  try {
    // Check if client already has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    const ifModifiedSince = request.headers.get("if-modified-since");

    const command = new GetObjectCommand({
      Bucket: "rustconveyorfilters",
      Key: imagePath,
      // Use conditional requests to avoid downloading if not modified
      IfNoneMatch: ifNoneMatch || undefined,
      IfModifiedSince: ifModifiedSince ? new Date(ifModifiedSince) : undefined,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const imageBuffer = await response.Body.transformToByteArray();

    const arrayBuffer = new Uint8Array(imageBuffer).buffer;

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": response.ContentType || "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
        ETag: response.ETag || "",
        "Last-Modified":
          response.LastModified?.toUTCString() || new Date().toUTCString(),
      },
    });
  } catch (error) {
    // Handle 304 Not Modified
    if (error instanceof Error && error.name === "NotModified") {
      return new NextResponse(null, { status: 304 });
    }

    console.error("Error fetching from R2:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
