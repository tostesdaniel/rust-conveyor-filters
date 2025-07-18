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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const imagePath = path.join("/");

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

    return new NextResponse(imageBuffer, {
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
