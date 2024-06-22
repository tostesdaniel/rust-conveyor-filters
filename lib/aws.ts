import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

export async function getPresignedUrl(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    return getSignedUrl(client, command, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function getAllObjects() {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME!,
  });

  try {
    const { Contents } = await client.send(command);
    if (Contents) {
      const signedUrls = await Promise.all(
        Contents.map((content) => getPresignedUrl(content.Key!)),
      );
      return signedUrls;
    }
  } catch (error) {
    throw Error;
  }
}
