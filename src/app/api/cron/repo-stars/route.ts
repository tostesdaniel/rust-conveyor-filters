import type { NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import { Octokit } from "octokit";

import { siteConfig } from "@/config/site";

const GITHUB_REPO_OWNER = siteConfig.links.repo.split("/")[3];
const GITHUB_REPO_NAME = siteConfig.links.repo.split("/")[4];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
  const { data } = await octokit.rest.repos.get({
    owner: GITHUB_REPO_OWNER,
    repo: GITHUB_REPO_NAME,
  });

  await kv.set("repo-stars", data.stargazers_count);

  return Response.json({ success: true });
}
