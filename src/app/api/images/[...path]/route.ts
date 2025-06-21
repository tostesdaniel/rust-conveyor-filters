import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const imagePath = path.join("/");

  try {
    const command = new GetObjectCommand({
      Bucket: "rustconveyorfilters",
      Key: imagePath,
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
        "CDN-Cache-Control": "public, max-age=31536000",
        ETag: response.ETag || "",
      },
    });
  } catch (error) {
    console.error("Error fetching from R2:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
